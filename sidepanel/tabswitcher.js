import { el, faviconFor, debounce } from "./util.js";

const list = document.getElementById("tabswitcher-list");
const search = document.getElementById("tabswitcher-search");

let tabs = [];
let query = "";

function matches(tab) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (tab.title || "").toLowerCase().includes(q) || (tab.url || "").toLowerCase().includes(q);
}

function render() {
  list.innerHTML = "";
  const filtered = tabs.filter(matches);

  if (filtered.length === 0) {
    list.appendChild(el("li", "empty", query ? "No matching tabs." : "No open tabs."));
    return;
  }

  for (const tab of filtered) {
    const row = el("li", "row");
    row.title = tab.url;
    if (tab.active) row.style.fontWeight = "600";

    const icon = el("img", "row-icon");
    icon.src = tab.favIconUrl || faviconFor(tab.url);
    icon.onerror = () => (icon.style.visibility = "hidden");

    const main = el("div", "row-main");
    main.appendChild(el("div", "row-title", tab.title || tab.url));
    main.appendChild(el("div", "row-sub", tab.url));

    row.appendChild(icon);
    row.appendChild(main);

    row.addEventListener("click", async () => {
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(tab.id, { active: true });
    });

    list.appendChild(row);
  }
}

async function refresh() {
  tabs = await chrome.tabs.query({});
  render();
}

search.addEventListener(
  "input",
  debounce(() => {
    query = search.value.trim();
    render();
  }, 120)
);

chrome.tabs.onCreated.addListener(refresh);
chrome.tabs.onRemoved.addListener(refresh);
chrome.tabs.onUpdated.addListener(refresh);
chrome.tabs.onActivated.addListener(refresh);

export function init() {
  refresh();
}
