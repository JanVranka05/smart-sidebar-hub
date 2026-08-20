import { getStorage, setStorage, debounce } from "./util.js";

const textArea = document.getElementById("notes-text");
const STORAGE_KEY = "notes";

const save = debounce((value) => setStorage(STORAGE_KEY, value), 300);

textArea.addEventListener("input", () => save(textArea.value));

export async function init() {
  textArea.value = await getStorage(STORAGE_KEY, "");
}
