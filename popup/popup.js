// ── Backend URL — toggle one line to switch between local and production ──────
const BACKEND = 'http://localhost:5000';        // ← local testing
// const BACKEND = 'https://chrome-rag-extension.onrender.com'; // ← production

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

// ── Provider & model metadata ──────────────────────────────────────────────────

const PROVIDERS = {
  claude: { label: 'Claude', sub: 'Anthropic', icon: CLAUDE_ICON },
  gemini: { label: 'Gemini', sub: 'Google',    icon: GEMINI_ICON },
  openai: { label: 'GPT',    sub: 'OpenAI',    icon: OPENAI_ICON },
};

const PROVIDER_ORDER = ['claude', 'gemini', 'openai'];

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
};

// ── Shared SSE stream reader ───────────────────────────────────────────────────

async function readSSEStream(response, { onText, onMeta, onError }) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
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
        if (raw === '[DONE]') return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error)                            { onError?.(parsed.error); return; }
          if ('used_rag' in parsed || 'tool' in parsed) { onMeta?.(parsed); continue; }
          if (parsed.text)                               onText?.(parsed.text);
        } catch { /* skip malformed line */ }
      }
    }
  } catch (err) {
    onError?.(err.message);
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const askBtn       = document.getElementById('ask');
  const input        = document.getElementById('query');
  const settingsBtn  = document.getElementById('settingsBtn');
  const responseArea = document.getElementById('responseArea');
  const chatHistory  = document.getElementById('chatHistory');

  // Overlay elements
  const overlay      = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlayTitle');
  const overlayList  = document.getElementById('overlayList');
  const overlayClose = document.getElementById('overlayClose');
  const overlayBack  = document.getElementById('overlayBack');

  // Selector elements
  const providerSelector = document.getElementById('providerSelector');
  const providerBtn      = document.getElementById('providerBtn');
  const providerBtnInner = document.getElementById('providerBtnInner');
  const providerIcon     = document.getElementById('providerIcon');
  const providerLabel    = document.getElementById('providerLabel');
  const modelSelector    = document.getElementById('modelSelector');
  const modelBtn         = document.getElementById('modelBtn');
  const modelBtnInner    = document.getElementById('modelBtnInner');
  const modelLabel       = document.getElementById('modelLabel');

  let selectedProvider  = null;
  let selectedModel     = null;
  let savedApiKeys      = {};
  let chatMessages      = [];
  let currentStreamEl   = null;
  let activeController  = null;

  const STOP_ICON = `<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`;
  const SEND_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;

  function setStopMode(on) {
    askBtn.disabled = false;
    askBtn.innerHTML = on ? STOP_ICON : SEND_ICON;
    askBtn.classList.toggle('stop-mode', on);
    if (!on) askBtn.disabled = !input.value.trim();
  }

  const CODE_TOOLS  = new Set(['explain_problem', 'suggest_approach', 'analyze_code', 'give_hint', 'solve_code']);
  const TOOL_LABELS = {
    explain_problem:  'Explanation',
    suggest_approach: 'Approach',
    analyze_code:     'Analysis',
    give_hint:        'Hint',
    solve_code:       'Solution',
  };

  const CODE_SITE_RE = /leetcode\.com\/problems\/|geeksforgeeks\.org\/problems\/|hackerrank\.com\/challenges\/|codeforces\.com\/problemset\/problem\//;

  // ── Load saved state ───────────────────────────────────────────────────────

  chrome.storage.local.get(
    ['apiKeys', 'apiProvider', 'apiKey', 'selectedProvider', 'selectedModelId'],
    (res) => {
      savedApiKeys = res.apiKeys || {};

      // Migrate legacy single-key storage
      if (res.apiProvider && res.apiKey && !savedApiKeys[res.apiProvider])
        savedApiKeys[res.apiProvider] = res.apiKey;

      const lastProvider = res.selectedProvider && savedApiKeys[res.selectedProvider]
        ? res.selectedProvider : null;
      selectedProvider = lastProvider || PROVIDER_ORDER.find(p => savedApiKeys[p]) || null;

      if (selectedProvider) {
        const models = MODELS[selectedProvider];
        selectedModel = models.find(m => m.id === res.selectedModelId) || models[0];
      }

      renderProviderBtn();
      renderModelBtn();
    }
  );

  // ── UI helpers ─────────────────────────────────────────────────────────────

  function showThinking() {
    responseArea.classList.add('visible');
    chatHistory.classList.add('visible');
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg ai';
    wrap.id        = 'chatTyping';
    wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div><div class="chat-bubble ai-bubble whispering-bubble"><span class="whispering-label">Whispering</span>${TYPING_SVG}</div>`;
    chatHistory.appendChild(wrap);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function startAnswer(toolName, usedRag, isYoutube) {
    document.getElementById('chatTyping')?.remove();
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg ai';

    if (toolName === 'solve_code') {
      const codeBubble = document.createElement('div');
      codeBubble.className = 'code-bubble';
      codeBubble.innerHTML = `<pre><code></code></pre><button class="inject-btn" disabled>Inject into editor →</button>`;
      wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div>`;
      wrap.appendChild(codeBubble);
      chatHistory.appendChild(wrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      currentStreamEl = codeBubble.querySelector('code');
      codeBubble.querySelector('.inject-btn').addEventListener('click', (e) => handleInject(e.currentTarget));
    } else {
      const bubble = document.createElement('div');
      bubble.className = 'chat-bubble ai-bubble';
      if (CODE_TOOLS.has(toolName)) {
        const badge = document.createElement('span');
        badge.className   = 'source-badge';
        badge.textContent = TOOL_LABELS[toolName] || 'Answer';
        bubble.appendChild(badge);
      } else if (usedRag) {
        const badge = document.createElement('span');
        badge.className   = 'source-badge';
        badge.textContent = isYoutube ? '🎬 from video' : '📄 from page';
        bubble.appendChild(badge);
      }
      // Separate text container so badge is never overwritten by streaming innerHTML
      const textEl = document.createElement('div');
      bubble.appendChild(textEl);
      wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div>`;
      wrap.appendChild(bubble);
      chatHistory.appendChild(wrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      currentStreamEl = textEl;
    }
  }

  function showError(text) {
    document.getElementById('chatTyping')?.remove();
    responseArea.classList.add('visible');
    chatHistory.classList.add('visible');
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg ai';
    wrap.innerHTML = `<div class="chat-avatar ai-av">${AI_AVATAR_SVG}</div><div class="chat-bubble ai-bubble error">${escHtml(text)}</div>`;
    chatHistory.appendChild(wrap);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Inject handler ─────────────────────────────────────────────────────────

  async function handleInject(btn) {
    const code = btn.dataset.finalCode;
    if (!code) return;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world:  'MAIN',
      func: (c) => {
        try {
          if (window.monaco?.editor) {
            const models = window.monaco.editor.getModels();
            if (models.length > 0) { models[0].setValue(c); return { ok: true }; }
          }
        } catch (_) {}
        try {
          const ta = document.querySelector('.monaco-editor textarea');
          if (ta) { ta.focus(); document.execCommand('selectAll'); if (document.execCommand('insertText', false, c)) return { ok: true }; }
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
        btn.textContent = '✗ Inject failed — ' + (res?.error || chrome.runtime.lastError?.message || 'unknown');
        btn.classList.add('inject-fail');
      } else {
        btn.textContent = '✓ Injected!';
        btn.classList.add('inject-done');
        btn.disabled = true;
      }
    });
  }

  // ── Provider / model buttons ───────────────────────────────────────────────

  function renderProviderBtn() {
    if (!selectedProvider) { providerIcon.innerHTML = ''; providerLabel.textContent = 'Provider'; return; }
    providerIcon.innerHTML    = PROVIDERS[selectedProvider].icon;
    providerLabel.textContent = PROVIDERS[selectedProvider].label;
  }

  function renderModelBtn() {
    modelLabel.textContent = selectedModel ? selectedModel.label : 'Model';
  }

  function animate(el) {
    el.classList.remove('switching');
    void el.offsetWidth;
    el.classList.add('switching');
  }

  // ── Overlay ────────────────────────────────────────────────────────────────

  function showOverlay(mode, prevMode = null) {
    overlayList.innerHTML = '';
    overlayBack.style.display = prevMode ? 'flex' : 'none';
    overlayBack.onclick = prevMode ? () => showOverlay(prevMode) : null;

    if (mode === 'menu') {
      overlayTitle.textContent = 'Menu';

      const items = [
        {
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>`,
          label: 'Providers', sub: 'Manage your API keys',
          action: () => { hideOverlay(); chrome.runtime.openOptionsPage(); },
        },
        {
          icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
          label: 'About Us', sub: 'Coming soon', disabled: true,
        },
      ];

      items.forEach(item => {
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

    } else if (mode === 'provider') {
      overlayTitle.textContent = 'Choose Provider';

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
      // model picker
      overlayTitle.textContent = 'Choose Model';
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
  settingsBtn.addEventListener('click', () => showOverlay('menu'));

  // ── Context fetching ───────────────────────────────────────────────────────

  function getPageChunks(tab, cb) {
    chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (res) => {
      if (chrome.runtime.lastError || !res) {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
          if (chrome.runtime.lastError) { showError('Cannot access this page (try a regular http/https page).'); return; }
          chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (r2) => cb(r2?.chunks || null));
        });
        return;
      }
      cb(res?.chunks || null);
    });
  }

  function getContextData(tab, onReady) {
    const isYT = tab.url?.includes('youtube.com/watch');
    getPageChunks(tab, (chunks) => {
      if (!isYT) { onReady(chunks, null); return; }
      chrome.tabs.sendMessage(tab.id, { type: 'GET_YOUTUBE_DATA' }, (ytRes) => {
        if (chrome.runtime.lastError || !ytRes) {
          chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
            chrome.tabs.sendMessage(tab.id, { type: 'GET_YOUTUBE_DATA' }, (ytRes2) => onReady(chunks, ytRes2));
          });
          return;
        }
        onReady(chunks, ytRes);
      });
    });
  }

  // ── Main handler ───────────────────────────────────────────────────────────

  async function handleQuery(tab, query) {
    const key = savedApiKeys[selectedProvider];
    if (!key) { showError('No API key for this provider. Open Settings (⚙).'); return; }

    async function doFetch(chunks, youtube, lcData) {
      const leetcode = lcData?.description ? {
        title:        lcData.title,
        description:  lcData.description,
        language:     lcData.language || 'Python3',
        current_code: lcData.currentCode || null,
      } : null;

      activeController = new AbortController();
      setStopMode(true);

      let response;
      try {
        response = await fetch(`${BACKEND}/chat`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', 'Token': key, 'Provider': selectedProvider },
          signal:  activeController.signal,
          body: JSON.stringify({
            query,
            chunks:   chunks || [],
            model:    selectedModel?.id,
            history:  chatMessages.slice(0, -1),
            youtube,
            leetcode,
          }),
        });
      } catch (err) {
        setStopMode(false);
        if (err.name === 'AbortError') return;
        showError('Could not reach backend: ' + err.message);
        return;
      }

      if (!response.ok) {
        try { const d = await response.json(); showError(d.detail || 'Backend error.'); }
        catch { showError('Backend error ' + response.status); }
        return;
      }

      let fullText = '', toolName = null, usedRag = false, isYoutube = false, started = false;

      await readSSEStream(response, {
        onMeta: (parsed) => { toolName = parsed.tool; usedRag = parsed.used_rag; isYoutube = parsed.is_youtube; },
        onText: (text) => {
          if (!started) { started = true; startAnswer(toolName, usedRag, isYoutube); }
          fullText += text;
          if (toolName === 'solve_code') {
            currentStreamEl.textContent = fullText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
            currentStreamEl.closest('pre').scrollTop = currentStreamEl.closest('pre').scrollHeight;
          } else {
            currentStreamEl.innerHTML = renderMarkdown(fullText);
            chatHistory.scrollTop = chatHistory.scrollHeight;
          }
        },
        onError: (msg) => { if (!activeController?.signal.aborted) showError(msg); },
      });

      setStopMode(false);

      if (toolName === 'solve_code' && fullText) {
        const finalCode = fullText.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
        const injectBtn = currentStreamEl?.closest('.code-bubble')?.querySelector('.inject-btn');
        if (injectBtn) { injectBtn.dataset.finalCode = finalCode; injectBtn.disabled = false; }
      }

      if (fullText) chatMessages.push({ role: 'assistant', content: fullText });
    }

    getContextData(tab, async (chunks, ytData) => {
      const youtube = ytData?.videoId
        ? { video_id: ytData.videoId, current_time: ytData.currentTime ?? null }
        : null;

      if (tab.url?.match(CODE_SITE_RE)) {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_LEETCODE_DATA' }, async (lcRes) => {
          if (chrome.runtime.lastError || !lcRes) {
            chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }, () => {
              if (chrome.runtime.lastError) { showError('Cannot access this page.'); return; }
              chrome.tabs.sendMessage(tab.id, { type: 'GET_LEETCODE_DATA' }, (lcRes2) => doFetch(chunks, youtube, lcRes2));
            });
            return;
          }
          await doFetch(chunks, youtube, lcRes);
        });
      } else {
        await doFetch(chunks, youtube, null);
      }
    });
  }

  // ── Input handling ─────────────────────────────────────────────────────────

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    askBtn.disabled = !input.value.trim();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!askBtn.disabled) askBtn.click(); }
  });

  // ── Send button ────────────────────────────────────────────────────────────

  askBtn.addEventListener('click', async () => {
    if (askBtn.classList.contains('stop-mode')) {
      activeController?.abort();
      setStopMode(false);
      document.getElementById('chatTyping')?.remove();
      return;
    }

    const query = input.value.trim();
    if (!query) return;
    if (!selectedProvider) { showError('No provider set. Open Settings (⚙) to add an API key.'); return; }

    input.value        = '';
    input.style.height = 'auto';
    askBtn.disabled    = true;
    hideOverlay();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      responseArea.classList.add('visible');
      chatHistory.classList.add('visible');
      const userWrap = document.createElement('div');
      userWrap.className = 'chat-msg user';
      userWrap.innerHTML = `<div class="chat-bubble user-bubble">${escHtml(query)}</div><div class="chat-avatar user-av">${USER_AVATAR_SVG}</div>`;
      chatHistory.appendChild(userWrap);
      chatHistory.scrollTop = chatHistory.scrollHeight;
      chatMessages.push({ role: 'user', content: query });

      showThinking();
      handleQuery(tab, query);
    } catch (err) {
      showError('Unexpected error: ' + err.message);
    }
  });
});
