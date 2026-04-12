function chunkText(text, chunkSize = 500) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize;
  }
  return chunks;
}

// ── Inject code into Monaco Editor (LeetCode) ────────────────────────────────

function injectIntoMonaco(code) {
  // Strategy 1: Monaco global API
  try {
    if (window.monaco && window.monaco.editor) {
      const models = window.monaco.editor.getModels();
      if (models.length > 0) {
        models[0].setValue(code);
        return { ok: true, strategy: 'monaco-api' };
      }
    }
  } catch (_) {}

  // Strategy 2: execCommand via hidden textarea Monaco uses internally
  try {
    const textarea = document.querySelector('.monaco-editor textarea');
    if (textarea) {
      textarea.focus();
      document.execCommand('selectAll');
      const success = document.execCommand('insertText', false, code);
      if (success) return { ok: true, strategy: 'execCommand' };
    }
  } catch (_) {}

  // Strategy 3: Walk React fiber tree to find editor.setValue
  try {
    const editorEl = document.querySelector('.monaco-editor');
    if (editorEl) {
      const fiberKey = Object.keys(editorEl).find(k =>
        k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
      );
      if (fiberKey) {
        let fiber = editorEl[fiberKey];
        let depth = 0;
        while (fiber && depth < 200) {
          const si = fiber.stateNode;
          if (si && si.editor && typeof si.editor.setValue === 'function') {
            si.editor.setValue(code);
            return { ok: true, strategy: 'react-fiber' };
          }
          fiber = fiber.return;
          depth++;
        }
      }
    }
  } catch (_) {}

  return { ok: false, error: 'Could not find Monaco editor on this page.' };
}

// ── Scrape LeetCode problem ───────────────────────────────────────────────────

function getLeetCodeData() {
  const titleEl   = document.querySelector('[data-cy="question-title"], .text-title-large a, h1');
  const title     = titleEl ? titleEl.textContent.trim() : document.title.trim();

  const descEl    = document.querySelector('[data-track-load="description_content"], .elfjS, .question-content__JfgR');
  const description = descEl ? descEl.innerText.trim() : '';

  const langBtn   = document.querySelector('button[data-cy="lang-btn"], .ant-select-selection-item');
  const language  = langBtn ? langBtn.textContent.trim() : 'Python3';

  // Current code in editor (gives LLM the function signature to fill in)
  let currentCode = '';
  try {
    if (window.monaco && window.monaco.editor) {
      const models = window.monaco.editor.getModels();
      if (models.length > 0) currentCode = models[0].getValue();
    }
  } catch (_) {}
  if (!currentCode) {
    const ta = document.querySelector('.monaco-editor textarea');
    currentCode = ta ? ta.value : '';
  }

  return { title, description, language, currentCode };
}

// ── Message listener ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

  if (message.type === 'GET_PAGE_DATA') {
    const rawText     = document.body.innerText;
    const cleanedText = rawText.replace(/[\n\t]+/g, ' ').trim();
    sendResponse({ chunks: chunkText(cleanedText || '') });
  }

  if (message.type === 'GET_LEETCODE_DATA') {
    sendResponse(getLeetCodeData());
  }

  if (message.type === 'INJECT_CODE') {
    sendResponse(injectIntoMonaco(message.code));
  }

  if (message.type === 'GET_YOUTUBE_DATA') {
    const video       = document.querySelector('video');
    const currentTime = video ? Math.floor(video.currentTime) : 0;
    const videoId     = new URLSearchParams(window.location.search).get('v') || '';
    const titleEl     = document.querySelector(
      'h1.ytd-video-primary-info-renderer yt-formatted-string, #title h1 yt-formatted-string, #above-the-fold h1 yt-formatted-string'
    );
    const title = titleEl ? titleEl.textContent.trim() : document.title.replace(' - YouTube', '').trim();
    sendResponse({ videoId, currentTime, title });
  }

  return true;
});
