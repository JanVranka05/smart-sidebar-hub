import { el, PANEL_LABELS, QUICK_ACTION_LABELS, faviconFor, getStorage, setStorage } from "./util.js";
import { iconEl, iconHTML } from "./icons.js";
import { STORAGE_KEY as QUICKACCESS_KEY, MAX_SLOTS } from "./quickaccess.js";
import { chooseDirectory, loadDirectoryHandle } from "./screenshotFolder.js";
import { CLIENT_ID_KEY, getRedirectUri, isConnected, connect, disconnect } from "./spotifyAuth.js";
import { refreshSpotifyPanel } from "./spotify.js";

const sectionsList = document.getElementById("settings-sections");
const actionsList = document.getElementById("settings-actions");
const widgetsList = document.getElementById("settings-widgets");
const quickAccessList = document.getElementById("settings-quickaccess");
const appearanceBtn = document.getElementById("settings-appearance");
const versionLabel = document.getElementById("settings-version");
const screenshotModeSelect = document.getElementById("settings-screenshot-mode");
const screenshotFolderInput = document.getElementById("settings-screenshot-folder");
const screenshotDownloadsOpts = document.getElementById("settings-screenshot-downloads-opts");
const screenshotCustomOpts = document.getElementById("settings-screenshot-custom-opts");
const screenshotChooseBtn = document.getElementById("settings-screenshot-choose");
const screenshotCustomLabel = document.getElementById("settings-screenshot-custom-label");
const spotifyRedirectCopyBtn = document.getElementById("spotify-redirect-copy");
const spotifyClientIdInput = document.getElementById("settings-spotify-clientid");
const spotifyConnectBtn = document.getElementById("settings-spotify-connect");
const spotifyStatusLabel = document.getElementById("settings-spotify-status");

export const PANELS_KEY = "enabledPanels";
export const ACTIONS_KEY = "enabledQuickActions";
export const WIDGETS_KEY = "enabledWidgets";
export const SCREENSHOT_KEY = "screenshotSettings";

function makeToggleRow(storageKey, id, label, checked, indent) {
  const row = el("li", indent ? "toggle-row toggle-row-indent" : "toggle-row");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  checkbox.id = `toggle-${storageKey}-${id}`;
  checkbox.addEventListener("change", async () => {
    const current = await getStorage(storageKey, {});
    current[id] = checkbox.checked;
    await setStorage(storageKey, current);
  });

  const labelEl = document.createElement("label");
  labelEl.htmlFor = checkbox.id;
  labelEl.textContent = label;

  row.appendChild(checkbox);
  row.appendChild(labelEl);
  return row;
}

function renderToggleList(container, labels, storageKey) {
  container.innerHTML = "";
  getStorage(storageKey, {}).then((enabled) => {
    for (const [id, label] of Object.entries(labels)) {
      container.appendChild(makeToggleRow(storageKey, id, label, enabled[id] !== false, false));
    }
  });
}

const WIDGET_TREE = [
  {
    id: "nowplaying",
    label: "Now Playing widget",
    children: [{ id: "nowplayingProgress", label: "Show progress bar (can cause lag)" }],
  },
  { id: "spotify", label: "Spotify widget" },
  { id: "quickaccess", label: "Quick Access chips" },
];

async function renderWidgetsList() {
  widgetsList.innerHTML = "";
  const enabled = await getStorage(WIDGETS_KEY, {});

  for (const item of WIDGET_TREE) {
    widgetsList.appendChild(makeToggleRow(WIDGETS_KEY, item.id, item.label, enabled[item.id] !== false, false));
    for (const child of item.children || []) {
      widgetsList.appendChild(makeToggleRow(WIDGETS_KEY, child.id, child.label, enabled[child.id] !== false, true));
    }
  }
}

