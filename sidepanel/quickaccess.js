import { el, faviconFor, getStorage } from "./util.js";

const box = document.getElementById("quickaccess-widget");

export const STORAGE_KEY = "quickAccess";
export const MAX_SLOTS = 2;

async function openOrFocus(item) {
  const [existing] = await chrome.tabs.query({ url: item.url });
  if (existing) {
    await chrome.windows.update(existing.windowId, { focused: true });
    await chrome.tabs.update(existing.id, { active: true });
  } else {
    await chrome.tabs.create({ url: item.url });
  }
}

function render(rawItems) {
  box.innerHTML = "";
  const items = (rawItems || []).filter(Boolean);
  if (items.length === 0) return;

  for (const item of items) {
    const chip = el("button", "quickaccess-chip");
    chip.title = item.url;

    const icon = el("img");
    icon.src = item.favIconUrl || faviconFor(item.url);
    icon.onerror = () => (icon.style.visibility = "hidden");

    chip.appendChild(icon);
    chip.appendChild(el("span", null, item.title || item.url));
    chip.addEventListener("click", () => openOrFocus(item));

    box.appendChild(chip);
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue || []);
  }
});

export async function init() {
  render(await getStorage(STORAGE_KEY, []));
}
