chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_BACKEND") {
    const provider = message.payload.provider || 'huggingface';

    chrome.storage.local.get(['apiKeys', 'apiProvider', 'apiKey', 'hfToken'], (res) => {
      const apiKeys = res.apiKeys || {};
      let key = apiKeys[provider];

      // Legacy fallback: old single-key storage
      if (!key && res.apiProvider === provider) {
        key = res.apiKey || res.hfToken;
      }
      if (!key && provider === 'huggingface' && res.hfToken) {
        key = res.hfToken;
      }

      if (!key) {
        sendResponse({ error: `No API key for ${provider}. Open Settings (⚙) to add one.` });
        return;
      }

      fetch("https://chrome-rag-extension.onrender.com/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Token":    key,
          "Provider": provider
        },
        body: JSON.stringify(message.payload)
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) sendResponse({ error: data.error });
          else            sendResponse({ answer: data.answer });
        })
        .catch(err => sendResponse({ error: "Could not reach backend: " + err.message }));
    });

    return true;
  }
});
