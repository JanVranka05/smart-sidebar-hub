import { el, faviconFor, debounce } from "./util.js";
import { iconEl } from "./icons.js";
import { groupTabsBySite, ungroupAll } from "./group.js";

const list = document.getElementById("tabs-list");
const search = document.getElementById("tabs-search");
const groupBtn = document.getElementById("tabs-group");
const ungroupBtn = document.getElementById("tabs-ungroup");

const COLOR_HEX = {
  grey: "#5f6368",
  blue: "#1a73e8",
  red: "#d93025",
  yellow: "#f9ab00",
  green: "#188038",
  pink: "#d01884",
  purple: "#a142f4",
  cyan: "#007b83",
  orange: "#fa903e",
};

let allTabs = [];
let allGroups = [];
let query = "";

function matches(tab) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (tab.title || "").toLowerCase().includes(q) || (tab.url || "").toLowerCase().includes(q);
}

async function focusTab(tab) {
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });
}

function renderGroupHeader(group) {
  const header = el("li", "group-header");
  const dot = el("span", "group-dot");
  dot.style.background = COLOR_HEX[group.color] || "#888";
  header.appendChild(dot);
  header.appendChild(el("span", null, group.title || "(untitled group)"));
  return header;
}

function renderPinnedHeader() {
  const header = el("li", "group-header");
  header.appendChild(iconEl("pin", 12));
  header.appendChild(el("span", null, "Pinned"));
  return header;
}

function renderTabRow(tab, indented) {
  const row = el("li", "row");
  if (indented) row.classList.add("row-indent");
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

  if (tab.audible || tab.mutedInfo?.muted) {
    const indicator = iconEl(tab.mutedInfo?.muted ? "mute" : "volume", 13);
    indicator.classList.add("row-action");
    row.appendChild(indicator);
  }

  row.addEventListener("click", () => focusTab(tab));
  return row;
}

function render() {
  list.innerHTML = "";
  const groupsById = new Map(allGroups.map((g) => [g.id, g]));
  const filtered = allTabs.filter(matches).sort((a, b) => a.index - b.index);

  if (filtered.length === 0) {
    list.appendChild(el("li", "empty", query ? "No matching tabs." : "No open tabs."));
    return;
  }

  let lastGroupId;
  let pinnedHeaderShown = false;
  for (const tab of filtered) {
    if (tab.pinned) {
      if (!pinnedHeaderShown) {
        list.appendChild(renderPinnedHeader());
        pinnedHeaderShown = true;
      }
      list.appendChild(renderTabRow(tab, true));
      continue;
    }

    if (tab.groupId !== lastGroupId) {
      lastGroupId = tab.groupId;
      const group = groupsById.get(tab.groupId);
      if (group) list.appendChild(renderGroupHeader(group));
    }
    list.appendChild(renderTabRow(tab, tab.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE));
  }
}

async function refresh() {
  const win = await chrome.windows.getCurrent();
  [allTabs, allGroups] = await Promise.all([
    chrome.tabs.query({ windowId: win.id }),
    chrome.tabGroups.query({ windowId: win.id }),
  ]);
  render();
}

search.addEventListener(
  "input",
  debounce(() => {
    query = search.value.trim();
    render();
  }, 120)
);

groupBtn.addEventListener("click", async () => {
  await groupTabsBySite();
  refresh();
});

ungroupBtn.addEventListener("click", async () => {
  await ungroupAll();
  refresh();
});

chrome.tabs.onCreated.addListener(refresh);
chrome.tabs.onRemoved.addListener(refresh);
chrome.tabs.onUpdated.addListener(refresh);
chrome.tabs.onActivated.addListener(refresh);
chrome.tabs.onMoved.addListener(refresh);
chrome.tabGroups.onCreated.addListener(refresh);
chrome.tabGroups.onUpdated.addListener(refresh);
chrome.tabGroups.onRemoved.addListener(refresh);

export function init() {
  refresh();
}
