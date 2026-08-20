import { el, faviconFor, getStorage, setStorage } from "./util.js";
import { iconEl } from "./icons.js";

const list = document.getElementById("pins-list");
const addBtn = document.getElementById("pins-add");

const STORAGE_KEY = "pins";
let pins = [];

function render() {
  list.innerHTML = "";

  if (pins.length === 0) {
    list.appendChild(el("li", "empty", "No pins yet. Pin the current tab to save it here."));
    return;
  }

  for (const pin of pins) {
    const row = el("li", "row");
    row.title = pin.url;

    const icon = el("img", "row-icon");
    icon.src = pin.favIconUrl || faviconFor(pin.url);
    icon.onerror = () => (icon.style.visibility = "hidden");

    const main = el("div", "row-main");
    main.appendChild(el("div", "row-title", pin.title || pin.url));
    main.appendChild(el("div", "row-sub", pin.url));

    row.appendChild(icon);
    row.appendChild(main);

    const removeBtn = el("button", "row-action");
    removeBtn.appendChild(iconEl("close", 14));
    removeBtn.title = "Remove pin";
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      pins = pins.filter((p) => p.id !== pin.id);
      await setStorage(STORAGE_KEY, pins);
      render();
    });
    row.appendChild(removeBtn);

    row.addEventListener("click", () => {
      chrome.tabs.create({ url: pin.url });
    });

    list.appendChild(row);
  }
}

export async function addCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return { ok: false, reason: "No active tab found" };

  const current = await getStorage(STORAGE_KEY, []);
  if (current.some((p) => p.url === tab.url)) return { ok: false, reason: "Already pinned" };

  current.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: tab.title || tab.url,
    url: tab.url,
    favIconUrl: tab.favIconUrl || "",
  });

  await setStorage(STORAGE_KEY, current);
  pins = current;
  render();
  return { ok: true };
}

addBtn.addEventListener("click", () => addCurrentTab());

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    pins = changes[STORAGE_KEY].newValue || [];
    render();
  }
});

export async function init() {
  pins = await getStorage(STORAGE_KEY, []);
  render();
}
