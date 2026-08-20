import { el, faviconFor, getStorage, formatDuration } from "./util.js";
import { iconEl } from "./icons.js";

const box = document.getElementById("nowplaying-widget");
const lastAudibleAt = new Map();
const WIDGETS_KEY = "enabledWidgets";
let enabled = true;
let progressEnabled = true;

let currentTabId = null;
let progressFillEl = null;
let progressTimeEl = null;
let statusPrefix = "";
let progressTimer = null;

async function focusTab(tab) {
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });
}

async function getMediaTime(tabId) {
  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const m = document.querySelector("video, audio");
        if (!m || !isFinite(m.duration) || m.duration <= 0) return null;
        return { currentTime: m.currentTime, duration: m.duration };
      },
    });
    return result;
  } catch {
    return null;
  }
}

async function togglePause(tab) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        document.querySelectorAll("video, audio").forEach((m) => {
          if (m.paused) m.play();
          else m.pause();
        });
      },
    });
  } catch {
    // Page not scriptable — nothing we can do.
  }
}

let progressInFlight = false;

async function updateProgress() {
  if (!progressEnabled || !currentTabId || !progressFillEl || progressInFlight) return;
  progressInFlight = true;
  const time = await getMediaTime(currentTabId).finally(() => (progressInFlight = false));
  if (!time) return;

  progressFillEl.style.width = `${Math.min(100, (time.currentTime / time.duration) * 100)}%`;
  if (progressTimeEl) {
    const timeText = `${formatDuration(time.currentTime * 1000)} / ${formatDuration(time.duration * 1000)}`;
    progressTimeEl.textContent = statusPrefix ? `${statusPrefix} · ${timeText}` : timeText;
  }
}

function renderRow(tab) {
  const row = el("div", "row");
  row.title = tab.url;

  const icon = el("img", "row-icon");
  icon.src = tab.favIconUrl || faviconFor(tab.url);
  icon.onerror = () => (icon.style.visibility = "hidden");

  const main = el("div", "row-main");
  main.appendChild(el("div", "row-title", tab.title || tab.url));

  let status = "Recently playing";
  if (tab.audible) status = tab.mutedInfo?.muted ? "Playing (muted)" : "Playing audio";
  statusPrefix = status;
  const statusEl = el("div", "row-sub", status);
  main.appendChild(statusEl);
  progressTimeEl = statusEl;

  row.appendChild(icon);
  row.appendChild(main);

  const pauseBtn = el("button", "row-action");
  pauseBtn.appendChild(iconEl("pause", 14));
  pauseBtn.title = "Play/pause media on this tab";
  pauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePause(tab);
  });
  row.appendChild(pauseBtn);

  const muteBtn = el("button", "row-action");
  muteBtn.appendChild(iconEl(tab.mutedInfo?.muted ? "mute" : "volume", 14));
  muteBtn.title = tab.mutedInfo?.muted ? "Unmute" : "Mute";
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chrome.tabs.update(tab.id, { muted: !tab.mutedInfo?.muted });
  });
  row.appendChild(muteBtn);

  row.addEventListener("click", () => focusTab(tab));

  return row;
}

async function render() {
  if (!enabled) {
    box.innerHTML = "";
    currentTabId = null;
    progressFillEl = null;
    progressTimeEl = null;
    return;
  }

  const tabs = await chrome.tabs.query({});
  const tabById = new Map(tabs.map((t) => [t.id, t]));

  for (const id of lastAudibleAt.keys()) {
    if (!tabById.has(id)) lastAudibleAt.delete(id);
  }

  const audibleNow = tabs.find((t) => t.audible);
  let latestTab = audibleNow;

  if (!latestTab && lastAudibleAt.size > 0) {
    const [mostRecentId] = [...lastAudibleAt.entries()].sort((a, b) => b[1] - a[1])[0];
    latestTab = tabById.get(mostRecentId);
  }

  box.innerHTML = "";
  currentTabId = null;
  progressFillEl = null;
  progressTimeEl = null;
  if (!latestTab) return;

  currentTabId = latestTab.id;
  box.appendChild(el("div", "now-playing-label", "Now playing"));
  box.appendChild(renderRow(latestTab));

  if (progressEnabled) {
    const progressTrack = el("div", "progress-track");
    const fill = el("div", "progress-fill");
    progressTrack.appendChild(fill);
    progressTrack.style.margin = "0 8px 4px";
    box.appendChild(progressTrack);
    progressFillEl = fill;
    updateProgress();
  }
}

chrome.tabs.onCreated.addListener(render);
chrome.tabs.onRemoved.addListener((tabId) => {
  lastAudibleAt.delete(tabId);
  render();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.audible === true) lastAudibleAt.set(tabId, Date.now());

  const relevant =
    changeInfo.audible !== undefined ||
    changeInfo.mutedInfo !== undefined ||
    (tabId === currentTabId && (changeInfo.title !== undefined || changeInfo.favIconUrl !== undefined));
  if (relevant) render();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[WIDGETS_KEY]) {
    const value = changes[WIDGETS_KEY].newValue || {};
    enabled = value.nowplaying !== false;
    progressEnabled = value.nowplayingProgress !== false;
    render();
  }
});

export async function init() {
  const widgets = (await getStorage(WIDGETS_KEY, {})) || {};
  enabled = widgets.nowplaying !== false;
  progressEnabled = widgets.nowplayingProgress !== false;
  render();
  if (!progressTimer) progressTimer = setInterval(updateProgress, 2000);
}
