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
    { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    { id: 'gpt-4o',      label: 'GPT-4o'      },
    { id: 'o3-mini',     label: 'o3-mini'      },
  ],
  gemini: [
    { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash' },
    { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro'   },
  ],
  claude: [
    { id: 'claude-3-5-haiku-20241022',  label: 'Claude 3.5 Haiku'  },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { id: 'claude-opus-4-5',            label: 'Claude Opus 4.5'   },
  ],
  huggingface: [
    { id: 'meta-llama/Llama-3.1-8B-Instruct',   label: 'Llama 3.1 8B'  },
    { id: 'meta-llama/Llama-3.1-70B-Instruct',  label: 'Llama 3.1 70B' },
    { id: 'mistralai/Mistral-7B-Instruct-v0.2', label: 'Mistral 7B'    },
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

  // Provider selector elements
  const providerSelector  = document.getElementById('providerSelector');
  const providerBtn       = document.getElementById('providerBtn');
  const providerBtnInner  = document.getElementById('providerBtnInner');
  const providerIcon      = document.getElementById('providerIcon');
  const providerLabel     = document.getElementById('providerLabel');
  const providerDropdown  = document.getElementById('providerDropdown');

  // Model selector elements
  const modelSelector   = document.getElementById('modelSelector');
  const modelBtn        = document.getElementById('modelBtn');
  const modelBtnInner   = document.getElementById('modelBtnInner');
  const modelLabel      = document.getElementById('modelLabel');
  const modelDropdown   = document.getElementById('modelDropdown');

  let selectedProvider = null;
  let selectedModel    = null;
  let savedApiKeys     = {};

  // ── Load saved keys ───────────────────────────────────────────────────────

  chrome.storage.local.get(['apiKeys', 'apiProvider', 'apiKey', 'hfToken'], (res) => {
    savedApiKeys = res.apiKeys || {};

    // Migrate legacy single-key storage
    if (res.apiProvider && res.apiKey && !savedApiKeys[res.apiProvider]) {
      savedApiKeys[res.apiProvider] = res.apiKey;
    }
    if (res.hfToken && !savedApiKeys.huggingface) {
      savedApiKeys.huggingface = res.hfToken;
    }

    // Default: first provider with a key saved
    const firstAvailable = PROVIDER_ORDER.find(p => savedApiKeys[p]) || null;
    selectedProvider = firstAvailable;
    selectedModel    = selectedProvider ? MODELS[selectedProvider][0] : null;

    renderProviderBtn();
    renderProviderDropdown();
    renderModelBtn();
    renderModelDropdown();
  });

  settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());

  // ── State helpers ─────────────────────────────────────────────────────────

  function showThinking() {
    responseArea.classList.add('visible');
    thinkingRow.classList.add('visible');
    answerSection.classList.remove('visible');
    answerBody.className = 'answer-body';
  }

  function showAnswer(text) {
    thinkingRow.classList.remove('visible');
    answerSection.classList.add('visible');
    answerBody.className = 'answer-body';
    answerBody.innerText = text;
  }

  function showError(text) {
    thinkingRow.classList.remove('visible');
    answerSection.classList.add('visible');
    answerBody.className = 'answer-body error';
    answerBody.innerText = text;
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

  function renderProviderDropdown() {
    providerDropdown.innerHTML = '';
    PROVIDER_ORDER.forEach(provKey => {
      const prov    = PROVIDERS[provKey];
      const hasKey  = !!savedApiKeys[provKey];
      const isActive = provKey === selectedProvider;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sel-option' +
        (isActive ? ' active' : '') +
        (!hasKey  ? ' dimmed' : '');

      btn.innerHTML = `
        <span class="opt-left">
          <span class="opt-icon">${prov.icon}</span>
          <span class="opt-meta">
            <span class="opt-name">${prov.label}</span>
            <span class="opt-sub">${prov.sub}</span>
          </span>
          ${!hasKey ? '<span class="opt-nokey">no key</span>' : ''}
        </span>
        <svg class="opt-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>`;

      if (hasKey) {
        btn.addEventListener('click', () => {
          if (provKey !== selectedProvider) {
            selectedProvider = provKey;
            selectedModel    = MODELS[provKey][0];
            animate(providerBtnInner);
            animate(modelBtnInner);
            renderProviderBtn();
            renderProviderDropdown();
            renderModelBtn();
            renderModelDropdown();
          }
          closeAll();
        });
      } else {
        // No key — clicking opens settings
        btn.addEventListener('click', () => {
          chrome.runtime.openOptionsPage();
          closeAll();
        });
        btn.title = 'Add key in Settings';
      }

      providerDropdown.appendChild(btn);
    });
  }

  // ── Model button ──────────────────────────────────────────────────────────

  function renderModelBtn() {
    modelLabel.textContent = selectedModel ? selectedModel.label : 'Model';
  }

  function renderModelDropdown() {
    modelDropdown.innerHTML = '';
    if (!selectedProvider) return;

    MODELS[selectedProvider].forEach(m => {
      const isActive = m.id === selectedModel?.id;
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'sel-option' + (isActive ? ' active' : '');
      btn.innerHTML = `
        <span class="opt-left">
          <span class="opt-name">${m.label}</span>
        </span>
        <svg class="opt-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>`;
      btn.addEventListener('click', () => {
        selectedModel = m;
        animate(modelBtnInner);
        renderModelBtn();
        renderModelDropdown();
        closeAll();
      });
      modelDropdown.appendChild(btn);
    });
  }

  function animate(el) {
    el.classList.remove('switching');
    void el.offsetWidth;
    el.classList.add('switching');
  }

  // ── Dropdown open/close ───────────────────────────────────────────────────

  function positionDropdown(btn, dropdown) {
    const rect = btn.getBoundingClientRect();
    dropdown.style.top    = (rect.bottom + 4) + 'px';
    dropdown.style.left   = rect.left + 'px';
    dropdown.style.bottom = 'auto';
  }

  function reserveSpace(btn, itemCount, itemHeight) {
    const rect = btn.getBoundingClientRect();
    const needed = rect.bottom + 4 + itemCount * itemHeight + 8;
    if (needed > window.innerHeight) {
      document.body.style.minHeight = needed + 'px';
    }
  }
  function releaseSpace() {
    document.body.style.minHeight = '';
  }

  function openProvider() {
    closeModel();
    reserveSpace(providerBtn, 4, 52);
    positionDropdown(providerBtn, providerDropdown);
    providerSelector.classList.add('open');
    providerDropdown.classList.add('open');
  }
  function openModel() {
    closeProvider();
    reserveSpace(modelBtn, 3, 40);
    positionDropdown(modelBtn, modelDropdown);
    modelSelector.classList.add('open');
    modelDropdown.classList.add('open');
  }
  function closeProvider() {
    providerSelector.classList.remove('open');
    providerDropdown.classList.remove('open');
    releaseSpace();
  }
  function closeModel() {
    modelSelector.classList.remove('open');
    modelDropdown.classList.remove('open');
    releaseSpace();
  }
  function closeAll() { closeProvider(); closeModel(); }

  providerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    providerSelector.classList.contains('open') ? closeAll() : openProvider();
  });
  modelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    modelSelector.classList.contains('open') ? closeAll() : openModel();
  });

  providerDropdown.addEventListener('click', (e) => e.stopPropagation());
  modelDropdown.addEventListener('click',    (e) => e.stopPropagation());
  document.addEventListener('click', closeAll);

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
    const query = input.value.trim();
    if (!query) return;

    if (!selectedProvider) {
      showError('No provider set. Open Settings (⚙) to add an API key.');
      return;
    }

    input.value        = '';
    input.style.height = 'auto';
    askBtn.disabled    = true;
    closeAll();
    showThinking();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      function sendToBackend(chunks) {
        const payload = {
          query,
          chunks,
          model:    selectedModel?.id,
          provider: selectedProvider,
        };
        chrome.runtime.sendMessage({ type: 'ASK_BACKEND', payload }, (res) => {
          if (chrome.runtime.lastError) { showError('Backend not reachable.'); return; }
          if (res?.error) showError(res.error);
          else            showAnswer(res.answer);
        });
      }

      function getPageData() {
        chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (response) => {
          if (chrome.runtime.lastError || !response?.chunks) {
            // Inject content script and retry once
            chrome.scripting.executeScript(
              { target: { tabId: tab.id }, files: ['content.js'] },
              () => {
                if (chrome.runtime.lastError) {
                  showError('Cannot access this page (try a regular http/https page).');
                  return;
                }
                chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_DATA' }, (resp2) => {
                  if (!resp2?.chunks) { showError('Could not read page content.'); return; }
                  sendToBackend(resp2.chunks);
                });
              }
            );
            return;
          }
          sendToBackend(response.chunks);
        });
      }

      getPageData();

    } catch (err) {
      showError('Unexpected error: ' + err.message);
    }
  });
});
