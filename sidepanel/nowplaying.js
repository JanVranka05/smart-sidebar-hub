import { el, faviconFor } from "./util.js";

const box = document.getElementById("nowplaying-widget");
const lastAudibleAt = new Map();

async function focusTab(tab) {
  await chrome.windows.update(tab.windowId, { focused: true });
  await chrome.tabs.update(tab.id, { active: true });
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
  main.appendChild(el("div", "row-sub", status));

  row.appendChild(icon);
  row.appendChild(main);

  const pauseBtn = el("button", "row-action", "⏸️");
  pauseBtn.title = "Play/pause media on this tab";
  pauseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePause(tab);
  });
  row.appendChild(pauseBtn);

  const muteBtn = el("button", "row-action", tab.mutedInfo?.muted ? "🔇" : "🔊");
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
  if (!latestTab) return;

  box.appendChild(el("div", "now-playing-label", "Now playing"));
  box.appendChild(renderRow(latestTab));
}

chrome.tabs.onCreated.addListener(render);
chrome.tabs.onRemoved.addListener((tabId) => {
  lastAudibleAt.delete(tabId);
  render();
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.audible === true) lastAudibleAt.set(tabId, Date.now());
  render();
});

export function init() {
  render();
}
