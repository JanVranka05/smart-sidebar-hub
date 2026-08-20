const FRIENDLY_NAMES = {
  "mail.google.com": "Gmail",
  "drive.google.com": "Drive",
  "docs.google.com": "Docs",
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

export function friendlyName(hostname) {
  if (FRIENDLY_NAMES[hostname]) return FRIENDLY_NAMES[hostname];
  const label = hostname.split(".")[0];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function colorFor(key) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

// docs.google.com hosts Docs, Sheets, Slides, and Forms all under one hostname,
// distinguished only by URL path — so hostname alone isn't enough to group them apart.
const GOOGLE_DOCS_PATHS = [
  ["/spreadsheets", "Sheets"],
  ["/presentation", "Slides"],
  ["/forms", "Forms"],
  ["/document", "Docs"],
];

function siteKeyFor(url) {
  const u = new URL(url);
  const hostname = u.hostname.replace(/^www\./, "");

  if (hostname === "docs.google.com") {
    const match = GOOGLE_DOCS_PATHS.find(([prefix]) => u.pathname.startsWith(prefix));
    const label = match ? match[1] : "Docs";
    return { key: `${hostname}${match ? match[0] : ""}`, label };
  }

  return { key: hostname, label: friendlyName(hostname) };
}

export async function groupTabsBySite(windowId) {
  const win = windowId ? { id: windowId } : await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const existingGroups = await chrome.tabGroups.query({ windowId: win.id });
  const groupIdByTitle = new Map(existingGroups.map((g) => [g.title, g.id]));

  const buckets = new Map();
  for (const tab of tabs) {
    if (tab.pinned || !tab.url || !/^https?:\/\//.test(tab.url)) continue;
    let site;
    try {
      site = siteKeyFor(tab.url);
    } catch {
      continue;
    }
    if (!buckets.has(site.key)) buckets.set(site.key, { label: site.label, tabIds: [] });
    buckets.get(site.key).tabIds.push(tab.id);
  }

  for (const [key, { label, tabIds }] of buckets) {
    if (tabIds.length < 2) continue;
    const existingId = groupIdByTitle.get(label);
    if (existingId !== undefined) {
      await chrome.tabs.group({ tabIds, groupId: existingId });
    } else {
      const groupId = await chrome.tabs.group({ tabIds, createProperties: { windowId: win.id } });
      await chrome.tabGroups.update(groupId, { title: label, color: colorFor(key) });
      groupIdByTitle.set(label, groupId);
    }
  }
}

export async function ungroupAll(windowId) {
  const win = windowId ? { id: windowId } : await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const groupedIds = tabs.filter((t) => t.groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE).map((t) => t.id);
  if (groupedIds.length) await chrome.tabs.ungroup(groupedIds);
}

export async function tidyTabs(windowId) {
  await groupTabsBySite(windowId);
  const win = windowId ? { id: windowId } : await chrome.windows.getCurrent();
  const tabs = await chrome.tabs.query({ windowId: win.id });
  const ungroupedIds = tabs
    .filter((t) => !t.pinned && t.groupId === chrome.tabGroups.TAB_GROUP_ID_NONE)
    .map((t) => t.id);
  if (ungroupedIds.length) await chrome.tabs.move(ungroupedIds, { index: -1 });
}
