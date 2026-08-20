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
  chrome.runtime
    .sendMessage({ type: "clipboard-capture", text, url: location.href, title: document.title })
    .catch(() => {});
}

document.addEventListener("copy", handleCopy, true);
document.addEventListener("cut", handleCopy, true);
