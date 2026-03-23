# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SiteWhisper** — a Chrome extension (Manifest v3, plain JS/HTML/CSS, no build step) that lets users chat with any webpage using AI. The extension scrapes and chunks page text, sends it to a Flask backend on AWS EC2, which does semantic search + LLM inference and returns an answer.

Supports four AI providers: **Claude, Gemini, OpenAI, HuggingFace**. The user picks a provider and API key once (options page), then selects a specific model per session from the popup.

---

## Commands

### Backend

```bash
cd backend && docker-compose up -d          # recommended
cd backend && docker-compose up -d --build  # after changing server.py or requirements.txt

# Without Docker
cd backend && pip install -r requirements.txt && python server.py
```

### Chrome Extension

No build step. Load at `chrome://extensions` → Developer mode → Load unpacked → select repo root. After any file change: click **Reload** on the extension card.

### Regenerate extension icons (after logo SVG changes)

```bash
python3 - << 'EOF'
# Paste the icon-generation Python script from background of this session
# It uses PIL to draw the chevron+arc+spokes+starburst at 16/32/48/128px
EOF
```

The PIL script (not ImageMagick — ImageMagick produces broken grayscale output with this SVG) lives in session history. Source SVG is `icons/logo.svg`; outputs are `icons/icon{16,32,48,128}.png`.

---

## Architecture

### Full Data Flow

```
User types question → popup.js
  ↓ chrome.tabs.sendMessage({ type: "GET_PAGE_DATA" })
content.js — scrapes document.body.innerText, collapses whitespace,
             chunks into 500-char segments (no overlap)
  ↓ returns { chunks: string[] }
popup.js — builds payload { query, chunks, model }
  ↓ chrome.runtime.sendMessage({ type: "ASK_BACKEND", payload })
background.js — reads apiProvider + apiKey from chrome.storage.local,
                POSTs to http://3.80.154.24:5000/chat
                with headers: Token, Provider, Content-Type
  ↓ fetch response
backend/server.py — embeds chunks, cosine similarity → top 3,
                    calls LLM, returns { answer }
  ↓ sendResponse({ answer })
popup.js — replaces "Thinking…" bubble with answer
```

### Extension Files

| File | Role |
|---|---|
| `manifest.json` | MV3 config — permissions, icons, popup, service worker, content script |
| `background.js` | Service worker — handles `ASK_BACKEND`, reads storage, calls backend |
| `content.js` | Injected into every page — handles `GET_PAGE_DATA`, chunks text |
| `popup/popup.{html,css,js}` | Perplexity-style chat UI — compact header, expandable chat, model selector |
| `options/option.{html,css,js}` | Provider + API key setup — card grid, auto-closes on save |
| `icons/logo.svg` | Source logo (X-chevron + D-arc + radial spokes + starburst) |
| `icons/icon{16,32,48,128}.png` | Extension icons — generated via Python PIL from logo.svg |

### Backend (`backend/server.py`)

Single Flask file, one endpoint `POST /chat`.

**Request:**
```
Headers: Token: <api_key>   Provider: openai|gemini|claude|huggingface
Body:    { "query": "...", "chunks": ["..."], "model": "gpt-4o-mini" }
```

**Provider routing:**

| Provider header | Embeddings | LLM |
|---|---|---|
| `openai` | `OpenAIEmbeddings` | `ChatOpenAI(model=model_id)` |
| `gemini` | `GoogleGenerativeAIEmbeddings` | `ChatGoogleGenerativeAI(model=model_id)` |
| `claude` | TF-IDF (Anthropic has no embeddings API) | `ChatAnthropic(model=model_id)` |
| `huggingface` | `HuggingFaceEndpointEmbeddings` (all-MiniLM-L6-v2) | `ChatHuggingFace` wrapping `HuggingFaceEndpoint` |

Top-3 chunks selected by cosine similarity (scikit-learn). Claude uses TF-IDF fallback for retrieval.

**Response:** `{ "answer": "..." }`

### Message Protocol (exact `type` values — not `action`)

```js
// popup.js → content.js
{ type: "GET_PAGE_DATA" }
// content.js response
{ chunks: string[] }

// popup.js → background.js
{ type: "ASK_BACKEND", payload: { query, chunks, model, provider } }
// background.js response
{ answer: string } | { error: string }
```

