import { el, faviconFor, relativeTime, getStorage, debounce, PANEL_LABELS, QUICK_ACTION_LABELS } from "./util.js";
import { iconEl } from "./icons.js";
import { PANELS_KEY, ACTIONS_KEY } from "./settings.js";
import { STORAGE_KEY as QUICKACCESS_KEY } from "./quickaccess.js";
import { focusTab } from "./tabs.js";
import { activate as activatePanel } from "./main.js";

const input = document.getElementById("command-search-input");
const results = document.getElementById("command-search-results");

const PANEL_ICONS = {
  tabs: "tabs",
  downloads: "download",
  pins: "pin",
  translate: "translate",
  notes: "notes",
  closed: "history",
  clipboard: "clipboard",
  spotify: "music",
  settings: "settings",
};

const ACTION_ICONS = {
  pin: "pin",
  tidy: "tidy",
  collapse: "collapse",
  screenshot: "camera",
  pauseall: "pause",
  copyurls: "copy",
  freeze: "freeze",
};

let activeIndex = -1;

function hide() {
  results.classList.remove("open");
  results.innerHTML = "";
  activeIndex = -1;
}

function selectRow(row) {
  row.onSelect();
  input.value = "";
  hide();
  input.blur();
}

function makeRow(iconName, title, sub, faviconUrl, onSelect) {
  const row = el("li", "row");

  let icon;
  if (faviconUrl) {
    icon = el("img", "row-icon");
    icon.src = faviconUrl;
    icon.onerror = () => (icon.style.visibility = "hidden");
  } else {
    icon = iconEl(iconName || "file", 14);
    icon.classList.add("row-icon");
  }

  const main = el("div", "row-main");
  main.appendChild(el("div", "row-title", title));
  if (sub) main.appendChild(el("div", "row-sub", sub));

  row.appendChild(icon);
  row.appendChild(main);
  row.onSelect = onSelect;
  row.addEventListener("click", () => selectRow(row));

  return row;
}

function appendGroup(title, rows) {
  if (rows.length === 0) return;
  results.appendChild(el("li", "group-header", title));
  for (const row of rows) results.appendChild(row);
}

