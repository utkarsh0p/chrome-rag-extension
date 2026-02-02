chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "ASK_BACKEND") {
    fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message.payload)
    })
      .then(res => res.json())
      .then(data => {
        sendResponse({ answer: data.answer });
      })
      .catch(err => {
        sendResponse({ error: err.message });
      });

    return true;
  }
});
