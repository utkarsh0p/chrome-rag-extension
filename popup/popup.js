// ── Avatars ───────────────────────────────────────────────────────────────────

const AI_AVATAR_SVG = `<svg viewBox="0 0 100 100" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 11 L57 50 L16 89" stroke="#fafaf8" stroke-width="14" stroke-linejoin="miter" stroke-linecap="round"/>
  <path d="M57 14 A39 39 0 0 1 57 86" stroke="#fafaf8" stroke-width="13" stroke-linecap="round"/>
  <line x1="57" y1="50" x2="88" y2="50" stroke="#fafaf8" stroke-width="9" stroke-linecap="round"/>
  <line x1="57" y1="50" x2="79" y2="27" stroke="#fafaf8" stroke-width="9" stroke-linecap="round"/>
  <line x1="57" y1="50" x2="79" y2="73" stroke="#fafaf8" stroke-width="9" stroke-linecap="round"/>
</svg>`;

const USER_AVATAR_SVG = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
  <circle cx="12" cy="8" r="4"/>
  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
</svg>`;

const TYPING_SVG = `<svg class="dots-anim" width="28" height="12" viewBox="0 0 28 12" xmlns="http://www.w3.org/2000/svg">
  <circle cx="5"  cy="6" r="2.2" fill="#aaaaaa"><animate id="td0" begin="0;td2.end+0.25s" attributeName="cy" calcMode="spline" dur="0.55s" values="6;2.5;6" keySplines=".33,.66,.66,1;.33,0,.66,.33"/></circle>
  <circle cx="14" cy="6" r="2.2" fill="#aaaaaa"><animate begin="td0.begin+0.1s" attributeName="cy" calcMode="spline" dur="0.55s" values="6;2.5;6" keySplines=".33,.66,.66,1;.33,0,.66,.33"/></circle>
  <circle cx="23" cy="6" r="2.2" fill="#aaaaaa"><animate id="td2" begin="td0.begin+0.2s" attributeName="cy" calcMode="spline" dur="0.55s" values="6;2.5;6" keySplines=".33,.66,.66,1;.33,0,.66,.33"/></circle>
