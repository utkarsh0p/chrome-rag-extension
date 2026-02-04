from flask import Flask, request, jsonify
from flask_cors import CORS
# from dotenv import load_dotenv
from sklearn.metrics.pairwise import cosine_similarity

from langchain_huggingface import HuggingFaceEndpointEmbeddings
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

# load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    query = data["query"]
    chunks = data["chunks"]
    token = request.headers.get("Token")
    # embedding model to generate vectors
    embedding = HuggingFaceEndpointEmbeddings(
        repo_id="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=token
    )
    # model to generate response
    model = HuggingFaceEndpoint(
        repo_id = "meta-llama/Llama-3.1-8B-Instruct",
        task="text-generation",
        huggingfacehub_api_token=token
    )
    llm = ChatHuggingFace(llm = model) 

    doc_vectors = embedding.embed_documents(chunks)
    query_vector = embedding.embed_query(query)

    scores = cosine_similarity([query_vector], doc_vectors)[0]

    top_indices = sorted(
        list(enumerate(scores)),
        key=lambda x: x[1],
        reverse=True
    )[:3]

    context = "\n\n".join([chunks[i] for i, _ in top_indices])

    prompt = f"""
Answer the question using ONLY the context below.

Context:
{context}

Question:
{query}
"""

    response = llm.invoke(prompt)

    if hasattr(response, "content"):
        response = response.content

    return jsonify({"answer": response})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)