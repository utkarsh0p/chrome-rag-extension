function chunkText(text, chunkSize = 500) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }

  return chunks;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_PAGE_DATA") {

    function getCleanedText() {
      const rawText = document.body.innerText;
      const cleanedText = rawText.replace(/[\n\t]+/g, ' ').trim();

      return cleanedText;
    }
    const pageText = getCleanedText() || "";
    const chunks = chunkText(pageText);

    sendResponse({ chunks });
  }
});
