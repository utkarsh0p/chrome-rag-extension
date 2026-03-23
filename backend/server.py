from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

app = Flask(__name__)
CORS(app)


def get_top_chunks(query, chunks, embedding=None):
    """Return top-3 most relevant chunks via cosine similarity or TF-IDF fallback."""
    if embedding:
        doc_vectors  = embedding.embed_documents(chunks)
        query_vector = embedding.embed_query(query)
        scores = cosine_similarity([query_vector], doc_vectors)[0]
    else:
        vectorizer = TfidfVectorizer()
        matrix     = vectorizer.fit_transform(chunks + [query])
        scores     = cosine_similarity(matrix[-1], matrix[:-1])[0]

    top_indices = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:3]
    return "\n\n".join(chunks[i] for i, _ in top_indices)


def extract_text(response):
    """Normalise LLM response to a plain string regardless of provider."""
    if isinstance(response, str):
        return response
    if hasattr(response, "content"):
        return response.content
    return str(response)


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data     = request.json
        query    = data["query"]
        chunks   = data["chunks"]
        model_id = data.get("model")
        token    = request.headers.get("Token", "").strip()
        provider = request.headers.get("Provider", "huggingface").lower()

        if not token:
            return jsonify({"error": "No API key provided. Open Settings and add your key."}), 400

        if not chunks:
            return jsonify({"error": "No page content received."}), 400

        # ── Build LLM + context per provider ─────────────────────────────────

        if provider == "openai":
            from langchain_openai import OpenAIEmbeddings, ChatOpenAI
            embedding = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=token)
            llm       = ChatOpenAI(model=model_id or "gpt-4o-mini", openai_api_key=token)
            context   = get_top_chunks(query, chunks, embedding)

        elif provider == "gemini":
            from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
            embedding = GoogleGenerativeAIEmbeddings(
                model="gemini-embedding-001",
                google_api_key=token
            )
            llm     = ChatGoogleGenerativeAI(
                model=model_id or "gemini-2.0-flash",
                google_api_key=token
            )
            context = get_top_chunks(query, chunks, embedding)

        elif provider == "claude":
            from langchain_anthropic import ChatAnthropic
            llm     = ChatAnthropic(
                model=model_id or "claude-haiku-4-5-20251001",
                anthropic_api_key=token
            )
            context = get_top_chunks(query, chunks)  # TF-IDF — Anthropic has no embeddings API

        else:  # huggingface
            from langchain_huggingface import (
                HuggingFaceEndpointEmbeddings,
                HuggingFaceEndpoint,
                ChatHuggingFace,
            )
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

        # ── Prompt & inference ────────────────────────────────────────────────

        prompt = (
            "Answer the question using ONLY the context below. "
            "Be concise and direct.\n\n"
            f"Context:\n{context}\n\n"
            f"Question:\n{query}"
        )

        response = llm.invoke(prompt)
        return jsonify({"answer": extract_text(response)})

    except ImportError as e:
        pkg = str(e).split("'")[1] if "'" in str(e) else str(e)
        return jsonify({
            "error": f"Provider package not installed on server: {pkg}. "
                     "Run: pip install langchain-openai langchain-google-genai langchain-anthropic"
        }), 500

    except Exception as e:
        # Surface the real error message to the popup
        msg = str(e)
        if "api key" in msg.lower() or "apikey" in msg.lower() or "authentication" in msg.lower() or "unauthorized" in msg.lower() or "invalid" in msg.lower():
            return jsonify({"error": f"Invalid API key for {provider}. Check your key in Settings."}), 401
        return jsonify({"error": f"Server error ({provider}): {msg}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
