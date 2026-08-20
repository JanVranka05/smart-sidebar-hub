import * as downloads from "./downloads.js";
import * as pins from "./pins.js";
import * as translate from "./translate.js";
import * as notes from "./notes.js";
import * as closed from "./closed.js";
import * as group from "./group.js";

const modules = { downloads, pins, translate, notes, closed, group };
const initialized = new Set();

const tabbar = document.getElementById("tabbar");
const buttons = [...tabbar.querySelectorAll(".tabbtn")];
const STORAGE_KEY = "activePanel";

function activate(name) {
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

  chrome.storage.local.set({ [STORAGE_KEY]: name });
}

for (const btn of buttons) {
  btn.addEventListener("click", () => activate(btn.dataset.panel));
}

chrome.storage.local.get(STORAGE_KEY).then(({ [STORAGE_KEY]: saved }) => {
  activate(saved && modules[saved] ? saved : "downloads");
});
