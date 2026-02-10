# Chrome RAG Extension 

A powerful, full-stack browser extension that brings **Retrieval-Augmented Generation (RAG)** to your browsing experience. This tool allows you to "chat" with any webpage by extracting its content, processing it into semantic chunks, and using an LLM to answer questions based strictly on that context.



## How It Works

1.  **Page Scraping:** The extension extracts `innerText` from the active tab and cleans it for processing.
2.  **Smart Chunking:** Text is broken into an array of chunks directly in the browser.
3.  **Vector Retrieval:** Chunks and user queries are sent to the Flask backend where they are converted into embeddings using `all-MiniLM-L6-v2`.
4.  **Semantic Search:** The backend performs a **Cosine Similarity** search to find the top 3 most relevant chunks.
5.  **Contextual Response:** The query and retrieved context are sent to **Llama-3.1-8B-Instruct** via Hugging Face to generate an accurate, hallucination-free answer.

---

## Architecture & Tech Stack

-   **Frontend:** JavaScript (Chrome Extension API), CSS, HTML.
-   **Backend:** Python (Flask), hosted in a **Docker** container on **AWS EC2**.
-   **AI Frameworks:** LangChain, Hugging Face Hub, Scikit-learn (for vector search).
-   **Model:** `meta-llama/Llama-3.1-8B-Instruct`.

---

## Getting Started

### 1. Backend Deployment (AWS EC2)
The backend is containerized for easy deployment. On your EC2 instance:

```bash
# Clone the repository
git clone [https://github.com/utkarsh0p/chrome-rag-extension.git](https://github.com/utkarsh0p/chrome-rag-extension.git)
cd chrome-rag-extension/backend

# Build the Docker image
docker build -t rag-server .

# Run the container
docker run -d -p 5000:5000 rag-server
