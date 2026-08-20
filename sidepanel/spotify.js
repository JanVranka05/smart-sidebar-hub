import { el, formatDuration } from "./util.js";
import { iconEl } from "./icons.js";
import { isConnected, spotifyFetch } from "./spotifyAuth.js";

const statusBox = document.getElementById("spotify-status");
const nowPlayingBox = document.getElementById("spotify-nowplaying");
const controlsBox = document.getElementById("spotify-controls");
const playlistsList = document.getElementById("spotify-playlists");

let pollTimer = null;

function isPanelActive() {
  return document.getElementById("panel-spotify")?.classList.contains("active");
}

function renderNowPlaying(data) {
  nowPlayingBox.innerHTML = "";
  controlsBox.innerHTML = "";

  if (!data || !data.item) {
    nowPlayingBox.appendChild(el("div", "empty", "Nothing playing right now."));
    return;
  }

  const track = data.item;
  const row = el("div", "row");

  const art = track.album?.images?.[track.album.images.length - 1]?.url;
  if (art) {
    const img = el("img", "row-icon");
    img.style.width = "40px";
    img.style.height = "40px";
    img.src = art;
    row.appendChild(img);
  }

  const main = el("div", "row-main");
  main.appendChild(el("div", "row-title", track.name));
  main.appendChild(el("div", "row-sub", track.artists?.map((a) => a.name).join(", ")));
  row.appendChild(main);

  nowPlayingBox.appendChild(row);

  if (track.duration_ms) {
    const timeRow = el("div", "row-sub", `${formatDuration(data.progress_ms || 0)} / ${formatDuration(track.duration_ms)}`);
    timeRow.style.textAlign = "center";
    nowPlayingBox.appendChild(timeRow);

    const progressTrack = el("div", "progress-track");
    const fill = el("div", "progress-fill");
    fill.style.width = `${Math.min(100, ((data.progress_ms || 0) / track.duration_ms) * 100)}%`;
    progressTrack.appendChild(fill);
    nowPlayingBox.appendChild(progressTrack);
  }

  const prevBtn = el("button", "row-action");
  prevBtn.appendChild(iconEl("skipBack", 16));
  const toggleBtn = el("button", "row-action spotify-toggle-btn");
  toggleBtn.appendChild(iconEl(data.is_playing ? "pause" : "play", 18));
  const nextBtn = el("button", "row-action");
  nextBtn.appendChild(iconEl("skipForward", 16));

  prevBtn.addEventListener("click", async () => {
    await spotifyFetch("/me/player/previous", { method: "POST" });
    setTimeout(refresh, 400);
  });
  toggleBtn.addEventListener("click", async () => {
    await spotifyFetch(`/me/player/${data.is_playing ? "pause" : "play"}`, { method: "PUT" });
    setTimeout(refresh, 400);
  });
  nextBtn.addEventListener("click", async () => {
    await spotifyFetch("/me/player/next", { method: "POST" });
    setTimeout(refresh, 400);
  });

  controlsBox.appendChild(prevBtn);
  controlsBox.appendChild(toggleBtn);
  controlsBox.appendChild(nextBtn);
}

async function renderPlaylists() {
  playlistsList.innerHTML = "";
  try {
    const data = await spotifyFetch("/me/playlists?limit=20");
    for (const pl of data.items) {
      const row = el("li", "row");
      const img = pl.images?.[0]?.url;
      if (img) {
        const icon = el("img", "row-icon");
        icon.src = img;
        row.appendChild(icon);
      }
      const main = el("div", "row-main");
      main.appendChild(el("div", "row-title", pl.name));
      main.appendChild(el("div", "row-sub", `${pl.tracks?.total ?? 0} tracks`));
      row.appendChild(main);

      row.addEventListener("click", async () => {
        try {
          await spotifyFetch("/me/player/play", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ context_uri: pl.uri }),
          });
          setTimeout(refresh, 500);
        } catch (err) {
          alert(err.message);
        }
      });

      playlistsList.appendChild(row);
    }
  } catch {
    // Playlists are secondary — fail quietly, now-playing already reported errors.
  }
}

async function refresh() {
  if (!(await isConnected())) {
    statusBox.textContent = "Not connected. Go to Settings to connect your Spotify account.";
    statusBox.classList.add("empty");
    nowPlayingBox.innerHTML = "";
    controlsBox.innerHTML = "";
    playlistsList.innerHTML = "";
    return;
  }

  statusBox.textContent = "";
  statusBox.classList.remove("empty");
  try {
    const data = await spotifyFetch("/me/player/currently-playing");
    renderNowPlaying(data);
  } catch (err) {
    nowPlayingBox.innerHTML = "";
    controlsBox.innerHTML = "";
    nowPlayingBox.appendChild(el("div", "empty", err.message));
  }

  if (playlistsList.childElementCount === 0) await renderPlaylists();
}

export function init() {
  refresh();
  if (!pollTimer) {
    pollTimer = setInterval(() => {
      if (isPanelActive()) refresh();
    }, 10_000);
  }
}

export { refresh as refreshSpotifyPanel };