async function search(query) {
  const q = query.toLowerCase();

  const [
    enabledPanels,
    enabledActions,
    allTabs,
    downloadItems,
    pins,
    quickAccess,
    closedSessions,
    clipboardHistory,
    notes,
  ] = await Promise.all([
    getStorage(PANELS_KEY, {}),
    getStorage(ACTIONS_KEY, {}),
    chrome.tabs.query({}),
    chrome.downloads.search({ query: [query], limit: 8 }),
    getStorage("pins", []),
    getStorage(QUICKACCESS_KEY, []),
    chrome.sessions.getRecentlyClosed({ maxResults: 25 }),
    getStorage("clipboardHistory", []),
    getStorage("notes", ""),
  ]);

  results.innerHTML = "";

  const panelRows = Object.entries(PANEL_LABELS)
    .concat([["settings", "Settings"]])
    .filter(([id, label]) => enabledPanels[id] !== false && label.toLowerCase().includes(q))
    .map(([id, label]) => makeRow(PANEL_ICONS[id], `Go to ${label}`, null, null, () => activatePanel(id)));

  const actionRows = Object.entries(QUICK_ACTION_LABELS)
    .filter(([id, label]) => enabledActions[id] !== false && label.toLowerCase().includes(q))
    .map(([id, label]) => makeRow(ACTION_ICONS[id], label, null, null, () => document.getElementById(`qa-${id}`)?.click()));

  const tabRows = allTabs
    .filter((t) => (t.title || "").toLowerCase().includes(q) || (t.url || "").toLowerCase().includes(q))
    .slice(0, 8)
    .map((t) =>
      makeRow(null, t.title || t.url, t.url, t.favIconUrl || faviconFor(t.url), () => focusTab(t))
    );

  const downloadRows = downloadItems.slice(0, 8).map((d) =>
    makeRow("file", (d.filename || d.url || "").split(/[\\/]/).pop(), d.filename, null, () => {
      if (d.state === "complete") chrome.downloads.open(d.id);
      else chrome.downloads.show(d.id);
    })
  );

  const pinRows = pins
    .filter((p) => (p.title || "").toLowerCase().includes(q) || (p.url || "").toLowerCase().includes(q))
    .slice(0, 8)
    .map((p) => makeRow(null, p.title || p.url, p.url, p.favIconUrl || faviconFor(p.url), () => chrome.tabs.create({ url: p.url })));

  const quickAccessRows = (quickAccess || [])
    .filter((item) => item && ((item.title || "").toLowerCase().includes(q) || (item.url || "").toLowerCase().includes(q)))
    .map((item) => makeRow(null, item.title || item.url, item.url, item.favIconUrl || faviconFor(item.url), () => chrome.tabs.create({ url: item.url })));

  const closedRows = closedSessions
    .filter((s) => {
      const entry = s.tab || s.window;
      const title = s.window ? "Window" : entry?.title || entry?.url || "";
      const url = s.window ? s.window.tabs?.[0]?.url ?? "" : entry?.url || "";
      return title.toLowerCase().includes(q) || url.toLowerCase().includes(q);
    })
    .slice(0, 8)
    .map((s) => {
      const isWindow = !!s.window;
      const entry = s.tab || s.window;
      const title = isWindow ? `Window (${s.window.tabs?.length ?? 0} tabs)` : entry.title || entry.url;
      const url = isWindow ? s.window.tabs?.[0]?.url ?? "" : entry.url;
      return makeRow(isWindow ? "tabs" : null, title, url, isWindow ? null : faviconFor(url), () => {
        chrome.sessions.restore(isWindow ? s.window.sessionId : s.tab.sessionId);
      });
    });

  const clipboardRows = clipboardHistory
    .filter((c) => c.text.toLowerCase().includes(q))
    .slice(0, 8)
    .map((c) =>
      makeRow(
        "clipboard",
        c.text.length > 80 ? `${c.text.slice(0, 80)}…` : c.text,
        relativeTime(c.ts),
        null,
        () => navigator.clipboard.writeText(c.text)
      )
    );

  const notesRows = notes.toLowerCase().includes(q)
    ? [makeRow("notes", "Open Notes", notes.length > 80 ? `${notes.slice(0, 80)}…` : notes, null, () => activatePanel("notes"))]
    : [];

  appendGroup("Go to", panelRows);
  appendGroup("Quick actions", actionRows);
  appendGroup("Open Tabs", tabRows);
  appendGroup("Downloads", downloadRows);
  appendGroup("Pins", pinRows);
  appendGroup("Quick Access", quickAccessRows);
  appendGroup("Recently Closed", closedRows);
  appendGroup("Clipboard", clipboardRows);
  appendGroup("Notes", notesRows);

  if (!results.children.length) {
    results.appendChild(el("li", "empty", "No matches."));
  }

  activeIndex = -1;
  results.classList.add("open");
}

const onInput = debounce(() => {
  const q = input.value.trim();
  if (!q) {
    hide();
    return;
  }
  search(q);
}, 120);

input.addEventListener("input", onInput);

input.addEventListener("focus", () => {
  if (input.value.trim()) results.classList.add("open");
});

input.addEventListener("blur", () => {
  setTimeout(hide, 150);
});

input.addEventListener("keydown", (e) => {
  const rows = [...results.querySelectorAll("li.row")];
  if (rows.length === 0) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, rows.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    selectRow(rows[activeIndex === -1 ? 0 : activeIndex]);
    return;
  } else {
    return;
  }

  rows.forEach((row, i) => row.classList.toggle("active", i === activeIndex));
  rows[activeIndex]?.scrollIntoView({ block: "nearest" });
});

document.addEventListener("keydown", (e) => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === "k") {
    e.preventDefault();
    input.focus();
    input.select();
  } else if (e.key === "Escape" && document.activeElement === input) {
    input.value = "";
    hide();
    input.blur();
  }
});

export function init() {}
