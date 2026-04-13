# SiteWhisper

A Chrome extension that lets you chat with any webpage using AI. Ask questions about articles, get YouTube video summaries, solve LeetCode problems — all without leaving the tab.

---

## What It Does

| Context | What happens |
|---|---|
| Any webpage | Chat with the page content — asks answered from the actual text |
| YouTube video | Summarize the video or ask about the current moment using the transcript |
| LeetCode problem | Explain, hint, approach, analyze, or solve the problem with one-click code injection |
| No specific context | General AI chat |

---

## Architecture

```
User types question
        │
        ▼
   popup.js (Chrome Extension UI)
        │
        ├── chrome.tabs.sendMessage → content.js
        │       ├── Scrapes page text → 500-char chunks
        │       ├── YouTube: extracts video_id + current timestamp
        │       └── LeetCode: extracts problem title, description, current code
        │
        └── fetch POST /chat → FastAPI backend
                │
                ├── has LeetCode data?
                │     └── Tool-call LLM to pick: explain / hint / approach / analyze / solve
                │           └── Build structured prompt → stream solution
                │
                ├── has YouTube video_id?
                │     └── Fetch transcript (any language) via youtube-transcript-api
                │           └── Inject nearby excerpt + full transcript → stream answer
                │
                └── has page chunks?
                      └── Embed chunks + query → cosine similarity → top 3 chunks
                            └── Inject as context → stream answer
```

---

## Tech Stack

**Frontend (Chrome Extension — Manifest V3)**
- Plain JavaScript, HTML, CSS — no build step
- `content.js` — injected into every page, reads DOM
- `popup.js` — chat UI, provider/model selection, streaming SSE reader
- `background.js` — opens options page on first install

**Backend (FastAPI + Python)**
- FastAPI with SSE streaming responses
- LangChain for LLM abstraction
- Scikit-learn TF-IDF + cosine similarity (fallback retrieval)
- Vector embeddings via OpenAI / Gemini APIs
- `youtube-transcript-api` for transcript fetching
- `lru_cache` on LLM/embedding client factories

**AI Providers**
| Provider | LLM | Embeddings |
|---|---|---|
| Claude (Anthropic) | claude-haiku / sonnet / opus | TF-IDF (no embeddings API) |
| Gemini (Google) | gemini-2.5-flash / pro | gemini-embedding-001 |
| GPT (OpenAI) | gpt-4.1-mini / gpt-4.1 / o4-mini | text-embedding-3-small |

---

## How RAG Works Here

1. `content.js` scrapes `document.body.innerText`, collapses whitespace, splits into 500-char fixed chunks
2. All chunks are sent to the backend with every request
3. Backend embeds all chunks + the query using the provider's embedding model (or TF-IDF for Claude)
4. Cosine similarity selects the **top 3 most relevant chunks**
5. Only those 3 chunks are injected into the system message as context
6. LLM streams the answer grounded in that context

---

## YouTube Flow

1. URL contains `youtube.com/watch` → extension fetches `video_id` + current playback timestamp from the page
2. Backend calls `youtube-transcript-api` — tries English first, falls back to any available language (Hindi, auto-generated, etc.)
3. Two context windows are built:
   - **Nearby excerpt**: transcript ±3 minutes around current timestamp
   - **Full transcript**: up to 10,000 chars of the complete transcript
4. Both are injected into the system message — LLM answers about the video directly

---

## LeetCode Flow

1. URL matches a known coding site → `content.js` extracts problem title, description, and current editor code via Monaco API
2. Backend tool-calls the LLM to route to the right action:
   - `explain_problem` — break down constraints, examples, I/O format
   - `suggest_approach` — algorithm/data structure recommendation without code
   - `analyze_code` — time/space complexity + optimizations
   - `give_hint` — Socratic nudge without revealing the solution
   - `solve_code` — complete working solution (default)
3. Language is auto-detected from the Monaco editor or overridden from your message ("solve in c++")
4. Solution streams into a code bubble with an **Inject into editor** button
5. Inject button writes the code directly into Monaco via `chrome.scripting.executeScript`

---

## Monaco Code Injection

The inject mechanism tries 3 approaches in order:

1. `window.monaco.editor.getModels()[0].setValue(code)` — direct Monaco API
2. `.monaco-editor textarea` + `execCommand('insertText')` — simulates keyboard input
3. React fiber tree traversal on `.monaco-editor` to reach the internal editor instance

---

## Project Structure

```
chrome-rag-extension/
├── manifest.json          # MV3 config — permissions, content scripts, popup
├── background.js          # Service worker — opens options on first install
├── content.js             # Injected into every page — scrapes text, YT data, LC data
│
├── popup/
│   ├── popup.html         # Chat UI shell
│   ├── popup.css          # Styles
│   └── popup.js           # All UI logic — chat, streaming, provider/model selection
│
├── options/
│   ├── option.html        # API key setup page
│   ├── option.css
│   └── option.js          # Saves keys to chrome.storage.local
│
├── icons/
│   ├── logo.svg           # Source logo
│   └── icon{16,32,48,128}.png
│
└── backend/
    ├── server.py          # FastAPI app — single /chat endpoint
    ├── requirements.txt
    ├── Dockerfile
    └── docker-compose.yml
```

---

## Running Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python3 server.py
# runs on http://localhost:5000
```

Or with Docker:
```bash
cd backend
docker-compose up -d
# after changing server.py:
docker-compose up -d --build
```

**Extension**
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click **Load unpacked** → select the repo root
4. Click the extension icon → open Settings → add your API key

**Toggle backend URL** in `popup/popup.js` line 2:
```javascript
const BACKEND = 'http://localhost:5000';                        // local
// const BACKEND = 'https://chrome-rag-extension.onrender.com'; // production
```

---

## Storage

All keys stored in `chrome.storage.local`:

| Key | Purpose |
|---|---|
| `apiKeys` | `{ claude, gemini, openai }` — one key per provider |
| `selectedProvider` | Last used provider |
| `selectedModelId` | Last used model |

---

## Key Design Decisions

- **Always-retrieve over tool-calling for RAG** — the LLM never decides whether to look up context; retrieval always happens. Avoids the LLM skipping context and answering from scratch.
- **No overlap in chunking** — 500-char fixed windows, fast and simple. Known limitation: answers that span chunk boundaries may score lower.
- **TF-IDF fallback for Claude** — Anthropic has no public embeddings API, so keyword-based similarity is used instead.
- **SSE streaming** — first event is always metadata `{ tool, used_rag, is_youtube }`, rest is streamed text tokens.
- **Inject via executeScript not content.js** — code injection into Monaco runs in `world: 'MAIN'` for direct JS context access, bypassing the content script message layer.
