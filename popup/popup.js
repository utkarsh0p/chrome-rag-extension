// ── Provider icons ────────────────────────────────────────────────────────────

const OPENAI_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 260"><path d="M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z"/></svg>`;

const GEMINI_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" x2="68.73%" y1="100%" y2="30.395%"><stop offset="0%" stop-color="#1C7DFF"/><stop offset="52%" stop-color="#1C69FF"/><stop offset="100%" stop-color="#F0DCD6"/></linearGradient></defs><path d="M12 24A14.304 14.304 0 000 12 14.304 14.304 0 0012 0a14.305 14.305 0 0012 12 14.305 14.305 0 00-12 12" fill="url(#g1)"/></svg>`;

const CLAUDE_ICON = `<svg fill="#c96442" fill-rule="evenodd" width="13" height="13" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"/></svg>`;

const HF_ICON = `<span style="font-size:11px;line-height:1">🤗</span>`;

// ── Models per provider ───────────────────────────────────────────────────────

const MODELS = {
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini", icon: OPENAI_ICON },
    { id: "gpt-4o",      label: "GPT-4o",      icon: OPENAI_ICON },
    { id: "o3-mini",     label: "o3-mini",      icon: OPENAI_ICON },
  ],
  gemini: [
    { id: "gemini-2.0-flash",               label: "Gemini 2.0 Flash",  icon: GEMINI_ICON },
    { id: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash",  icon: GEMINI_ICON },
    { id: "gemini-1.5-pro",                 label: "Gemini 1.5 Pro",    icon: GEMINI_ICON },
  ],
  claude: [
    { id: "claude-3-5-haiku-20241022",  label: "Claude 3.5 Haiku",  icon: CLAUDE_ICON },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", icon: CLAUDE_ICON },
    { id: "claude-opus-4-5",            label: "Claude Opus 4.5",   icon: CLAUDE_ICON },
  ],
  huggingface: [
    { id: "meta-llama/Llama-3.1-8B-Instruct",   label: "Llama 3.1 8B",  icon: HF_ICON },
    { id: "meta-llama/Llama-3.1-70B-Instruct",  label: "Llama 3.1 70B", icon: HF_ICON },
    { id: "mistralai/Mistral-7B-Instruct-v0.2", label: "Mistral 7B",    icon: HF_ICON },
  ],
};

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const askBtn        = document.getElementById("ask");
  const input         = document.getElementById("query");
  const modelBtn      = document.getElementById("modelBtn");
  const modelBtnInner = document.getElementById("modelBtnInner");
  const modelIcon     = document.getElementById("modelIcon");
  const modelLabel    = document.getElementById("modelLabel");
  const modelDropdown = document.getElementById("modelDropdown");
  const modelSelector = document.getElementById("modelSelector");
  const settingsBtn   = document.getElementById("settingsBtn");
  const responseArea  = document.getElementById("responseArea");
  const thinkingRow   = document.getElementById("thinkingRow");
  const answerSection = document.getElementById("answerSection");
  const answerBody    = document.getElementById("answerBody");

  let selectedModel = null;
  let currentModels = [];

  // ── Load provider ──
  chrome.storage.local.get(["apiProvider"], (res) => {
    const provider = res.apiProvider || "huggingface";
    currentModels  = MODELS[provider] || MODELS.huggingface;
    selectedModel  = currentModels[0];
    renderModelBtn();
    renderDropdown();
  });

  settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());

  // ── State helpers ──────────────────────────────────────────────────────────

  function showThinking() {
    responseArea.classList.add("visible");
    thinkingRow.classList.add("visible");
    answerSection.classList.remove("visible");
    answerBody.className = "answer-body";
  }

  function showAnswer(text) {
    thinkingRow.classList.remove("visible");
    answerSection.classList.add("visible");
    answerBody.className = "answer-body";
    answerBody.innerText = text;
  }

  function showError(text) {
    thinkingRow.classList.remove("visible");
    answerSection.classList.add("visible");
    answerBody.className = "answer-body error";
    answerBody.innerText = text;
  }

  // ── Model rendering ───────────────────────────────────────────────────────

  function renderModelBtn() {
    modelIcon.innerHTML    = selectedModel.icon;
    modelLabel.textContent = selectedModel.label;
  }

  function renderDropdown() {
    modelDropdown.innerHTML = "";
    currentModels.forEach((m) => {
      const btn = document.createElement("button");
      btn.type      = "button";
      btn.className = "model-option" + (m.id === selectedModel.id ? " selected" : "");
      btn.innerHTML = `
        <span class="opt-left">
          <span class="model-icon">${m.icon}</span>
          <span>${m.label}</span>
        </span>
        <svg class="opt-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>`;
      btn.addEventListener("click", () => {
        selectedModel = m;
        modelBtnInner.classList.remove("switching");
        void modelBtnInner.offsetWidth;
        modelBtnInner.classList.add("switching");
        renderModelBtn();
        renderDropdown();
        closeDropdown();
      });
      modelDropdown.appendChild(btn);
    });
  }

  // ── Dropdown ──────────────────────────────────────────────────────────────

  function openDropdown()  { modelSelector.classList.add("open");    modelDropdown.classList.add("open"); }
  function closeDropdown() { modelSelector.classList.remove("open"); modelDropdown.classList.remove("open"); }

  modelBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    modelSelector.classList.contains("open") ? closeDropdown() : openDropdown();
  });
  modelDropdown.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", closeDropdown);

  // ── Textarea ──────────────────────────────────────────────────────────────

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 130) + "px";
    askBtn.disabled = !input.value.trim();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!askBtn.disabled) askBtn.click();
    }
  });

  // ── Send ──────────────────────────────────────────────────────────────────

  askBtn.addEventListener("click", async () => {
    const query = input.value.trim();
    if (!query) return;

    input.value = "";
    input.style.height = "auto";
    askBtn.disabled = true;

    showThinking();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      chrome.tabs.sendMessage(tab.id, { type: "GET_PAGE_DATA" }, (response) => {
        if (chrome.runtime.lastError) {
          showError("Content script not loaded on this page.");
          return;
        }
        if (!response?.chunks) {
          showError("Could not read page content.");
          return;
        }

        const payload = { query, chunks: response.chunks, model: selectedModel?.id };

        chrome.runtime.sendMessage({ type: "ASK_BACKEND", payload }, (res) => {
          if (chrome.runtime.lastError) {
            showError("Backend not reachable.");
            return;
          }
          if (res?.error) {
            showError(res.error + "\n\nOpen Settings (⚙) to set your API key.");
          } else {
            showAnswer(res.answer);
          }
        });
      });
    } catch (err) {
      showError("Unexpected error: " + err.message);
    }
  });
});
