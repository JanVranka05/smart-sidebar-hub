import { el, getStorage, formatDuration } from "./util.js";
import { iconEl } from "./icons.js";
import { isConnected, spotifyFetch } from "./spotifyAuth.js";

const box = document.getElementById("spotify-widget");
const WIDGETS_KEY = "enabledWidgets";

let enabled = true;
let pollTimer = null;

async function controlAction(action) {
  try {
    if (action === "prev") await spotifyFetch("/me/player/previous", { method: "POST" });
    if (action === "next") await spotifyFetch("/me/player/next", { method: "POST" });
    if (action === "toggle") {
      const data = await spotifyFetch("/me/player/currently-playing");
      await spotifyFetch(`/me/player/${data?.is_playing ? "pause" : "play"}`, { method: "PUT" });
    }
  } catch {
    // Best-effort — widget will just reflect whatever state comes back next poll.
  }
  setTimeout(render, 400);
}

function renderTrack(data) {
  box.innerHTML = "";
  box.appendChild(el("div", "now-playing-label", "Spotify"));

  const row = el("div", "row");
  const art = data.item.album?.images?.[data.item.album.images.length - 1]?.url;
  if (art) {
    const img = el("img", "row-icon");
    img.src = art;
    row.appendChild(img);
  }

  const artists = data.item.artists?.map((a) => a.name).join(", ") || "";
  const time = data.item.duration_ms
    ? ` · ${formatDuration(data.progress_ms || 0)} / ${formatDuration(data.item.duration_ms)}`
    : "";

  const main = el("div", "row-main");
  main.appendChild(el("div", "row-title", data.item.name));
  main.appendChild(el("div", "row-sub", `${artists}${time}`));
  row.appendChild(main);

  const prevBtn = el("button", "row-action");
  prevBtn.appendChild(iconEl("skipBack", 14));
  prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    controlAction("prev");
  });
  const toggleBtn = el("button", "row-action");
  toggleBtn.appendChild(iconEl(data.is_playing ? "pause" : "play", 14));
  toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    controlAction("toggle");
  });
  const nextBtn = el("button", "row-action");
  nextBtn.appendChild(iconEl("skipForward", 14));
  nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    controlAction("next");
  });

  row.appendChild(prevBtn);
  row.appendChild(toggleBtn);
  row.appendChild(nextBtn);

  box.appendChild(row);

  if (data.item.duration_ms) {
    const progressTrack = el("div", "progress-track");
    const fill = el("div", "progress-fill");
    fill.style.width = `${Math.min(100, ((data.progress_ms || 0) / data.item.duration_ms) * 100)}%`;
    progressTrack.appendChild(fill);
    progressTrack.style.margin = "0 8px 4px";
    box.appendChild(progressTrack);
  }
}

async function render() {
  if (!enabled) {
    box.innerHTML = "";
    return;
  }

  if (!(await isConnected())) {
    box.innerHTML = "";
    return;
  }

  try {
    const data = await spotifyFetch("/me/player/currently-playing");
    if (!data || !data.item) {
      box.innerHTML = "";
      return;
    }
    renderTrack(data);
  } catch {
    box.innerHTML = "";
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes[WIDGETS_KEY]) {
    enabled = (changes[WIDGETS_KEY].newValue || {}).spotify !== false;
    render();
  }
  if (changes.spotifyTokens) render();
});

export async function init() {
  enabled = ((await getStorage(WIDGETS_KEY, {})) || {}).spotify !== false;
  render();
  if (!pollTimer) pollTimer = setInterval(render, 10_000);
}
