chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
});

const MAX_CLIPBOARD_ENTRIES = 30;
const MAX_TEXT_LENGTH = 4000;

async function addClipboardEntry({ text, url, title }) {
  const trimmed = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) : text;
  const { clipboardHistory = [] } = await chrome.storage.local.get("clipboardHistory");
  if (clipboardHistory[0]?.text === trimmed) return;

  const entry = { text: trimmed, url, title, ts: Date.now() };
  const next = [entry, ...clipboardHistory].slice(0, MAX_CLIPBOARD_ENTRIES);
  await chrome.storage.local.set({ clipboardHistory: next });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "clipboard-capture") {
    addClipboardEntry(message);
  }
});
