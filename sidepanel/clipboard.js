import { el, relativeTime, getStorage, setStorage } from "./util.js";
import { iconEl } from "./icons.js";

const list = document.getElementById("clipboard-list");
const clearBtn = document.getElementById("clipboard-clear");

const STORAGE_KEY = "clipboardHistory";

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "";
  }
}

function render(entries) {
  list.innerHTML = "";

  if (!entries || entries.length === 0) {
    list.appendChild(el("li", "empty", "Nothing copied yet. Select text and copy (Cmd/Ctrl+C) anywhere and it'll show up here."));
    return;
  }

  entries.forEach((entry, index) => {
    const row = el("li", "row");
    const preview = entry.text.length > 140 ? `${entry.text.slice(0, 140)}…` : entry.text;
    row.title = entry.text;

    const main = el("div", "row-main");
    main.appendChild(el("div", "row-title", preview));
    main.appendChild(el("div", "row-sub", `${hostnameOf(entry.url)} · ${relativeTime(entry.ts)}`));
    row.appendChild(main);

    const removeBtn = el("button", "row-action");
    removeBtn.appendChild(iconEl("close", 14));
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const current = await getStorage(STORAGE_KEY, []);
      current.splice(index, 1);
      await setStorage(STORAGE_KEY, current);
    });
    row.appendChild(removeBtn);

    row.addEventListener("click", async () => {
      await navigator.clipboard.writeText(entry.text);
      const original = main.style.background;
      main.style.background = "var(--accent)";
      setTimeout(() => (main.style.background = original), 200);
    });

    list.appendChild(row);
  });
}

clearBtn.addEventListener("click", async () => {
  if (confirm("Clear all clipboard history?")) {
    await setStorage(STORAGE_KEY, []);
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    render(changes[STORAGE_KEY].newValue || []);
  }
});

export async function init() {
  render(await getStorage(STORAGE_KEY, []));
}
