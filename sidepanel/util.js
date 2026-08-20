export const PANEL_LABELS = {
  tabs: "Open Tabs",
  downloads: "Downloads",
  pins: "Pins",
  translate: "Translate",
  notes: "Notes",
  closed: "Recently Closed",
  clipboard: "Clipboard History",
  spotify: "Spotify",
};

export const QUICK_ACTION_LABELS = {
  pin: "Pin current tab",
  tidy: "Tidy tabs",
  collapse: "Collapse/expand groups",
  screenshot: "Screenshot current tab",
  pauseall: "Pause all playing media",
  copyurls: "Copy all tab URLs",
  freeze: "Freeze all background tabs",
};


export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function faviconFor(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function relativeTime(ms) {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export async function getStorage(key, fallback) {
  const result = await chrome.storage.local.get(key);
  return result[key] === undefined ? fallback : result[key];
}

export async function setStorage(key, value) {
  await chrome.storage.local.set({ [key]: value });
}
