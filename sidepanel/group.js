import { el } from "./util.js";

const list = document.getElementById("group-list");
const runBtn = document.getElementById("group-run");
const undoBtn = document.getElementById("group-undo");

const FRIENDLY_NAMES = {
  "mail.google.com": "Gmail",
  "drive.google.com": "Drive",
  "docs.google.com": "Docs",
  "sheets.google.com": "Sheets",
  "slides.google.com": "Slides",
  "calendar.google.com": "Calendar",
  "meet.google.com": "Meet",
  "photos.google.com": "Photos",
  "youtube.com": "YouTube",
  "github.com": "GitHub",
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "claude.ai": "Claude",
  "twitter.com": "Twitter",
  "x.com": "X",
  "reddit.com": "Reddit",
  "linkedin.com": "LinkedIn",
  "amazon.com": "Amazon",
  "notion.so": "Notion",
  "figma.com": "Figma",
  "stackoverflow.com": "Stack Overflow",
};

const COLORS = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
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

function friendlyName(hostname) {
  if (FRIENDLY_NAMES[hostname]) return FRIENDLY_NAMES[hostname];
  const label = hostname.split(".")[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function colorFor(hostname) {
  let hash = 0;
  for (let i = 0; i < hostname.length; i++) hash = (hash * 31 + hostname.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

async function groupTabsBySite() {
  const win = await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const existingGroups = await chrome.tabGroups.query({ windowId: win.id });
  const groupIdByTitle = new Map(existingGroups.map((g) => [g.title, g.id]));

  const buckets = new Map();
  for (const tab of tabs) {
    if (tab.pinned || !tab.url || !/^https?:\/\//.test(tab.url)) continue;
    let hostname;
    try {
      hostname = new URL(tab.url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
    if (!buckets.has(hostname)) buckets.set(hostname, []);
    buckets.get(hostname).push(tab.id);
  }

  for (const [hostname, tabIds] of buckets) {
    if (tabIds.length < 2) continue;
    const title = friendlyName(hostname);
    const existingId = groupIdByTitle.get(title);
    if (existingId !== undefined) {
      await chrome.tabs.group({ tabIds, groupId: existingId });
    } else {
      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: win.id } });
      await chrome.tabGroups.update(groupId, { title, color: colorFor(hostname) });
      groupIdByTitle.set(title, groupId);
    }
  }

  await render();
}

async function ungroupAll() {
  const win = await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const groupedIds = tabs.filter((t) => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).map((t) => t.id);
  if (groupedIds.length) await chrome.tabs.ungroup(groupedIds);
  await render();
}

async function render() {
  const win = await chrome.windows.getCurrent();
  const [groups, tabs] = await Promise.all([
    chrome.tabGroups.query({ windowId: win.id }),
    chrome.tabs.query({ windowId: win.id }),
  ]);

  list.innerHTML = "";

  if (groups.length === 0) {
    list.appendChild(el("li", "empty", 'No tab groups yet. Click "Group tabs by site" to organize your open tabs.'));
    return;
  }

  for (const group of groups) {
    const count = tabs.filter((t) => t.groupId === group.id).length;
    const row = el("li", "row");

    const swatch = el("span", "row-icon");
    swatch.style.background = COLOR_HEX[group.color] || "#888";
    swatch.style.borderRadius = "50%";

    const main = el("div", "row-main");
    main.appendChild(el("div", "row-title", group.title || "(untitled)"));
    main.appendChild(el("div", "row-sub", `${count} tab${count === 1 ? "" : "s"}${group.collapsed ? " · collapsed" : ""}`));

    row.appendChild(swatch);
    row.appendChild(main);

    row.addEventListener("click", () => {
      chrome.tabGroups.update(group.id, { collapsed: !group.collapsed });
    });

    list.appendChild(row);
  }
}

runBtn.addEventListener("click", groupTabsBySite);
undoBtn.addEventListener("click", ungroupAll);

chrome.tabGroups.onCreated.addListener(render);
chrome.tabGroups.onUpdated.addListener(render);
chrome.tabGroups.onRemoved.addListener(render);
chrome.tabs.onRemoved.addListener(render);

export function init() {
  render();
}
