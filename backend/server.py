import asyncio
import json
import re
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



# ── Helpers ────────────────────────────────────────────────────────────────────

def get_top_chunks(query: str, chunks: list, embedding=None) -> str:
    if not chunks:
        return ""
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


def _resolve_llm(provider: str, token: str, model: Optional[str]):
    """Returns (llm, embedding) for the given provider. embedding may be None."""
    if provider == "openai":
        model_id = model or "gpt-4.1-mini"
        return get_openai_clients(token, model_id)
    if provider == "gemini":
        model_id = model or "gemini-2.5-flash"
        return get_gemini_clients(token, model_id)
    if provider == "claude":
        model_id = model or "claude-haiku-4-5"
        return get_claude_client(token, model_id), None
    raise ValueError(f"Unsupported provider: {provider}")


def _auth_error(e: Exception, provider: str) -> HTTPException:
    msg = str(e).lower()
    if any(k in msg for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
        return HTTPException(status_code=401, detail=f"Invalid API key for {provider}. Check your key in Settings.")
    return HTTPException(status_code=500, detail=f"Server error ({provider}): {e}")


def _sse_error_handler(e: Exception, provider: str) -> str:
    msg = str(e).lower()
    if any(k in msg for k in ("api key", "apikey", "authentication", "unauthorized", "invalid")):
        return f"Invalid API key for {provider}. Check your key in Settings."
    return f"Stream error ({provider}): {e}"


# ── YouTube transcript helper ──────────────────────────────────────────────────

def _fetch_transcript(video_id: str) -> list[dict]:
    from youtube_transcript_api import YouTubeTranscriptApi
    # Try English first
    try:
        fetched = YouTubeTranscriptApi.get_transcript(
            video_id, languages=["en", "en-US", "en-GB", "en-CA", "en-AU"]
        )
    except Exception:
        # Fall back to first available transcript in any language
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        fetched = None
        for t in transcript_list:
            try:
                fetched = t.fetch()
                break
            except Exception:
                continue
        if fetched is None:
            raise RuntimeError(f"No transcript available for video {video_id}")
    result = []
    for e in fetched:
        if hasattr(e, "text"):
            result.append({"text": e.text, "start": float(e.start)})
        elif isinstance(e, dict):
            result.append({"text": e["text"], "start": float(e["start"])})
    return result


# ── Unified /chat endpoint ─────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    query:    str
    chunks:   list[str]            = []
    model:    Optional[str]        = None
    history:  Optional[list[dict]] = None   # [{"role": "user"|"assistant", "content": "..."}]
    youtube:  Optional[dict]       = None   # {"video_id": str, "current_time": int|None}
    leetcode: Optional[dict]       = None   # {"title": str, "description": str, "language": str, "current_code": str}


@app.post("/chat")
async def chat(
    body: ChatRequest,
    token:    str = Header(..., alias="Token"),
    provider: str = Header(..., alias="Provider"),
):
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
    from langchain_core.tools import tool

    token    = token.strip()
    provider = provider.lower()

    if not token:
        raise HTTPException(status_code=400, detail="No API key provided. Open Settings and add your key.")

    try:
        llm, embedding = _resolve_llm(provider, token, body.model)
    except Exception as e:
        raise _auth_error(e, provider)

    # ── Tool definitions (coding tools only — RAG/YouTube use direct retrieval) ──

    @tool
    def explain_problem() -> str:
        """Explain the coding problem in simple terms. Break down constraints, input/output format, and walk through an example.
        Use when the student wants to understand what the problem is asking."""
        return "explain"

    @tool
    def suggest_approach() -> str:
        """Suggest the best algorithm or data structure approach without writing code.
        Use when the student asks what technique to use, how to approach it, or which algorithm is best."""
        return "approach"

    @tool
    def analyze_code() -> str:
        """Analyze the current code for time and space complexity and suggest improvements.
        Use when the student asks about efficiency, Big O notation, or wants their code reviewed."""
        return "analyze"

    @tool
    def give_hint() -> str:
        """Give a progressive hint to guide the student without revealing the full solution.
        Use when the student asks for a hint or says they are stuck."""
        return "hint"

    @tool
    def solve_code() -> str:
        """Generate a complete working solution for the problem.
        Use when the student explicitly asks to solve it or when no specific question is asked."""
        return "solve"

    # ── Context flags ──────────────────────────────────────────────────────────
    has_lc   = bool(body.leetcode and body.leetcode.get("description"))
    has_yt   = bool(body.youtube and body.youtube.get("video_id"))
    has_page = bool(body.chunks)

    chosen_tool: str | None = None

    # ── Build base message history ─────────────────────────────────────────────
    messages = [
        SystemMessage(content="You are SiteWhisper, a helpful AI assistant.")
    ]
    for h in (body.history or []):
        if h.get("role") == "user":
            messages.append(HumanMessage(content=h["content"]))
        elif h.get("role") == "assistant":
            messages.append(AIMessage(content=h["content"]))
    messages.append(HumanMessage(content=body.query))

    # ── Coding path ────────────────────────────────────────────────────────────
    if has_lc:
        lc = body.leetcode
        coding_tools = [explain_problem, suggest_approach, analyze_code, give_hint, solve_code]

        if body.query:
            try:
                decision = await llm.bind_tools(coding_tools).ainvoke([
                    SystemMessage(content="You are a coding assistant. Choose the right tool based on what the student needs."),
                    HumanMessage(content=f"Problem: {lc.get('title', '')}\n\nStudent says: {body.query}"),
                ])
                if decision.tool_calls:
                    chosen_tool = decision.tool_calls[0]["name"]
            except Exception:
                pass

        if not chosen_tool:
            chosen_tool = "solve_code"

        problem_ctx = f"Problem: {lc.get('title', '')}\n\n{lc.get('description', '')}"
        lang        = lc.get("language", "Python3")

        # Override lang if user explicitly named one in their query
        _lang_match = re.search(
            r'c\+\+|\b(cpp|c#|csharp|python3?|java(?:script)?|typescript|golang?|rust|swift|kotlin|ruby|php|scala)\b',
            body.query, re.IGNORECASE
        )
        if _lang_match:
            lang = _lang_match.group(0)

        # Only use current_code if it looks like a real function/class definition
        _cur = lc.get("current_code") or ""
        real_code = _cur if re.search(r'\b(def |class |function |func |public |void |int |vector|#include)\b', _cur) else ""
        code_ctx  = f"\n\nCurrent code:\n```\n{real_code}\n```" if real_code else ""

        if chosen_tool == "explain_problem":
            prompt = (
                f"Explain this coding problem clearly for a student.\n"
                f"Break down: what it's asking, constraints, input/output format, and walk through an example.\n\n"
                f"{problem_ctx}"
            )
        elif chosen_tool == "suggest_approach":
            prompt = (
                f"Suggest the best algorithm or data structure approach for this problem.\n"
                f"Do NOT write the full solution. Explain the technique, why it works, and the intuition.\n\n"
                f"{problem_ctx}{code_ctx}"
            )
        elif chosen_tool == "analyze_code":
            prompt = (
                f"Analyze this code for time and space complexity.\n"
                f"Identify bottlenecks and suggest concrete optimizations with reasoning.\n\n"
                f"{problem_ctx}{code_ctx}"
            )
        elif chosen_tool == "give_hint":
            prompt = (
                f"Give a helpful hint to guide the student toward the solution without revealing it.\n"
                f"Be Socratic — nudge them in the right direction with a guiding question or observation.\n\n"
                f"{problem_ctx}{code_ctx}"
            )
        else:  # solve_code
            sig = f"\n\nUse this function signature as the starting point:\n```\n{real_code}\n```" if real_code else ""
            prompt = (
                f"You are an expert competitive programmer.\n"
                f"Solve the following problem in {lang}.\n"
                f"Return ONLY the solution code — no explanation, no markdown fences, no extra text.\n"
                f"The code must be directly pasteable into the editor.{sig}\n\n"
                f"{problem_ctx}"
            )

        messages = [HumanMessage(content=prompt)]

    # ── RAG / YouTube path ─────────────────────────────────────────────────────
    elif has_page or has_yt:
        if has_page and not has_yt:
            # Always retrieve from page — no LLM decision needed
            try:
                context = await run_in_threadpool(get_top_chunks, body.query, body.chunks, embedding)
            except Exception:
                # Embedding API failed — fall back to TF-IDF
                context = await run_in_threadpool(get_top_chunks, body.query, body.chunks, None)
            if context:
                chosen_tool = "search_page"
                messages[0] = SystemMessage(content=(
                    "You are SiteWhisper, a helpful AI assistant.\n\n"
                    "Relevant page content:\n" + context + "\n\n"
                    "Answer the user's question using the above content. "
                    "If the content doesn't help, answer from general knowledge."
                ))
        else:
            # YouTube — always fetch transcript, no LLM tool-calling decision needed
            try:
                transcript  = await run_in_threadpool(_fetch_transcript, body.youtube["video_id"])
                full_text   = " ".join(s["text"] for s in transcript)
                ts          = body.youtube.get("current_time") or 0
                nearby      = [s for s in transcript if abs(s["start"] - ts) <= 180]
                nearby_text = " ".join(s["text"] for s in (nearby or transcript[:40]))
                mins, secs  = divmod(int(ts), 60)

                yt_ctx = f"[Around {mins}:{secs:02d}] {nearby_text}"
                if full_text:
                    trunc   = (full_text[:10000] + " … [truncated]") if len(full_text) > 10000 else full_text
                    yt_ctx += f"\n\n[Full transcript]: {trunc}"

                chosen_tool = "youtube_summarize"
                messages[0] = SystemMessage(content=(
                    "You are SiteWhisper, a helpful AI assistant. "
                    "The user is watching a YouTube video.\n\n"
                    "Video transcript:\n" + yt_ctx + "\n\n"
                    "Answer the user's question about this video."
                ))
            except Exception as yt_err:
                print(f"[YouTube transcript error] {yt_err}")
                # Transcript unavailable — fall back to page content if present
                if has_page:
                    try:
                        context = await run_in_threadpool(get_top_chunks, body.query, body.chunks, embedding)
                    except Exception:
                        context = await run_in_threadpool(get_top_chunks, body.query, body.chunks, None)
                    if context:
                        chosen_tool = "search_page"
                        messages[0] = SystemMessage(content=(
                            "You are SiteWhisper, a helpful AI assistant.\n\n"
                            "Relevant page content:\n" + context + "\n\n"
                            "Answer the user's question using the above content. "
                            "If the content doesn't help, answer from general knowledge."
                        ))

    # ── Stream the final answer ────────────────────────────────────────────────
    async def generate():
        is_youtube = chosen_tool in ("youtube_summarize", "youtube_explain_moment")
        used_rag   = chosen_tool is not None
        yield f"data: {json.dumps({'tool': chosen_tool, 'used_rag': used_rag, 'is_youtube': is_youtube})}\n\n"
        try:
            async with asyncio.timeout(LLM_TIMEOUT):
                async for chunk in llm.astream(messages):
                    text = extract_chunk(chunk)
                    if text:
                        yield f"data: {json.dumps({'text': text})}\n\n"
        except TimeoutError:
            yield f"data: {json.dumps({'error': f'LLM timed out after {LLM_TIMEOUT}s.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': _sse_error_handler(e, provider)})}\n\n"
        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import os, uvicorn
    workers = 1 if os.environ.get("RENDER") else 4
    uvicorn.run("server:app", host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), workers=workers)
