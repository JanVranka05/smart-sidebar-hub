import { el, faviconFor, relativeTime } from "./util.js";
import { iconEl } from "./icons.js";

const list = document.getElementById("closed-list");
const refreshBtn = document.getElementById("closed-refresh");

function render(sessions) {
  list.innerHTML = "";

  if (!sessions || sessions.length === 0) {
    list.appendChild(el("li", "empty", "No recently closed tabs."));
    return;
  }

  for (const session of sessions) {
    const entry = session.tab || session.window;
    if (!entry) continue;

    const isWindow = !!session.window;
    const tabCount = isWindow ? session.window.tabs?.length ?? 0 : 0;
    const title = isWindow ? `Window (${tabCount} tabs)` : entry.title || entry.url;
    const url = isWindow ? (session.window.tabs?.[0]?.url ?? "") : entry.url;

    const row = el("li", "row");
    row.title = url;

    let icon;
    if (isWindow) {
      icon = iconEl("tabs", 14);
      icon.classList.add("row-icon");
    } else {
      icon = el("img", "row-icon");
      icon.src = entry.favIconUrl || faviconFor(url);
      icon.onerror = () => (icon.style.visibility = "hidden");
    }

    const main = el("div", "row-main");
    main.appendChild(el("div", "row-title", title));
    main.appendChild(el("div", "row-sub", `${url} · ${relativeTime(session.lastModified * 1000)}`));

    row.appendChild(icon);
    row.appendChild(main);

    row.addEventListener("click", () => {
      chrome.sessions.restore(isWindow ? session.window.sessionId : session.tab.sessionId);
    });

    list.appendChild(row);
  }
}

async function refresh() {
  const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });
  render(sessions);
}

refreshBtn.addEventListener("click", refresh);
chrome.sessions.onChanged.addListener(refresh);

export function init() {
  refresh();
}
