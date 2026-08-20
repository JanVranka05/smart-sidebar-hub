function getCopiedText() {
  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "INPUT" || active.tagName === "TEXTAREA") &&
    typeof active.selectionStart === "number" &&
    active.selectionStart !== active.selectionEnd
  ) {
    return active.value.substring(active.selectionStart, active.selectionEnd);
  }
  return window.getSelection ? window.getSelection().toString() : "";
}

function handleCopy() {
  const text = getCopiedText().trim();
  if (!text) return;

  // chrome.runtime becomes unusable in this tab once the extension is reloaded
  // until the page itself is refreshed — fail silently rather than throwing.
  if (!chrome.runtime?.id) return;

  try {
    chrome.runtime
      .sendMessage({ type: "clipboard-capture", text, url: location.href, title: document.title })
      .catch(() => {});
  } catch {
    // Extension context invalidated mid-call — nothing to do until the tab reloads.
  }
}

document.addEventListener("copy", handleCopy, true);
document.addEventListener("cut", handleCopy, true);
