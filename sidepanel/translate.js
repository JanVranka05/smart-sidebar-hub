import { getStorage, setStorage } from "./util.js";

const langSelect = document.getElementById("translate-lang");
const getSelectionBtn = document.getElementById("translate-getselection");
const textArea = document.getElementById("translate-text");
const goBtn = document.getElementById("translate-go");

const STORAGE_KEY = "translateLang";

const LANGUAGES = [
  ["en", "English"],
  ["cs", "Czech"],
  ["sk", "Slovak"],
  ["de", "German"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["it", "Italian"],
  ["pl", "Polish"],
  ["pt", "Portuguese"],
  ["nl", "Dutch"],
  ["ru", "Russian"],
  ["uk", "Ukrainian"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh-CN", "Chinese (Simplified)"],
];

for (const [code, name] of LANGUAGES) {
  const opt = document.createElement("option");
  opt.value = code;
  opt.textContent = `Translate to ${name}`;
  langSelect.appendChild(opt);
}

langSelect.addEventListener("change", () => {
  setStorage(STORAGE_KEY, langSelect.value);
});

getSelectionBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString(),
    });
    if (result) textArea.value = result;
  } catch {
    // Page not scriptable (e.g. chrome:// URL) — ignore.
  }
});

goBtn.addEventListener("click", () => {
  const text = textArea.value.trim();
  if (!text) return;
  const lang = langSelect.value || "en";
  const url = `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(lang)}&text=${encodeURIComponent(text)}&op=translate`;
  chrome.tabs.create({ url });
});

export async function init() {
  const savedLang = await getStorage(STORAGE_KEY, "en");
  langSelect.value = savedLang;
}
