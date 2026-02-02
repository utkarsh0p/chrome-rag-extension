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
    const pageText = document.body.innerText || "";
    const chunks = chunkText(pageText);

    sendResponse({ chunks });
  }
});
