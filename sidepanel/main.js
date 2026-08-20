import * as tabs from "./tabs.js";
import * as downloads from "./downloads.js";
import * as pins from "./pins.js";
import * as translate from "./translate.js";
import * as notes from "./notes.js";
import * as closed from "./closed.js";
import * as clipboard from "./clipboard.js";
import * as settings from "./settings.js";
import * as nowplaying from "./nowplaying.js";
import * as quickaccess from "./quickaccess.js";
import * as quickactions from "./quickactions.js";
import * as theme from "./theme.js";

const modules = { tabs, downloads, pins, translate, notes, closed, clipboard, settings };
const initialized = new Set();

const tabbar = document.getElementById("tabbar");
const buttons = [...tabbar.querySelectorAll(".tabbtn")];
const ACTIVE_KEY = "activePanel";
const ENABLED_KEY = settings.PANELS_KEY;

let currentPanel = null;

function activate(name) {
  currentPanel = name;
  for (const btn of buttons) {
    btn.classList.toggle("active", btn.dataset.panel === name);
  }
  for (const panel of document.querySelectorAll(".panel")) {
    panel.classList.toggle("active", panel.id === `panel-${name}`);
  }

  if (!initialized.has(name) && modules[name]) {
    modules[name].init();
    initialized.add(name);
  }

  chrome.storage.local.set({ [ACTIVE_KEY]: name });
}

function applyVisibility(enabled) {
  for (const btn of buttons) {
    const isEnabled = enabled[btn.dataset.panel] !== false;
    btn.style.display = isEnabled ? "" : "none";
  }

  if (currentPanel && enabled[currentPanel] === false) {
    const fallback = buttons.find((b) => enabled[b.dataset.panel] !== false);
    activate(fallback ? fallback.dataset.panel : "settings");
  }
}

for (const btn of buttons) {
  btn.addEventListener("click", () => activate(btn.dataset.panel));
}

document.getElementById("footer-settings").addEventListener("click", () => activate("settings"));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[ENABLED_KEY]) {
    applyVisibility(changes[ENABLED_KEY].newValue || {});
  }
});

theme.init();
nowplaying.init();
quickaccess.init();
quickactions.init();

Promise.all([
  chrome.storage.local.get(ACTIVE_KEY),
  chrome.storage.local.get(ENABLED_KEY),
]).then(([{ [ACTIVE_KEY]: saved }, { [ENABLED_KEY]: enabled }]) => {
  applyVisibility(enabled || {});
  const wanted = saved && modules[saved] ? saved : "tabs";
  activate((enabled || {})[wanted] === false ? "settings" : wanted);
});