### Storage Keys

| Key | Set by | Read by | Value |
|---|---|---|---|
| `apiKeys` | options/option.js | background.js, popup.js | `{ claude?: string, gemini?: string, openai?: string, huggingface?: string }` |
| `apiProvider` | legacy | background.js (fallback) | old single-provider selection — migrated automatically |
| `apiKey` | legacy | background.js (fallback) | old single API key — migrated automatically |
| `hfToken` | legacy | background.js (fallback) | old HuggingFace token — migrated automatically |

**Multi-key schema**: Users can save keys for all 4 providers at once. `popup.js` reads `apiKeys` to know which providers are available and sends `provider` in the payload. `background.js` reads `apiKeys[payload.provider]`. Legacy keys are migrated on first load in both `option.js` and `popup.js`.

---

## UI / Design System

**Font**: Inter — loaded from Google Fonts (`fonts.googleapis.com`) on both popup and options pages. Always use Inter; never fall back to system-ui alone without Inter first.

**Color tokens:**

| Token | Value | Usage |
|---|---|---|
| Background | `#fafaf8` | Body, header, chat area |
| Card | `#ffffff` | Input card, options container |
| Border | `#e8e8e4` | Cards, inputs, dividers |
| Text primary | `#1a1a1a` | All body text |
| Text muted | `#a8a8a0` | Placeholders, subtitles |
| Bot bubble | `#efefeb` | Left-aligned AI messages |
| User bubble | `#1a1a1a` bg + `#fafaf8` text | Right-aligned user messages |
| Button primary | `#1a1a1a` bg + `#fafaf8` text | Send, Save buttons |
| Ghost hover | `rgba(0,0,0,0.05–0.1)` | Settings gear, model btn |

**No purple/indigo** — the old design system has been fully replaced.

**Border radius**: 14–16px for cards, 12px for dropdowns, 8px for buttons/inputs, 50% for send button.

---

## Branding

- **Extension name**: SiteWhisper
- **Logo**: geometric X-chevron (left) + D-arc with radial spokes (right) + starburst at intersection. Source: `icons/logo.svg`. The inner "track" effect (double-stroke) is the defining visual.
- **Popup style**: Perplexity-inspired — compact on open (header + input only, ~130px), chat body hidden via `display:none`, gains `.visible` class (→ `display:flex`) on first message sent.
- **Options style**: 4 provider rows (vertical list), each always-visible key input, "Saved" green badge shown if key exists (but input is never pre-filled). Save button saves all non-empty inputs and merges into `apiKeys`. Auto-closes 800ms after save.

---

## Key Gotchas

- **`type` not `action`** in message listeners — the codebase uses `message.type`, not `message.action`. Wrong key = silent failure.
- **Backend URL is hardcoded** in `background.js` (`https://chrome-rag-extension.onrender.com`). Update this if the deployment changes; there is no env config.
- **Never use ImageMagick `convert`** to rasterize `logo.svg` — it produces broken 16-bit grayscale output. Use the Python PIL script instead.
- **`chrome.storage.local` only** — never `chrome.storage.sync`. Primary key: `apiKeys` object. Legacy keys `apiProvider`, `apiKey`, `hfToken` are auto-migrated into `apiKeys` on first load.
- **Chunking has no overlap** — 500-char fixed windows in `content.js`. Context can split across boundaries; this is a known limitation.
- **Claude provider uses TF-IDF** not vector embeddings for retrieval, because Anthropic has no public embeddings API.
- **`docker-compose up -d --build`** is required after any change to `server.py` or `requirements.txt` on the EC2 server — the volume mount is for dev only.
- **Options page opens automatically** on first extension install (`onInstalled` in `background.js`).

## Adding a New Provider

1. Add model list to `MODELS` object in `popup/popup.js`
2. Add provider card in `options/option.html` with matching `data-provider` attribute
3. Add `HINTS` and `LABELS` entries in `options/option.js`
4. Add routing branch in `backend/server.py` under `@app.route("/chat")`
5. Add any new LangChain packages to `backend/requirements.txt`
6. Rebuild Docker image on EC2
