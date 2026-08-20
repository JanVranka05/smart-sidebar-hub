import { el, PANEL_LABELS, QUICK_ACTION_LABELS, faviconFor, getStorage, setStorage } from "./util.js";
import { STORAGE_KEY as QUICKACCESS_KEY, MAX_SLOTS } from "./quickaccess.js";
import { chooseDirectory, loadDirectoryHandle } from "./screenshotFolder.js";

const sectionsList = document.getElementById("settings-sections");
const actionsList = document.getElementById("settings-actions");
const quickAccessList = document.getElementById("settings-quickaccess");
const appearanceBtn = document.getElementById("settings-appearance");
const versionLabel = document.getElementById("settings-version");
const screenshotModeSelect = document.getElementById("settings-screenshot-mode");
const screenshotFolderInput = document.getElementById("settings-screenshot-folder");
const screenshotDownloadsOpts = document.getElementById("settings-screenshot-downloads-opts");
const screenshotCustomOpts = document.getElementById("settings-screenshot-custom-opts");
const screenshotChooseBtn = document.getElementById("settings-screenshot-choose");
const screenshotCustomLabel = document.getElementById("settings-screenshot-custom-label");

export const PANELS_KEY = "enabledPanels";
export const ACTIONS_KEY = "enabledQuickActions";
export const SCREENSHOT_KEY = "screenshotSettings";

function renderToggleList(container, labels, storageKey) {
  container.innerHTML = "";
  getStorage(storageKey, {}).then((enabled) => {
    for (const [id, label] of Object.entries(labels)) {
      const row = el("li", "toggle-row");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = enabled[id] !== false;
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
      container.appendChild(row);
    }
  });
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

    const setBtn = el("button", "row-action", "📍");
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
      const clearBtn = el("button", "row-action", "✕");
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

export async function init() {
  renderToggleList(sectionsList, PANEL_LABELS, PANELS_KEY);
  renderToggleList(actionsList, QUICK_ACTION_LABELS, ACTIONS_KEY);
  await renderQuickAccess();
  await initScreenshotSettings();
  versionLabel.textContent = `Smart Sidebar Hub v${chrome.runtime.getManifest().version}`;
}
