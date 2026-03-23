import asyncio
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

LLM_TIMEOUT = 30  # seconds


# ── Cached client factories ────────────────────────────────────────────────────

@lru_cache(maxsize=256)
def get_openai_clients(token: str, model_id: str):
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
    embedding = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=token)
    llm       = ChatOpenAI(model=model_id, openai_api_key=token)
    return llm, embedding


@lru_cache(maxsize=256)
def get_gemini_clients(token: str, model_id: str):
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    embedding = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001", google_api_key=token)
    llm       = ChatGoogleGenerativeAI(model=model_id, google_api_key=token)
    return llm, embedding


@lru_cache(maxsize=256)
def get_claude_client(token: str, model_id: str):
    from langchain_anthropic import ChatAnthropic
    return ChatAnthropic(model=model_id, anthropic_api_key=token)


@lru_cache(maxsize=256)
def get_hf_clients(token: str, model_id: str):
    from langchain_huggingface import (
        ChatHuggingFace,
        HuggingFaceEndpoint,
        HuggingFaceEndpointEmbeddings,
    )
    embedding = HuggingFaceEndpointEmbeddings(
        repo_id="sentence-transformers/all-MiniLM-L6-v2",
        huggingfacehub_api_token=token,
    )
    hf_model = HuggingFaceEndpoint(
        repo_id=model_id,
        task="text-generation",
        huggingfacehub_api_token=token,
    )
    llm = ChatHuggingFace(llm=hf_model)
    return llm, embedding


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_top_chunks(query: str, chunks: list[str], embedding=None) -> str:
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


def extract_text(response) -> str:
    if isinstance(response, str):
        return response
    if hasattr(response, "content"):
        return response.content
    return str(response)


# ── Request model ──────────────────────────────────────────────────────────────

class RAGRequest(BaseModel):
    query: str
    chunks: list[str]
    model: Optional[str] = None
    provider: Optional[str] = None


# ── Endpoint ───────────────────────────────────────────────────────────────────

@app.post("/rag")
async def rag(
    body: RAGRequest,
    token: str    = Header(..., alias="Token"),
    provider: str = Header("huggingface", alias="Provider"),
):
    token    = token.strip()
    provider = provider.lower()
    query    = body.query
    chunks   = body.chunks

    if not token:
        raise HTTPException(status_code=400, detail="No API key provided. Open Settings and add your key.")
    if not chunks:
        raise HTTPException(status_code=400, detail="No page content received.")

    try:
        if provider == "openai":
            model_id      = body.model or "gpt-4o-mini"
            llm, embedding = get_openai_clients(token, model_id)
            context       = await run_in_threadpool(get_top_chunks, query, chunks, embedding)

        elif provider == "gemini":
            model_id      = body.model or "gemini-2.0-flash"
            llm, embedding = get_gemini_clients(token, model_id)
            context       = await run_in_threadpool(get_top_chunks, query, chunks, embedding)

        elif provider == "claude":
            model_id = body.model or "claude-haiku-4-5-20251001"
            llm      = get_claude_client(token, model_id)
            context  = await run_in_threadpool(get_top_chunks, query, chunks)

        else:  # huggingface
            model_id      = body.model or "meta-llama/Llama-3.1-8B-Instruct"
            llm, embedding = get_hf_clients(token, model_id)
            context       = await run_in_threadpool(get_top_chunks, query, chunks, embedding)

        prompt = (
            "Answer the question using ONLY the context below. "
            "Be concise and direct.\n\n"
            f"Context:\n{context}\n\n"
            f"Question:\n{query}"
        )

        response = await asyncio.wait_for(
            run_in_threadpool(llm.invoke, prompt),
            timeout=LLM_TIMEOUT,
        )
        return {"answer": extract_text(response)}

    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail=f"LLM did not respond within {LLM_TIMEOUT}s. Try again.")

    except ImportError as e:
        pkg = str(e).split("'")[1] if "'" in str(e) else str(e)
        raise HTTPException(
            status_code=500,
            detail=f"Provider package not installed: {pkg}. "
                   "Run: pip install langchain-openai langchain-google-genai langchain-anthropic",
        )

    except Exception as e:
        msg = str(e)
        if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
            raise HTTPException(status_code=401, detail=f"Invalid API key for {provider}. Check your key in Settings.")
        raise HTTPException(status_code=500, detail=f"Server error ({provider}): {msg}")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=5000, workers=4)
