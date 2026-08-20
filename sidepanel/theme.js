import { getStorage, setStorage } from "./util.js";

const btn = document.getElementById("footer-theme");
const select = document.getElementById("settings-theme");

export const STORAGE_KEY = "theme";

const ICONS = { auto: "🌓", light: "☀️", dark: "🌙" };

function apply(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  btn.textContent = ICONS[theme] || ICONS.auto;
  btn.dataset.tooltip = `Theme: ${theme} (click to change)`;
  if (select) select.value = theme;
}

btn.addEventListener("click", async () => {
  const current = await getStorage(STORAGE_KEY, "auto");
  let next;
  if (current === "auto") {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    next = systemDark ? "light" : "dark";
  } else {
    next = current === "light" ? "dark" : "light";
  }
  await setStorage(STORAGE_KEY, next);
});

if (select) {
  select.addEventListener("change", () => {
    setStorage(STORAGE_KEY, select.value);
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes[STORAGE_KEY]) {
    apply(changes[STORAGE_KEY].newValue || "auto");
  }
});

export async function init() {
  apply(await getStorage(STORAGE_KEY, "auto"));
}
