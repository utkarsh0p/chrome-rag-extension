import asyncio
import json
from functools import lru_cache
from typing import Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
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

LLM_TIMEOUT = 60  # seconds


# ── Cached client factories ────────────────────────────────────────────────────

@lru_cache(maxsize=256)
def get_openai_clients(token: str, model_id: str):
    from langchain_openai import ChatOpenAI, OpenAIEmbeddings
    embedding = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=token)
    llm       = ChatOpenAI(model=model_id, openai_api_key=token, streaming=True)
    return llm, embedding


@lru_cache(maxsize=256)
def get_gemini_clients(token: str, model_id: str):
    from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
    embedding = GoogleGenerativeAIEmbeddings(model="gemini-embedding-001", google_api_key=token)
    llm       = ChatGoogleGenerativeAI(model=model_id, google_api_key=token, streaming=True)
    return llm, embedding


@lru_cache(maxsize=256)
def get_claude_client(token: str, model_id: str):
    from langchain_anthropic import ChatAnthropic
    return ChatAnthropic(model=model_id, anthropic_api_key=token, streaming=True)


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

def get_top_chunks(query: str, chunks: list, embedding=None) -> str:
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


def extract_chunk(chunk) -> str:
    if isinstance(chunk, str):
        return chunk
    if hasattr(chunk, "content"):
        c = chunk.content
        return c if isinstance(c, str) else ""
    return ""


# ── Request models ─────────────────────────────────────────────────────────────

class RAGRequest(BaseModel):
    query: str
    chunks: list[str]
    model: Optional[str] = None
    provider: Optional[str] = None


class ChatRequest(BaseModel):
    query: str
    model: Optional[str] = None
    provider: Optional[str] = None
    history: Optional[list[dict]] = None  # [{"role": "user"|"assistant", "content": "..."}]


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
            model_id       = body.model or "gpt-4.1-mini"
            llm, embedding = get_openai_clients(token, model_id)
            context        = await run_in_threadpool(get_top_chunks, query, chunks, embedding)

        elif provider == "gemini":
            model_id       = body.model or "gemini-2.5-flash"
            llm, embedding = get_gemini_clients(token, model_id)
            context        = await run_in_threadpool(get_top_chunks, query, chunks, embedding)

        elif provider == "claude":
            model_id = body.model or "claude-haiku-4-5"
            llm      = get_claude_client(token, model_id)
            context  = await run_in_threadpool(get_top_chunks, query, chunks)

        else:  # huggingface
            model_id       = body.model or "meta-llama/Llama-3.1-8B-Instruct"
            llm, embedding = get_hf_clients(token, model_id)
            context        = await run_in_threadpool(get_top_chunks, query, chunks, embedding)

    except Exception as e:
        msg = str(e)
        if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
            raise HTTPException(status_code=401, detail=f"Invalid API key for {provider}. Check your key in Settings.")
        raise HTTPException(status_code=500, detail=f"Server error ({provider}): {msg}")

    prompt = (
        "Answer the question using ONLY the context below. "
        "Be concise and direct.\n\n"
        f"Context:\n{context}\n\n"
        f"Question:\n{query}"
    )

    async def generate():
        try:
            async with asyncio.timeout(LLM_TIMEOUT):
                async for chunk in llm.astream(prompt):
                    text = extract_chunk(chunk)
                    if text:
                        yield f"data: {json.dumps({'text': text})}\n\n"
        except TimeoutError:
            yield f"data: {json.dumps({'error': f'LLM did not respond within {LLM_TIMEOUT}s. Try again.'})}\n\n"
        except Exception as e:
            msg = str(e)
            if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
                yield f"data: {json.dumps({'error': f'Invalid API key for {provider}. Check your key in Settings.'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': f'Stream error ({provider}): {msg}'})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── /code endpoint (LeetCode solver) ──────────────────────────────────────────

class CodeRequest(BaseModel):
    title: str
    description: str
    language: str = "Python3"
    current_code: Optional[str] = None
    instruction: Optional[str] = None   # e.g. "optimize for space complexity"
    model: Optional[str] = None
    provider: Optional[str] = None


