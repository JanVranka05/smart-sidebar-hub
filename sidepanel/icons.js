const ICONS = {
  tidy: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="16" y2="12"/><line x1="4" y1="18" x2="12" y2="18"/>',
  collapse: '<polyline points="7 8 12 3 17 8"/><polyline points="7 16 12 21 17 16"/>',
  camera: '<path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
  pause: '<rect x="7" y="5" width="3" height="14" rx="1"/><rect x="14" y="5" width="3" height="14" rx="1"/>',
  freeze: '<line x1="12" y1="3" x2="12" y2="21"/><line x1="4.2" y1="7.5" x2="19.8" y2="16.5"/><line x1="19.8" y1="7.5" x2="4.2" y2="16.5"/><line x1="10" y1="5" x2="14" y2="5"/><line x1="10" y1="19" x2="14" y2="19"/><line x1="17.1" y1="6.8" x2="19.1" y2="10.2"/><line x1="4.9" y1="13.8" x2="6.9" y2="17.2"/><line x1="17.1" y1="17.2" x2="19.1" y2="13.8"/><line x1="6.9" y1="6.8" x2="4.9" y2="10.2"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="1.5"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/>',
  settings: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="9" cy="18" r="2"/>',
  themeAuto: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor" stroke="none"/>',
  themeLight: '<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.1" y2="4.9"/>',
  themeDark: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  tabs: '<rect x="4" y="4" width="16" height="16" rx="2"/><line x1="4" y1="9" x2="20" y2="9"/>',
  download: '<path d="M12 4v10"/><polyline points="7 10 12 15 17 10"/><line x1="4" y1="19" x2="20" y2="19"/>',
  pin: '<path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  translate: '<circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><ellipse cx="12" cy="12" rx="4" ry="9"/>',
  notes: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="13" y2="16"/>',
  history: '<circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/><path d="M4 8V4H8"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="1.5"/><rect x="9" y="2" width="6" height="3" rx="1"/><line x1="9" y1="10" x2="15" y2="10"/><line x1="9" y1="14" x2="15" y2="14"/><line x1="9" y1="18" x2="13" y2="18"/>',
  music: '<circle cx="8" cy="17" r="3"/><circle cx="18" cy="15" r="3"/><path d="M11 17V5l10-2v12"/>',
  folder: '<path d="M4 6a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><polyline points="20 4 20 9 15 9"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  close: '<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>',
  mute: '<path d="M5 9v6h4l5 5V4l-5 5H5z"/><line x1="16" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="16" y2="15"/>',
  volume: '<path d="M5 9v6h4l5 5V4l-5 5H5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19 6a9 9 0 0 1 0 12"/>',
  skipBack: '<polygon points="17 6 8 12 17 18"/><line x1="6" y1="6" x2="6" y2="18"/>',
  skipForward: '<polygon points="7 6 16 12 7 18"/><line x1="18" y1="6" x2="18" y2="18"/>',
  play: '<polygon points="7 5 19 12 7 19"/>',
  file: '<path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/>',
  check: '<polyline points="5 13 10 18 19 7"/>',
  alert: '<path d="M12 3 2 20h20L12 3z"/><line x1="12" y1="10" x2="12" y2="15"/><circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none"/>',
};

export function iconHTML(name, size = 16) {
  const body = ICONS[name] || "";
  return `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

export function iconEl(name, size = 16) {
  const wrap = document.createElement("span");
  wrap.className = "icon-wrap";
  wrap.innerHTML = iconHTML(name, size);
  return wrap;
}
