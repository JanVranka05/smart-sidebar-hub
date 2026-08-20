import { el, faviconFor, getStorage } from "./util.js";

const box = document.getElementById("quickaccess-widget");
const WIDGETS_KEY = "enabledWidgets";

export const STORAGE_KEY = "quickAccess";
export const MAX_SLOTS = 2;

let enabled = true;
let lastItems = [];

async function openOrFocus(item) {
  const [existing] = await chrome.tabs.query({ url: item.url });
  if (existing) {
    await chrome.windows.update(existing.windowId, { focused: true });
    await chrome.tabs.update(existing.id, { active: true });
  } else {
    await chrome.tabs.create({ url: item.url });
  }
}

function render(rawItems = lastItems) {
  lastItems = rawItems;
  box.innerHTML = "";
  if (!enabled) return;

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
  if (area !== "local") return;
  if (changes[STORAGE_KEY]) render(changes[STORAGE_KEY].newValue || []);
  if (changes[WIDGETS_KEY]) {
    enabled = (changes[WIDGETS_KEY].newValue || {}).quickaccess !== false;
    render();
  }
});

export async function init() {
  enabled = ((await getStorage(WIDGETS_KEY, {})) || {}).quickaccess !== false;
  render(await getStorage(STORAGE_KEY, []));
}