@app.post("/code")
async def code(
    body: CodeRequest,
    token: str    = Header(..., alias="Token"),
    provider: str = Header("huggingface", alias="Provider"),
):
    token    = token.strip()
    provider = provider.lower()

    if not token:
        raise HTTPException(status_code=400, detail="No API key provided.")

    try:
        if provider == "openai":
            model_id = body.model or "gpt-4.1-mini"
            llm, _   = get_openai_clients(token, model_id)
        elif provider == "gemini":
            model_id = body.model or "gemini-2.5-flash"
            llm, _   = get_gemini_clients(token, model_id)
        elif provider == "claude":
            model_id = body.model or "claude-haiku-4-5"
            llm      = get_claude_client(token, model_id)
        else:
            model_id = body.model or "meta-llama/Llama-3.1-8B-Instruct"
            llm, _   = get_hf_clients(token, model_id)
    except Exception as e:
        msg = str(e)
        if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
            raise HTTPException(status_code=401, detail=f"Invalid API key for {provider}.")
        raise HTTPException(status_code=500, detail=f"Server error: {msg}")

    extra = f"\n\nAdditional instruction: {body.instruction}" if body.instruction else ""
    signature_hint = (
        f"\n\nThe editor currently contains this starter code — preserve the class/function signature:\n```\n{body.current_code}\n```"
        if body.current_code else ""
    )

    prompt = (
        f"You are an expert competitive programmer.\n"
        f"Solve the following LeetCode problem in {body.language}.\n"
        f"Return ONLY the solution code — no explanation, no markdown fences, no extra text.\n"
        f"The code must be directly pasteable into the LeetCode editor.{extra}{signature_hint}\n\n"
        f"Problem: {body.title}\n\n"
        f"{body.description}"
    )

    async def generate():
        try:
            async with asyncio.timeout(LLM_TIMEOUT):
                async for chunk in llm.astream(prompt):
                    text = extract_chunk(chunk)
                    if text:
                        yield f"data: {json.dumps({'text': text})}\n\n"
        except TimeoutError:
            yield f"data: {json.dumps({'error': f'LLM timed out after {LLM_TIMEOUT}s.'})}\n\n"
        except Exception as e:
            msg = str(e)
            if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
                yield f"data: {json.dumps({'error': f'Invalid API key for {provider}.'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': f'Stream error: {msg}'})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── /chat endpoint (direct LLM, no retrieval) ─────────────────────────────────

@app.post("/chat")
async def chat(
    body: ChatRequest,
    token: str    = Header(..., alias="Token"),
    provider: str = Header("huggingface", alias="Provider"),
):
    token    = token.strip()
    provider = provider.lower()

    if not token:
        raise HTTPException(status_code=400, detail="No API key provided. Open Settings and add your key.")

    try:
        if provider == "openai":
            model_id = body.model or "gpt-4.1-mini"
            llm, _   = get_openai_clients(token, model_id)

        elif provider == "gemini":
            model_id = body.model or "gemini-2.5-flash"
            llm, _   = get_gemini_clients(token, model_id)

        elif provider == "claude":
            model_id = body.model or "claude-haiku-4-5"
            llm      = get_claude_client(token, model_id)

        else:  # huggingface
            model_id = body.model or "meta-llama/Llama-3.1-8B-Instruct"
            llm, _   = get_hf_clients(token, model_id)

    except Exception as e:
        msg = str(e)
        if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
            raise HTTPException(status_code=401, detail=f"Invalid API key for {provider}. Check your key in Settings.")
        raise HTTPException(status_code=500, detail=f"Server error ({provider}): {msg}")

    # Build message list with optional history
    from langchain_core.messages import HumanMessage, AIMessage
    messages = []
    for h in (body.history or []):
        if h.get("role") == "user":
            messages.append(HumanMessage(content=h["content"]))
        elif h.get("role") == "assistant":
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=body.query))

    async def generate():
        try:
            async with asyncio.timeout(LLM_TIMEOUT):
                async for chunk in llm.astream(messages):
                    text = extract_chunk(chunk)
                    if text:
                        yield f"data: {json.dumps({'text': text})}\n\n"
        except TimeoutError:
            yield f"data: {json.dumps({'error': f'LLM did not respond within {LLM_TIMEOUT}s. Try again.'})}\n\n"
        except Exception as e:
            msg = str(e)
            if any(k in msg.lower() for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
                yield f"data: {json.dumps({'error': f'Invalid API key for {provider}. Check your key in Settings.'})}\n\n"
            else:
                yield f"data: {json.dumps({'error': f'Stream error ({provider}): {msg}'})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os, uvicorn
    workers = 1 if os.environ.get("RENDER") else 4
    uvicorn.run("server:app", host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), workers=workers)
