chrome.runtime.onInstalled.addListener(()=>{
  chrome.runtime.openOptionsPage()
})


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_BACKEND") {

    chrome.storage.local.get("hfToken", (res) => {
      if (!res.hfToken) {
        sendResponse({ error: "No access token provided" });
        return;
      }

      fetch("http://3.80.154.24:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Token": res.hfToken
        },
        body: JSON.stringify(message.payload)
      })
        .then(res => res.json())
        .then(data => sendResponse({ answer: data.answer }))
        .catch(err => sendResponse({ error: err.message }));
    });

    return true;
  }
});

