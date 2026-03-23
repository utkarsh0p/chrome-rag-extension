chrome.runtime.onInstalled.addListener(() => {
  chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_BACKEND") {

    chrome.storage.local.get(['apiProvider', 'apiKey', 'hfToken'], (res) => {
      // Support legacy hfToken storage
      const provider = res.apiProvider || 'huggingface';
      const key      = res.apiKey || res.hfToken;

      if (!key) {
        sendResponse({ error: "No API key found. Please open extension options and add your key." });
        return;
      }

      fetch("http://3.80.154.24:5000/chat", {
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
