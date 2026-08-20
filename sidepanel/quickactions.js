import { getStorage } from "./util.js";
import { iconHTML } from "./icons.js";
import { tidyTabs } from "./group.js";
import { loadDirectoryHandle, ensurePermission, writeFile } from "./screenshotFolder.js";

const buttons = {
  tidy: document.getElementById("qa-tidy"),
  collapse: document.getElementById("qa-collapse"),
  screenshot: document.getElementById("qa-screenshot"),
  pauseall: document.getElementById("qa-pauseall"),
  copyurls: document.getElementById("qa-copyurls"),
  freeze: document.getElementById("qa-freeze"),
};

const ACTIONS_KEY = "enabledQuickActions";

function flash(btn, iconName) {
  const original = btn.innerHTML;
  btn.innerHTML = iconHTML(iconName, 14);
  setTimeout(() => (btn.innerHTML = original), 900);
}

function flashError(btn, error) {
  console.error("Quick action failed:", error);
  const originalTooltip = btn.dataset.tooltip;
  btn.dataset.tooltip = `Failed: ${error?.message || error}`;
  flash(btn, "alert");
  setTimeout(() => (btn.dataset.tooltip = originalTooltip), 5000);
}

buttons.tidy.addEventListener("click", async () => {
  try {
    await tidyTabs();
    flash(buttons.tidy, "check");
  } catch (err) {
    flashError(buttons.tidy, err);
  }
});

buttons.collapse.addEventListener("click", async () => {
  const win = await chrome.windows.getCurrent();
  const groups = await chrome.tabGroups.query({ windowId: win.id });
  if (groups.length === 0) return;

  const anyExpanded = groups.some((g) => !g.collapsed);
  await Promise.all(groups.map((g) => chrome.tabGroups.update(g.id, { collapsed: anyExpanded })));
});

buttons.screenshot.addEventListener("click", async () => {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab) throw new Error("No active tab found");
    if (!/^https?:\/\//.test(activeTab.url || "")) {
      throw new Error("Can't capture this page (only http/https pages are supported)");
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "png" });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const { mode = "downloads", folder = "screenshots" } = await getStorage("screenshotSettings", {});

    if (mode === "custom") {
      const handle = await loadDirectoryHandle();
      if (!handle) throw new Error("No custom folder chosen yet — pick one in Settings");
      if (!(await ensurePermission(handle))) throw new Error("Permission to write to that folder was denied");

      const blob = await (await fetch(dataUrl)).blob();
      await writeFile(handle, `tab-${stamp}.png`, blob);
    } else {
      const downloadId = await chrome.downloads.download({
        url: dataUrl,
        filename: `${folder}/tab-${stamp}.png`,
      });
      if (!downloadId) throw new Error(chrome.runtime.lastError?.message || "Download did not start");
    }

    flash(buttons.screenshot, "check");
  } catch (err) {
    flashError(buttons.screenshot, err);
  }
});

buttons.pauseall.addEventListener("click", async () => {
  const tabs = await chrome.tabs.query({});
  const playing = tabs.filter((t) => t.audible);
  if (playing.length === 0) return;

  await Promise.all(
    playing.map((t) =>
      chrome.scripting
        .executeScript({
          target: { tabId: t.id },
          func: () => document.querySelectorAll("video, audio").forEach((m) => m.pause()),
        })
        .catch(() => {})
    )
  );
  flash(buttons.pauseall, "check");
});

buttons.copyurls.addEventListener("click", async () => {
  const tabs = await chrome.tabs.query({});
  const text = tabs.map((t) => t.url).filter(Boolean).join("\n");
  try {
    await navigator.clipboard.writeText(text);
    flash(buttons.copyurls, "check");
  } catch (err) {
    flashError(buttons.copyurls, err);
  }
});

buttons.freeze.addEventListener("click", async () => {
  try {
    const tabs = await chrome.tabs.query({});
    const candidates = tabs.filter((t) => !t.active && !t.pinned && !t.discarded && !t.audible);
    await Promise.all(candidates.map((t) => chrome.tabs.discard(t.id).catch(() => {})));
    flash(buttons.freeze, "check");
  } catch (err) {
    flashError(buttons.freeze, err);
  }
});

function applyVisibility(enabled) {
  for (const [id, btn] of Object.entries(buttons)) {
    btn.style.display = enabled[id] !== false ? "" : "none";
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[ACTIONS_KEY]) {
    applyVisibility(changes[ACTIONS_KEY].newValue || {});
  }
});

export async function init() {
  applyVisibility(await getStorage(ACTIONS_KEY, {}));
}
