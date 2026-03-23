const PROVIDERS = ['claude', 'gemini', 'openai', 'huggingface'];

// Load saved status — never pre-fill keys, just show "Saved" badge
chrome.storage.local.get(['apiKeys', 'apiProvider', 'apiKey', 'hfToken'], (res) => {
  const apiKeys = res.apiKeys || {};

  // Migrate legacy single-key storage into apiKeys
  if (res.apiProvider && res.apiKey && !apiKeys[res.apiProvider]) {
    apiKeys[res.apiProvider] = res.apiKey;
  }
  if (res.hfToken && !apiKeys.huggingface) {
    apiKeys.huggingface = res.hfToken;
  }

  // If migration happened, persist merged keys
  if (res.apiProvider || res.hfToken) {
    chrome.storage.local.set({ apiKeys });
  }

  // Show saved badges for providers that have a key
  PROVIDERS.forEach(p => {
    if (apiKeys[p]) showBadge(p);
  });
});

// Eye toggle
document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.for);
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.querySelector('.eye-open').style.display  = isPassword ? 'none'  : '';
    btn.querySelector('.eye-closed').style.display = isPassword ? ''     : 'none';
  });
});

// Save
document.getElementById('saveBtn').addEventListener('click', () => {
  const newKeys = {};
  PROVIDERS.forEach(p => {
    const val = document.getElementById(`key-${p}`).value.trim();
    if (val) newKeys[p] = val;
  });

  if (Object.keys(newKeys).length === 0) {
    setStatus('Enter at least one API key to save.', true);
    return;
  }

  const btn = document.getElementById('saveBtn');
  btn.disabled    = true;
  btn.textContent = 'Saving…';

  chrome.storage.local.get(['apiKeys'], (res) => {
    const merged = { ...(res.apiKeys || {}), ...newKeys };
    chrome.storage.local.set({ apiKeys: merged }, () => {
      // Show saved badges for newly saved providers
      Object.keys(newKeys).forEach(p => showBadge(p));
      setStatus('Saved!', false);
      setTimeout(() => window.close(), 800);
    });
  });
});

function showBadge(provider) {
  const badge = document.getElementById(`badge-${provider}`);
  if (badge) badge.classList.add('visible');
}

function setStatus(msg, isError) {
  const el  = document.getElementById('statusMsg');
  const btn = document.getElementById('saveBtn');
  el.textContent = msg;
  el.className   = 'status-msg ' + (isError ? 'error' : 'success');
  if (isError) {
    btn.disabled    = false;
    btn.textContent = 'Save Keys';
  }
}
