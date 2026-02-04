document.addEventListener("DOMContentLoaded", () => {
  const askBtn = document.getElementById("ask");
  const input = document.getElementById("query");
  const output = document.getElementById("chatBody"); // FIXED

  if (!askBtn || !input || !output) {
    console.error("Popup elements not found");
    return;
  }

  // Enter key support
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askBtn.click();
    }
  });

  askBtn.addEventListener("click", async () => {
    const query = input.value.trim();
    if (!query) return;

    // show user message
    const userMsg = document.createElement("div");
    userMsg.className = "message user-message";
    userMsg.innerText = query;
    output.appendChild(userMsg);

    input.value = "";

    // thinking message
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "message bot-message";
    thinkingMsg.innerText = "Thinking...";
    output.appendChild(thinkingMsg);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });

      chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_PAGE_DATA" },
        (response) => {
          if (chrome.runtime.lastError) {
            thinkingMsg.innerText = "Content script not loaded on this page.";
            return;
          }

          if (!response || !response.chunks) {
            thinkingMsg.innerText = "Could not read page content.";
            return;
          }

          const payload = {
            query: query,
            chunks: response.chunks
          };

          chrome.runtime.sendMessage(
            { type: "ASK_BACKEND", payload },
            (res) => {
              if (chrome.runtime.lastError) {
                thinkingMsg.innerText = "Backend not reachable.";
                return;
              }

              if (res?.error) {
                thinkingMsg.innerText = "Error: " + "hf_token not valid \n\nGENERATE TOKEN\nFollow link - https://huggingface.co\n1. Make your account\n2. Go to profile and select Access Token\n3. Select token type-Read (*imp*)\n\n\nRELOAD EXTENSION\n1. Go on url chrome://extensions\n2.Reload the extension\n3. Enter the hf_access_token";
              } else {
                thinkingMsg.innerText = res.answer;
              }
            }
          );
        }
      );
    } catch (err) {
      thinkingMsg.innerText = "Unexpected error: " + err.message;
    }
  });
});
