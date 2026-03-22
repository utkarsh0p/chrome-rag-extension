from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)


def get_top_chunks(query, chunks, embedding=None):
    """Return top-3 most relevant chunks via embedding similarity or TF-IDF fallback."""
    if embedding:
        doc_vectors  = embedding.embed_documents(chunks)
        query_vector = embedding.embed_query(query)
        scores = cosine_similarity([query_vector], doc_vectors)[0]
    else:
        # TF-IDF fallback — used when provider has no dedicated embeddings API (e.g. Claude)
        vectorizer = TfidfVectorizer()
        matrix     = vectorizer.fit_transform(chunks + [query])
        scores     = cosine_similarity(matrix[-1], matrix[:-1])[0]

    top_indices = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:3]
    return "\n\n".join(chunks[i] for i, _ in top_indices)


@app.route("/chat", methods=["POST"])
def chat():
    data     = request.json
    query    = data["query"]
    chunks   = data["chunks"]
    model_id = data.get("model")          # selected model from popup
    token    = request.headers.get("Token")
    provider = request.headers.get("Provider", "huggingface").lower()

    if provider == "openai":
        from langchain_openai import OpenAIEmbeddings, ChatOpenAI
        embedding = OpenAIEmbeddings(api_key=token)
        llm       = ChatOpenAI(model=model_id or "gpt-4o-mini", api_key=token)
        context   = get_top_chunks(query, chunks, embedding)

    elif provider == "gemini":
        from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
        embedding = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001", google_api_key=token
        )
        llm     = ChatGoogleGenerativeAI(
            model=model_id or "gemini-2.0-flash", google_api_key=token
        )
        context = get_top_chunks(query, chunks, embedding)

    elif provider == "claude":
        from langchain_anthropic import ChatAnthropic
        llm     = ChatAnthropic(model=model_id or "claude-3-5-haiku-20241022", api_key=token)
        context = get_top_chunks(query, chunks)  # TF-IDF (Anthropic has no embeddings API)

    else:  # huggingface (default)
        from langchain_huggingface import HuggingFaceEndpointEmbeddings, HuggingFaceEndpoint, ChatHuggingFace
        embedding = HuggingFaceEndpointEmbeddings(
            repo_id="sentence-transformers/all-MiniLM-L6-v2",
            huggingfacehub_api_token=token
        )
        hf_model = HuggingFaceEndpoint(
            repo_id=model_id or "meta-llama/Llama-3.1-8B-Instruct",
            task="text-generation",
            huggingfacehub_api_token=token
        )
        llm     = ChatHuggingFace(llm=hf_model)
        context = get_top_chunks(query, chunks, embedding)

    prompt = f"""Answer the question using ONLY the context below.

Context:
{context}

Question:
{query}"""

    response = llm.invoke(prompt)
    if hasattr(response, "content"):
        response = response.content

    return jsonify({"answer": response})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