</svg>`;

// ── Markdown renderer ─────────────────────────────────────────────────────────

function renderMarkdown(md) {
  const esc    = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const inline = s => s
    .replace(/`([^`]+)`/g,        '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g,    '<strong>$1</strong>')
    .replace(/__(.+?)__/g,         '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g,    '<em>$1</em>')
    .replace(/_([^_\n]+)_/g,      '<em>$1</em>');

  // Extract fenced code blocks before line processing
  const blocks = [];
  const MARK   = '\x00B';
  md = md.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) => {
    blocks.push(`<pre><code>${esc(code.trim())}</code></pre>`);
    return MARK + (blocks.length - 1) + '\x00';
  });

  const lines   = md.split('\n');
  const out     = [];
  let listTag   = null;
  const closeList = () => { if (listTag) { out.push(`</${listTag}>`); listTag = null; } };

  for (const raw of lines) {
    if (raw.includes(MARK)) { closeList(); out.push(raw); continue; }

    const hm = raw.match(/^(#{1,3})\s+(.*)/);
    if (hm) { closeList(); const lvl = Math.min(hm[1].length + 1, 4); out.push(`<h${lvl}>${inline(esc(hm[2]))}</h${lvl}>`); continue; }

    const ul = raw.match(/^[-*]\s+(.*)/);
    if (ul) { if (listTag !== 'ul') { closeList(); out.push('<ul>'); listTag = 'ul'; } out.push(`<li>${inline(esc(ul[1]))}</li>`); continue; }

    const ol = raw.match(/^\d+\.\s+(.*)/);
    if (ol) { if (listTag !== 'ol') { closeList(); out.push('<ol>'); listTag = 'ol'; } out.push(`<li>${inline(esc(ol[1]))}</li>`); continue; }

    closeList();
    if (raw.trim() === '') { out.push('<div class="md-gap"></div>'); continue; }
    out.push(`<p>${inline(esc(raw))}</p>`);
  }

  closeList();
  return out.join('').replace(new RegExp(MARK + '(\\d+)\x00', 'g'), (_, i) => blocks[+i]);
}

// ── Provider icons ─────────────────────────────────────────────────────────────

const OPENAI_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 260"><path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/></svg>`;

const GEMINI_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" x2="68.73%" y1="100%" y2="30.395%"><stop offset="0%" stop-color="#1C7DFF"/><stop offset="52%" stop-color="#1C69FF"/><stop offset="100%" stop-color="#F0DCD6"/></linearGradient></defs><path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#g1)"/></svg>`;

const CLAUDE_ICON = `<svg fill="#c96442" fill-rule="evenodd" width="13" height="13" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"/></svg>`;

const HF_ICON = `<span style="font-size:11px;line-height:1">🤗</span>`;

// ── Provider metadata ─────────────────────────────────────────────────────────

const PROVIDERS = {
  claude:      { label: 'Claude',    sub: 'Anthropic',   icon: CLAUDE_ICON },
  gemini:      { label: 'Gemini',    sub: 'Google',      icon: GEMINI_ICON },
  openai:      { label: 'GPT',       sub: 'OpenAI',      icon: OPENAI_ICON },
  huggingface: { label: 'HuggingFace', sub: 'Inference', icon: HF_ICON     },
};

const PROVIDER_ORDER = ['claude', 'gemini', 'openai', 'huggingface'];

// ── Models per provider ───────────────────────────────────────────────────────

const MODELS = {
  openai: [
    { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
    { id: 'gpt-4.1',      label: 'GPT-4.1'      },
    { id: 'o4-mini',      label: 'o4-mini'       },
  ],
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro'   },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ],
  claude: [
    { id: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5'  },
    { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
    { id: 'claude-opus-4-6',   label: 'Claude Opus 4.6'   },
  ],
  huggingface: [
    { id: 'meta-llama/Llama-3.1-8B-Instruct',  label: 'Llama 3.1 8B'  },
    { id: 'meta-llama/Llama-3.3-70B-Instruct', label: 'Llama 3.3 70B' },
  ],
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const askBtn          = document.getElementById('ask');
  const input           = document.getElementById('query');
  const settingsBtn     = document.getElementById('settingsBtn');
  const responseArea    = document.getElementById('responseArea');
  const thinkingRow     = document.getElementById('thinkingRow');
  const answerSection   = document.getElementById('answerSection');
  const answerBody      = document.getElementById('answerBody');
  const answerHeaderLabel = document.getElementById('answerHeaderLabel');
  const chatHistory     = document.getElementById('chatHistory');
  const langSelector    = document.getElementById('langSelector');
  const ytSelector      = document.getElementById('ytSelector');
  const codeInjectBtn   = document.getElementById('codeInjectBtn');

  let chatMessages    = [];   // [{ role, content }] — in-memory only
  let currentStreamEl = null;

  const LANGUAGES = [
    'Python3','Python','Java','C++','C','C#',
    'JavaScript','TypeScript','Go','Kotlin','Swift',
    'Rust','Ruby','PHP','Dart','Scala','Racket','Erlang','Elixir',
  ];
  let selectedLanguage = 'Python3';

  // Provider selector elements
  const providerSelector = document.getElementById('providerSelector');
  const providerBtn      = document.getElementById('providerBtn');
  const providerBtnInner = document.getElementById('providerBtnInner');
  const providerIcon     = document.getElementById('providerIcon');
  const providerLabel    = document.getElementById('providerLabel');

  // Model selector elements
  const modelSelector  = document.getElementById('modelSelector');
  const modelBtn       = document.getElementById('modelBtn');
  const modelBtnInner  = document.getElementById('modelBtnInner');
  const modelLabel     = document.getElementById('modelLabel');

  let selectedProvider = null;
  let selectedModel    = null;
  let savedApiKeys     = {};
  let selectedMode     = 'rag'; // 'rag' | 'chat'

  // ── Load saved keys ───────────────────────────────────────────────────────

  const modeBtn = document.getElementById('modeBtn');

  function renderModeBtn() {
    const labels = { rag: 'RAG', chat: 'Chat', code: 'Code', youtube: 'YT' };
    modeBtn.textContent = labels[selectedMode] || 'RAG';
    modeBtn.className   = 'mode-badge' + (selectedMode !== 'rag' ? ' mode-chat' : '');
  }

  modeBtn.addEventListener('click', () => showOverlay('whisper-modes'));

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    const tabUrl = tab?.url || '';

    chrome.storage.local.get(['apiKeys', 'apiProvider', 'apiKey', 'hfToken', 'selectedProvider', 'selectedModelId', 'selectedMode'], (res) => {
      savedApiKeys = res.apiKeys || {};

      // Migrate legacy single-key storage
      if (res.apiProvider && res.apiKey && !savedApiKeys[res.apiProvider]) {
        savedApiKeys[res.apiProvider] = res.apiKey;
      }
      if (res.hfToken && !savedApiKeys.huggingface) {
        savedApiKeys.huggingface = res.hfToken;
      }

      // Restore last selection, fall back to first available provider with a key
      const lastProvider = res.selectedProvider && savedApiKeys[res.selectedProvider] ? res.selectedProvider : null;
      const firstAvailable = PROVIDER_ORDER.find(p => savedApiKeys[p]) || null;
      selectedProvider = lastProvider || firstAvailable;

      if (selectedProvider) {
        const models = MODELS[selectedProvider];
        selectedModel = models.find(m => m.id === res.selectedModelId) || models[0];
      }

      if (res.selectedMode) selectedMode = res.selectedMode;

      // Auto-detect specialized pages (overrides stored mode for this session)
      if (tabUrl.includes('youtube.com/watch')) {
        selectedMode = 'youtube';
      } else if (tabUrl.match(/leetcode\.com\/problems\//)) {
        selectedMode = 'code';
      }

      renderProviderBtn();
      renderModelBtn();
      renderModeBtn();
      updatePlaceholder();
    });
  });

  function updateModeUI() {
    const placeholders = {
      rag:  'Ask anything about this page…',
      chat: 'Ask anything…',
    };
    input.placeholder = placeholders[selectedMode] || placeholders.rag;

    const shell = document.querySelector('.popup-shell');
    shell.classList.remove('mode-code', 'mode-youtube');

    if (selectedMode === 'code') {
      shell.classList.add('mode-code');
      askBtn.disabled = false;
      renderLangGrid();
    } else if (selectedMode === 'youtube') {
      shell.classList.add('mode-youtube');
      renderYTSelector();
    } else {
      askBtn.disabled = !input.value.trim();
    }
  }

  function renderLangGrid() {
    langSelector.innerHTML = `
      <div class="lang-grid" id="langGrid"></div>
      <div class="lang-hint">Press ↵ to solve · use a strong reasoning model for best results</div>
      <div class="lang-limit">Currently works on LeetCode only</div>`;
    const grid = langSelector.querySelector('#langGrid');
    LANGUAGES.forEach(lang => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang-btn' + (lang === selectedLanguage ? ' active' : '');
      btn.textContent = lang;
      btn.addEventListener('click', () => {
        selectedLanguage = lang;
        grid.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      grid.appendChild(btn);
    });
  }

  function renderYTSelector() {
    ytSelector.innerHTML = `
      <div class="yt-actions">
        <button class="yt-btn" id="ytFullBtn" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h6"/></svg>
          <span class="yt-btn-text">
            <span class="yt-btn-label">Summarize full video</span>
            <span class="yt-btn-sub">Get a structured overview of the entire video</span>
          </span>
        </button>
        <button class="yt-btn" id="ytTimestampBtn" type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span class="yt-btn-text">
            <span class="yt-btn-label">Explain this moment</span>
            <span class="yt-btn-sub">Explain what's being discussed right now</span>
          </span>
        </button>
      </div>
      <div class="yt-hint">use a strong model for best results</div>`;

    document.getElementById('ytFullBtn').addEventListener('click', () => triggerYT('full'));
    document.getElementById('ytTimestampBtn').addEventListener('click', () => triggerYT('timestamp'));
  }

  async function triggerYT(ytMode) {
    if (!selectedProvider) { showError('No provider set. Open Settings (⚙) to add an API key.'); return; }
    const key = savedApiKeys[selectedProvider];
    if (!key) { showError('No API key for this provider. Open Settings (⚙).'); return; }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    function getYTData(cb) {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_YOUTUBE_DATA' }, (res) => {
        if (chrome.runtime.lastError || !res) {
          chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
            if (chrome.runtime.lastError) { cb(null); return; }
            chrome.tabs.sendMessage(tab.id, { type: 'GET_YOUTUBE_DATA' }, (res2) => cb(res2));
          });
          return;
        }
        cb(res);
      });
    }

    getYTData(async (ytData) => {
      if (!ytData?.videoId) {
        showError("Couldn't read this YouTube page. Make sure you're on a video page.");
        return;
      }

      showThinking();

      let response;
      try {
        response = await fetch('https://chrome-rag-extension.onrender.com/ytexplain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Token': key, 'Provider': selectedProvider },
          body: JSON.stringify({
            video_id: ytData.videoId,
            mode: ytMode,
            timestamp: ytMode === 'timestamp' ? ytData.currentTime : null,
            model: selectedModel?.id,
            provider: selectedProvider,
          }),
        });
      } catch (err) {
        showError('Could not reach backend: ' + err.message);
        return;
      }

      if (!response.ok) {
        try { const d = await response.json(); showError(d.detail || 'Backend error.'); }
        catch { showError('Backend error ' + response.status); }
        return;
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '', started = false, md = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') break;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.error) { showError(parsed.error); return; }
              if (parsed.text) {
                if (!started) { startAnswer(); started = true; }
                md += parsed.text;
                currentStreamEl.innerHTML = renderMarkdown(md);
              }
            } catch { /* skip */ }
          }
        }
      } catch (err) {
        if (!started) showError('Stream error: ' + err.message);
      }
    });
  }

  // ── Inject button (persistent handler for code mode) ──────────────────────

  codeInjectBtn.addEventListener('click', async () => {
    const code = codeInjectBtn.dataset.finalCode;
    if (!code) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: 'MAIN',
      func: (c) => {
        try {
          if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models.length > 0) { models[0].setValue(c); return { ok: true }; }
          }
        } catch (_) {}
        try {
          const ta = document.querySelector('.monaco-editor textarea');
          if (ta) {
            ta.focus();
            document.execCommand('selectAll');
            if (document.execCommand('insertText', false, c)) return { ok: true };
          }
        } catch (_) {}
        try {
          const el = document.querySelector('.monaco-editor');
          if (el) {
            const k = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'));
            if (k) {
              let f = el[k], d = 0;
              while (f && d < 200) {
                if (f.stateNode?.editor?.setValue) { f.stateNode.editor.setValue(c); return { ok: true }; }
                f = f.return; d++;
              }
            }
          }
        } catch (_) {}
        return { ok: false, error: 'Could not find Monaco editor.' };
      },
      args: [code],
    }, (results) => {
      const res = results?.[0]?.result;
      if (chrome.runtime.lastError || !res?.ok) {
        codeInjectBtn.textContent = '✗ Inject failed — ' + (res?.error || chrome.runtime.lastError?.message || 'unknown');
        codeInjectBtn.classList.add('inject-fail');
      } else {
        codeInjectBtn.textContent = '✓ Injected!';
        codeInjectBtn.classList.add('inject-done');
        codeInjectBtn.disabled = true;
      }
    });
  });

  // Allow Enter key in code mode (textarea is hidden)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && selectedMode === 'code' && !askBtn.disabled) {
      e.preventDefault();
      askBtn.click();
    }
  });

  // Alias for callers that used the old name
  function updatePlaceholder() { updateModeUI(); }

  settingsBtn.addEventListener('click', () => showOverlay('menu'));

  // ── State helpers ─────────────────────────────────────────────────────────

  function showThinking() {
    responseArea.classList.add('visible');
    thinkingRow.classList.remove('visible');
    codeInjectBtn.style.display = 'none';

    if (selectedMode === 'chat') {
      chatHistory.classList.add('visible');
      answerSection.classList.remove('visible');
      // Typing bubble inside chat
      const wrap = document.createElement('div');
      wrap.className = 'chat-msg ai';
      wrap.id = 'chatTyping';
      wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div><div class="chat-bubble ai-bubble whispering-bubble"><span class="whispering-label">Whispering</span>${TYPING_SVG}</div>`;
      chatHistory.appendChild(wrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    } else {
      // RAG, Code, YouTube: whispering inside answerSection
      chatHistory.classList.remove('visible');
      answerSection.classList.add('visible');
      const headerLabels = { code: 'Solution', youtube: 'Summary' };
      answerHeaderLabel.textContent = headerLabels[selectedMode] || 'Answer';
      answerBody.className = 'answer-body whispering-rag';
      answerBody.innerHTML = `<span class="whispering-label">Whispering</span>${TYPING_SVG}`;
    }
  }

  function startAnswer() {
    document.getElementById('chatTyping')?.remove();
    if (selectedMode === 'chat') {
      const wrap = document.createElement('div');
      wrap.className = 'chat-msg ai';
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble ai-bubble';
      wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div>`;
      wrap.appendChild(bubble);
      chatHistory.appendChild(wrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      currentStreamEl = bubble;
    } else if (selectedMode === 'code') {
      answerBody.className = 'answer-body code-answer';
      answerBody.innerHTML = '';
      currentStreamEl = answerBody;
    } else {
      // RAG and YouTube — clear and stream
      answerBody.className = 'answer-body';
      answerBody.innerHTML = '';
      currentStreamEl = answerBody;
    }
  }

  function showError(text) {
    document.getElementById('chatTyping')?.remove();
    if (selectedMode === 'chat') {
      const wrap = document.createElement('div');
      wrap.className = 'chat-msg ai';
      wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div><div class="chat-bubble ai-bubble error">${escHtml(text)}</div>`;
      chatHistory.appendChild(wrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
    } else {
      responseArea.classList.add('visible');
      answerSection.classList.add('visible');
      answerBody.className = 'answer-body error';
      answerBody.innerText = text;
    }
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Provider button ───────────────────────────────────────────────────────

  function renderProviderBtn() {
    if (!selectedProvider) {
      providerIcon.innerHTML  = '';
      providerLabel.textContent = 'Provider';
      return;
    }
    providerIcon.innerHTML    = PROVIDERS[selectedProvider].icon;
    providerLabel.textContent = PROVIDERS[selectedProvider].label;
  }

  // ── Model button ──────────────────────────────────────────────────────────

  function renderModelBtn() {
    modelLabel.textContent = selectedModel ? selectedModel.label : 'Model';
  }

  function animate(el) {
    el.classList.remove('switching');
    void el.offsetWidth;
    el.classList.add('switching');
  }

  // ── Overlay ───────────────────────────────────────────────────────────────

  const overlay      = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayList  = document.getElementById('overlayList');
  const overlayClose = document.getElementById('overlayClose');
  const overlayBack  = document.getElementById('overlayBack');

  function showOverlay(mode, prevMode = null) {
    overlayList.innerHTML = '';
    overlayBack.style.display = prevMode ? 'flex' : 'none';
    overlayBack.onclick = prevMode ? () => showOverlay(prevMode) : null;

    if (mode === 'menu') {
      overlayTitle.textContent = 'Menu';

      const menuItems = [
        {
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
          label: 'Providers',
          sub: 'Manage your API keys',
          action: () => { hideOverlay(); chrome.runtime.openOptionsPage(); },
          disabled: false,
        },
        {
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h2l3-8 4 16 3-10 2 4 2-2h4"/></svg>`,
          label: 'Whisper Modes',
          sub: { rag: 'WhisperRAG active', chat: 'WhisperChat active', code: 'WhisperCode active', youtube: 'WhisperYT active' }[selectedMode] || 'WhisperRAG active',
          action: () => showOverlay('whisper-modes', 'menu'),
          disabled: false,
        },
        {
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
          label: 'About Us',
          sub: 'Coming soon',
          action: null,
          disabled: true,
        },
      ];

      menuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'ov-option menu-option' + (item.disabled ? ' menu-disabled' : '');
        btn.innerHTML = `
          <span class="ov-left">
            <span class="ov-icon">${item.icon}</span>
            <span class="ov-meta">
              <span class="ov-name">${item.label}</span>
              <span class="ov-sub">${item.sub}</span>
            </span>
          </span>
          ${item.disabled
            ? '<span class="menu-soon">Soon</span>'
            : `<svg class="menu-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`
          }`;
        if (!item.disabled) btn.addEventListener('click', item.action);
        overlayList.appendChild(btn);
      });

    } else if (mode === 'whisper-modes') {
      overlayTitle.textContent = 'Whisper Modes';

      const modes = [
        {
          key: 'rag',
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
          label: 'WhisperRAG',
          sub: "Chat with this page's content using semantic search",
        },
        {
          key: 'chat',
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
          label: 'WhisperChat',
          sub: 'Chat directly with AI — no page context',
        },
        {
          key: 'code',
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
          label: 'WhisperCode',
          sub: 'Solve & inject code — LeetCode / coding sites',
        },
        {
          key: 'youtube',
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/></svg>`,
          label: 'WhisperYT',
          sub: 'Summarize & explain YouTube videos',
        },
      ];

      modes.forEach(m => {
        const isActive = m.key === selectedMode;
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'ov-option menu-option' + (isActive ? ' active' : '');
        btn.innerHTML = `
          <span class="ov-left">
            <span class="ov-icon">${m.icon}</span>
            <span class="ov-meta">
              <span class="ov-name">${m.label}</span>
              <span class="ov-sub">${m.sub}</span>
            </span>
          </span>
          <svg class="ov-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
        btn.addEventListener('click', () => {
          selectedMode = m.key;
          chrome.storage.local.set({ selectedMode });
          renderModeBtn();
          updatePlaceholder();
          // Clear all output on mode change
          responseArea.classList.remove('visible');
          chatHistory.innerHTML = '';
          chatHistory.classList.remove('visible');
          answerSection.classList.remove('visible');
          answerBody.className = 'answer-body';
          answerBody.innerHTML = '';
          codeInjectBtn.style.display = 'none';
          chatMessages = [];
          hideOverlay();
        });
        overlayList.appendChild(btn);
      });

    } else if (mode === 'provider') {
      overlayTitle.textContent = 'Choose Provider';
      providerSelector.classList.add('open');

      PROVIDER_ORDER.forEach(provKey => {
        const prov     = PROVIDERS[provKey];
        const hasKey   = !!savedApiKeys[provKey];
        const isActive = provKey === selectedProvider;

        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'ov-option' + (isActive ? ' active' : '') + (!hasKey ? ' nokey' : '');
        btn.innerHTML = `
          <span class="ov-left">
            <span class="ov-icon">${prov.icon}</span>
            <span class="ov-meta">
              <span class="ov-name">${prov.label}</span>
              <span class="ov-sub">${prov.sub}${!hasKey ? ' &nbsp;·&nbsp; <span class="ov-nokey-tag">no key</span>' : ''}</span>
            </span>
          </span>
          <svg class="ov-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;

        btn.addEventListener('click', () => {
          if (hasKey) {
            selectedProvider = provKey;
            selectedModel    = MODELS[provKey][0];
            chrome.storage.local.set({ selectedProvider, selectedModelId: selectedModel.id });
            animate(providerBtnInner);
            animate(modelBtnInner);
            renderProviderBtn();
            renderModelBtn();
          } else {
            chrome.runtime.openOptionsPage();
          }
          hideOverlay();
        });
        overlayList.appendChild(btn);
      });

    } else {
      overlayTitle.textContent = 'Choose Model';
      modelSelector.classList.add('open');

      if (selectedProvider) {
        MODELS[selectedProvider].forEach(m => {
          const isActive = m.id === selectedModel?.id;
          const btn = document.createElement('button');
          btn.type      = 'button';
          btn.className = 'ov-option' + (isActive ? ' active' : '');
          btn.innerHTML = `
            <span class="ov-left">
              <span class="ov-icon">${PROVIDERS[selectedProvider].icon}</span>
              <span class="ov-name">${m.label}</span>
            </span>
            <svg class="ov-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
          btn.addEventListener('click', () => {
            selectedModel = m;
            chrome.storage.local.set({ selectedModelId: m.id });
            animate(modelBtnInner);
            renderModelBtn();
            hideOverlay();
          });
          overlayList.appendChild(btn);
        });
      }
    }

    overlay.classList.add('visible');
  }

  function hideOverlay() {
    overlay.classList.remove('visible');
    providerSelector.classList.remove('open');
    modelSelector.classList.remove('open');
  }

  overlayClose.addEventListener('click', hideOverlay);
  providerBtn.addEventListener('click', () => showOverlay('provider'));
  modelBtn.addEventListener('click',    () => showOverlay('model'));

  // ── Textarea ──────────────────────────────────────────────────────────────

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    askBtn.disabled = !input.value.trim();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!askBtn.disabled) askBtn.click();
    }
  });

  // ── Send ──────────────────────────────────────────────────────────────────

  askBtn.addEventListener('click', async () => {
    const query = selectedMode === 'code' ? '' : input.value.trim();
    if (!query && selectedMode !== 'code') return;

    if (!selectedProvider) {
      showError('No provider set. Open Settings (⚙) to add an API key.');
      return;
    }

    input.value        = '';
    input.style.height = 'auto';
    if (selectedMode !== 'code') askBtn.disabled = true;
    hideOverlay();

    if (selectedMode === 'chat') {
      // Append user bubble
      responseArea.classList.add('visible');
      chatHistory.classList.add('visible');
      answerSection.classList.remove('visible');
      const userWrap = document.createElement('div');
      userWrap.className = 'chat-msg user';
      userWrap.innerHTML = `<div class="chat-bubble user-bubble">${escHtml(query)}</div><div class="chat-avatar user-av">${USER_AVATAR_SVG}</div>`;
      chatHistory.appendChild(userWrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      chatMessages.push({ role: 'user', content: query });
    }

    // code mode handles its own UI inside solveCode
    if (selectedMode !== 'code') showThinking();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      async function streamFromBackend(chunks) {
        const key = savedApiKeys[selectedProvider];
        if (!key) { showError('No API key for this provider. Open Settings (⚙).'); return; }

        const isChat = selectedMode === 'chat';
        const url    = isChat ? 'https://chrome-rag-extension.onrender.com/chat' : 'https://chrome-rag-extension.onrender.com/rag';
        const body   = isChat
          ? { query, model: selectedModel?.id, provider: selectedProvider, history: chatMessages.slice(0, -1) }
          : { query, chunks, model: selectedModel?.id, provider: selectedProvider };

        let response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Token':    key,
              'Provider': selectedProvider,
            },
            body: JSON.stringify(body),
          });
        } catch (err) {
          showError('Could not reach backend: ' + err.message);
          return;
        }

        if (!response.ok) {
          try { const d = await response.json(); showError(d.detail || 'Backend error.'); }
          catch { showError('Backend error ' + response.status); }
          return;
        }

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer   = '';
        let started  = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();                          // keep incomplete line
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') return;
              try {
                const parsed = JSON.parse(raw);
                if (parsed.error) { showError(parsed.error); return; }
                if (parsed.text) {
                  if (!started) { started = true; startAnswer(); }
                  fullText += parsed.text;
                  currentStreamEl.innerHTML = renderMarkdown(fullText);
                  (selectedMode === 'chat' ? chatHistory : answerBody).scrollTop = 99999;
                }
              } catch { /* skip malformed SSE line */ }
            }
          }
        } catch (err) {
          if (!fullText) showError('Stream error: ' + err.message);
        }
        // Save AI response to history
        if (selectedMode === 'chat' && fullText) {
          chatMessages.push({ role: 'assistant', content: fullText });
        }
      }

      function getPageData() {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (response) => {
          if (chrome.runtime.lastError || !response?.chunks) {
            chrome.scripting.executeScript(
              { target: { tabId: tab.id }, files: ['content.js'] },
              () => {
                if (chrome.runtime.lastError) {
                  showError('Cannot access this page (try a regular http/https page).');
                  return;
                }
                chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (resp2) => {
                  if (!resp2?.chunks) { showError('Could not read page content.'); return; }
                  streamFromBackend(resp2.chunks);
                });
              }
            );
            return;
          }
          streamFromBackend(response.chunks);
        });
      }

      async function solveCode(tab, instruction) {
        // Must be on a LeetCode problem page
        if (!tab.url || !tab.url.match(/^https?:\/\/(www\.)?leetcode\.com\/problems\//)) {
          showError('Open a LeetCode problem page first, then use WhisperCode.');
          return;
        }

        // Inject content script if needed, then scrape LeetCode data
        function getLCData(cb) {
          chrome.tabs.sendMessage(tab.id, { type: 'GET_LEETCODE_DATA' }, (res) => {
            if (chrome.runtime.lastError || !res) {
              chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
                if (chrome.runtime.lastError) { showError('Cannot access this page.'); return; }
                chrome.tabs.sendMessage(tab.id, { type: 'GET_LEETCODE_DATA' }, (res2) => cb(res2));
              });
              return;
            }
            cb(res);
          });
        }

        getLCData(async (lcData) => {
          if (!lcData || !lcData.description) {
            showError('Could not read the problem. Make sure the page is fully loaded.');
            return;
          }

          const key = savedApiKeys[selectedProvider];
          if (!key) { showError('No API key for this provider. Open Settings (⚙).'); return; }

          showThinking();

          let response;
          try {
            response = await fetch('https://chrome-rag-extension.onrender.com/code', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Token': key, 'Provider': selectedProvider },
              body: JSON.stringify({
                title:        lcData.title,
                description:  lcData.description,
                language:     selectedLanguage,
                current_code: lcData.currentCode,
                instruction:  instruction || null,
                model:        selectedModel?.id,
                provider:     selectedProvider,
              }),
            });
          } catch (err) {
            showError('Could not reach backend: ' + err.message);
            return;
          }

          if (!response.ok) {
            try { const d = await response.json(); showError(d.detail || 'Backend error.'); }
            catch { showError('Backend error ' + response.status); }
            return;
          }

          const reader  = response.body.getReader();
          const decoder = new TextDecoder();
          let fullCode    = '';
          let buffer      = '';
          let codeStarted = false;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop();
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]') break;
                try {
                  const parsed = JSON.parse(raw);
                  if (parsed.error) { showError(parsed.error); return; }
                  if (parsed.text) {
                    if (!codeStarted) {
                      codeStarted = true;
                      startAnswer(); // clears whispering, sets up dark code answerBody
                    }
                    fullCode += parsed.text;
                    currentStreamEl.textContent = fullCode.replace(/^```[\w]*\n?/,'').replace(/\n?```$/,'');
                    answerBody.scrollTop = answerBody.scrollHeight;
                  }
                } catch { /* skip */ }
              }
            }
          } catch (err) {
            if (!fullCode) { showError('Stream error: ' + err.message); return; }
          }

          // Show inject button
          const finalCode = fullCode.replace(/^```[\w]*\n?/,'').replace(/\n?```$/,'');
          codeInjectBtn.dataset.finalCode = finalCode;
          codeInjectBtn.textContent = 'Inject into editor →';
          codeInjectBtn.className = 'inject-btn-header';
          codeInjectBtn.disabled = false;
          codeInjectBtn.style.display = 'block';
        });
      }

      if (selectedMode === 'chat') {
        streamFromBackend([]);
      } else if (selectedMode === 'code') {
        solveCode(tab, query);
      } else {
        getPageData();
      }

    } catch (err) {
      showError('Unexpected error: ' + err.message);
    }
  });
});
