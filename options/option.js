const HINTS = {
  claude:       'Get your key at <a href="https://console.anthropic.com/" target="_blank">console.anthropic.com</a> — starts with <code>sk-ant-</code>',
  gemini:       'Get your key at <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com</a> — starts with <code>AIza</code>',
  openai:       'Get your key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com</a> — starts with <code>sk-</code>',
  huggingface:  'Get your token at <a href="https://huggingface.co/settings/tokens" target="_blank">huggingface.co/settings/tokens</a> — starts with <code>hf_</code>',
};

const LABELS = {
  claude:      'Anthropic API Key',
  gemini:      'Google AI API Key',
  openai:      'OpenAI API Key',
  huggingface: 'HuggingFace Token',
};

let selectedProvider = null;

const cards     = document.querySelectorAll('.provider-card');
const keyLabel  = document.getElementById('keyLabel');
const apiKeyEl  = document.getElementById('apiKey');
const keyHint   = document.getElementById('keyHint');
const saveBtn   = document.getElementById('saveBtn');
const status    = document.getElementById('status');
const toggleBtn = document.getElementById('toggleBtn');
const eyeOpen   = document.getElementById('eyeOpen');
const eyeClosed = document.getElementById('eyeClosed');

// Restore previously selected provider (but never pre-fill the key)
chrome.storage.local.get(['apiProvider'], (res) => {
  if (res.apiProvider) selectProvider(res.apiProvider);
});

function selectProvider(provider) {
  selectedProvider = provider;
  cards.forEach(c => c.classList.toggle('selected', c.dataset.provider === provider));
  keyLabel.textContent = LABELS[provider];
  keyHint.innerHTML    = HINTS[provider];
  apiKeyEl.focus();
}

cards.forEach(card => {
  card.addEventListener('click', () => selectProvider(card.dataset.provider));
});

// Toggle key visibility
toggleBtn.addEventListener('click', () => {
  const isPassword = apiKeyEl.type === 'password';
  apiKeyEl.type           = isPassword ? 'text'  : 'password';
  eyeOpen.style.display   = isPassword ? 'none'  : 'block';
  eyeClosed.style.display = isPassword ? 'block' : 'none';
});

saveBtn.addEventListener('click', () => {
  if (!selectedProvider) {
    showStatus('Please select a provider first.', true);
    return;
  }
  const key = apiKeyEl.value.trim();
  if (!key) {
    showStatus('Please enter your API key.', true);
    return;
  }

  saveBtn.disabled    = true;
  saveBtn.textContent = 'Saving…';

  chrome.storage.local.set({ apiProvider: selectedProvider, apiKey: key }, () => {
    showStatus('Saved! Closing…', false);
    setTimeout(() => window.close(), 800);
  });
});

function showStatus(msg, isError) {
  status.textContent = msg;
  status.className   = isError ? 'error' : '';
  if (isError) {
    saveBtn.disabled    = false;
    saveBtn.textContent = 'Save & Start Chatting';
  }
}
