import { el, relativeTime, formatBytes, debounce } from "./util.js";

const list = document.getElementById("downloads-list");
const search = document.getElementById("downloads-search");
const clearBtn = document.getElementById("downloads-clear");

let items = [];
let query = "";

function basename(path) {
  return path.split(/[\\/]/).pop() || path;
}

function toFileUrl(path) {
  return "file://" + path.split("/").map(encodeURIComponent).join("/");
}

function matches(item) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    basename(item.filename).toLowerCase().includes(q) ||
    (item.url || "").toLowerCase().includes(q)
  );
}

function render() {
  list.innerHTML = "";
  const filtered = items.filter(matches);

  if (filtered.length === 0) {
    list.appendChild(el("li", "empty", query ? "No matching downloads." : "No downloads yet."));
    return;
  }

  for (const item of filtered) {
    const row = el("li", "row");
    row.title = item.filename;

    if (item.state === "complete") {
      row.draggable = true;
      row.addEventListener("dragstart", (e) => {
        const mime = item.mime || "application/octet-stream";
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("DownloadURL", `${mime}:${basename(item.filename)}:${toFileUrl(item.filename)}`);
      });
    }

    const icon = el("span", "row-icon", "📄");
    icon.style.display = "flex";
    icon.style.alignItems = "center";
    icon.style.justifyContent = "center";

    const main = el("div", "row-main");
    main.appendChild(el("div", "row-title", basename(item.filename) || item.url));

    let sub = relativeTime(new Date(item.startTime).getTime());
    if (item.state === "in_progress") {
      sub = `Downloading… ${formatBytes(item.bytesReceived)} / ${item.totalBytes ? formatBytes(item.totalBytes) : "?"}`;
    } else if (item.state === "interrupted") {
      sub = `Failed · ${sub}`;
    } else {
      sub = `${formatBytes(item.fileSize ?? item.totalBytes)} · ${sub}`;
    }
    main.appendChild(el("div", "row-sub", sub));

    if (item.state === "in_progress" && item.totalBytes) {
      const track = el("div", "progress-track");
      const fill = el("div", "progress-fill");
      fill.style.width = `${Math.min(100, (item.bytesReceived / item.totalBytes) * 100)}%`;
      track.appendChild(fill);
      main.appendChild(track);
    }

    row.appendChild(icon);
    row.appendChild(main);

    const showBtn = el("button", "row-action", "📂");
    showBtn.title = "Show in folder";
    showBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.downloads.show(item.id);
    });
    row.appendChild(showBtn);

    const removeBtn = el("button", "row-action", "✕");
    removeBtn.title = "Remove from list";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chrome.downloads.erase({ id: item.id });
    });
    row.appendChild(removeBtn);

    row.addEventListener("click", () => {
      if (item.state === "complete") chrome.downloads.open(item.id);
    });

    list.appendChild(row);
  }
}

async function refresh() {
  items = await chrome.downloads.search({ orderBy: ["-startTime"], limit: 200 });
  render();
}

search.addEventListener(
  "input",
  debounce(() => {
    query = search.value.trim();
    render();
  }, 120)
);

clearBtn.addEventListener("click", () => {
  if (confirm("Clear all download history? This does not delete the downloaded files.")) {
    chrome.downloads.erase({});
  }
});

chrome.downloads.onCreated.addListener(refresh);
chrome.downloads.onErased.addListener(refresh);
chrome.downloads.onChanged.addListener(refresh);

export function init() {
  refresh();
}
