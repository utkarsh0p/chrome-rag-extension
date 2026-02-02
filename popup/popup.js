document.addEventListener("DOMContentLoaded", () => {
  const askBtn = document.getElementById("ask");
  const input = document.getElementById("query");
  const output = document.getElementById("answer");

  if (!askBtn || !input || !output) {
    console.error("Popup elements not found");
    return;
  }

  askBtn.addEventListener("click", async () => {
    const query = input.value.trim();

    if (!query) {
      output.innerText = "Please enter a question.";
      return;
    }

    output.innerText = "Thinking...";

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
            output.innerText = "Content script not loaded on this page.";
            return;
          }

          if (!response || !response.chunks) {
            output.innerText = "Could not read page content.";
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
                output.innerText = "Backend not reachable.";
                return;
              }

              if (res?.error) {
                output.innerText = "Error: " + res.error;
              } else {
                output.innerText = res.answer;
              }
            }
          );
        }
      );
    } catch (err) {
      output.innerText = "Unexpected error: " + err.message;
    }
  });
});