async function renderQuickAccess() {
  quickAccessList.innerHTML = "";
  const items = await getStorage(QUICKACCESS_KEY, []);

  for (let i = 0; i < MAX_SLOTS; i++) {
    const item = items[i];
    const row = el("li", "row");

    if (item) {
      const icon = el("img", "row-icon");
      icon.src = item.favIconUrl || faviconFor(item.url);
      icon.onerror = () => (icon.style.visibility = "hidden");
      const main = el("div", "row-main");
      main.appendChild(el("div", "row-title", item.title || item.url));
      main.appendChild(el("div", "row-sub", item.url));
      row.appendChild(icon);
      row.appendChild(main);
    } else {
      const main = el("div", "row-main");
      main.appendChild(el("div", "row-title", `Slot ${i + 1}: empty`));
      row.appendChild(main);
    }

    const setBtn = el("button", "row-action");
    setBtn.appendChild(iconEl("pin", 14));
    setBtn.title = "Set to current tab";
    setBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;
      const current = await getStorage(QUICKACCESS_KEY, []);
      current[i] = { title: tab.title || tab.url, url: tab.url, favIconUrl: tab.favIconUrl || "" };
      await setStorage(QUICKACCESS_KEY, current);
      renderQuickAccess();
    });
    row.appendChild(setBtn);

    if (item) {
      const clearBtn = el("button", "row-action");
      clearBtn.appendChild(iconEl("close", 14));
      clearBtn.title = "Clear slot";
      clearBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const current = await getStorage(QUICKACCESS_KEY, []);
        current[i] = null;
        await setStorage(QUICKACCESS_KEY, current);
        renderQuickAccess();
      });
      row.appendChild(clearBtn);
    }

    quickAccessList.appendChild(row);
  }
}

appearanceBtn.addEventListener("click", () => {
  chrome.tabs.create({ url: "chrome://settings/appearance" });
});

function applyScreenshotModeUI(mode) {
  screenshotDownloadsOpts.style.display = mode === "custom" ? "none" : "flex";
  screenshotCustomOpts.style.display = mode === "custom" ? "flex" : "none";
}

async function refreshCustomFolderLabel() {
  const handle = await loadDirectoryHandle();
  screenshotCustomLabel.textContent = handle ? `Folder: ${handle.name}` : "No folder chosen yet";
}

async function initScreenshotSettings() {
  const { mode = "downloads", folder = "screenshots" } = await getStorage(SCREENSHOT_KEY, {});
  screenshotModeSelect.value = mode;
  screenshotFolderInput.value = folder;
  applyScreenshotModeUI(mode);
  await refreshCustomFolderLabel();

  screenshotModeSelect.addEventListener("change", async () => {
    const current = await getStorage(SCREENSHOT_KEY, {});
    current.mode = screenshotModeSelect.value;
    await setStorage(SCREENSHOT_KEY, current);
    applyScreenshotModeUI(current.mode);
  });

  screenshotFolderInput.addEventListener("change", async () => {
    const current = await getStorage(SCREENSHOT_KEY, {});
    current.folder = screenshotFolderInput.value.trim().replace(/^\/+|\/+$/g, "") || "screenshots";
    await setStorage(SCREENSHOT_KEY, current);
  });

  screenshotChooseBtn.addEventListener("click", async () => {
    try {
      await chooseDirectory();
      const current = await getStorage(SCREENSHOT_KEY, {});
      current.mode = "custom";
      await setStorage(SCREENSHOT_KEY, current);
      screenshotModeSelect.value = "custom";
      applyScreenshotModeUI("custom");
      await refreshCustomFolderLabel();
    } catch {
      // User cancelled the picker.
    }
  });
}

async function refreshSpotifyStatus() {
  const connected = await isConnected();
  spotifyStatusLabel.innerHTML = connected ? `${iconHTML("check", 12)} Connected` : "Not connected";
  spotifyConnectBtn.textContent = connected ? "Disconnect" : "Connect";
}

async function initSpotifySettings() {
  spotifyRedirectCopyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(getRedirectUri());
    const original = spotifyRedirectCopyBtn.innerHTML;
    spotifyRedirectCopyBtn.innerHTML = `${iconHTML("check", 14)} Copied!`;
    setTimeout(() => (spotifyRedirectCopyBtn.innerHTML = original), 1200);
  });
  spotifyClientIdInput.value = await getStorage(CLIENT_ID_KEY, "");
  await refreshSpotifyStatus();

  spotifyConnectBtn.addEventListener("click", async () => {
    if (await isConnected()) {
      await disconnect();
      await refreshSpotifyStatus();
      refreshSpotifyPanel();
      return;
    }

    const clientId = spotifyClientIdInput.value.trim();
    if (!clientId) {
      alert("Paste your Spotify app's Client ID first.");
      return;
    }

    try {
      await connect(clientId);
      await refreshSpotifyStatus();
      refreshSpotifyPanel();
    } catch (err) {
      alert(`Spotify connection failed: ${err.message}`);
    }
  });
}

export async function init() {
  renderToggleList(sectionsList, PANEL_LABELS, PANELS_KEY);
  renderToggleList(actionsList, QUICK_ACTION_LABELS, ACTIONS_KEY);
  await renderWidgetsList();
  await renderQuickAccess();
  await initScreenshotSettings();
  await initSpotifySettings();
  versionLabel.textContent = `Smart Sidebar Hub v${chrome.runtime.getManifest().version}`;
}
