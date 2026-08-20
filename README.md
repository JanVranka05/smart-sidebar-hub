# Smart Sidebar Hub

A quick-access Chrome sidebar for open tabs, downloads, pinned links, translation, notes, recently closed tabs, clipboard history, quick-access favorites, and Spotify control.

## 📦 Download

[**Download Smart Sidebar Hub v1.7.1**](https://github.com/JanVranka05/smart-sidebar-hub/releases/latest)

The zip contains the ready-to-load extension folder — no build step needed.

## Features

- **Open tabs** — full list of every open tab, nested under their tab group (or a Pinned header), with search
- **Group tabs by site** — organize open tabs into Chrome's native tab groups (Gmail, Drive, Sheets, GitHub, YouTube, etc.), right from the Open Tabs panel
- **Downloads** — search, open, show in folder, and drag completed downloads straight out to the desktop
- **Pinned links** — save and jump to your go-to pages
- **Translate** — grab the page selection and open it in Google Translate
- **Notes** — a persistent scratchpad, auto-saved as you type
- **Recently closed** — restore closed tabs/windows with one click
- **Clipboard history** — anything you copy on any page shows up here, click to re-copy it
- **Now Playing widget** — always-visible, shows whichever tab is (or was recently) playing audio, with a live progress bar, pause, and mute controls
- **Spotify** — see what's playing, control playback, and browse playlists, both as a persistent widget and a full panel. See [SPOTIFY_SETUP.md](SPOTIFY_SETUP.md) to connect your account
- **Quick Access** — 2 pinned shortcut chips (Arc-style) for instant access to your two most-used pages
- **Quick Actions bar** — Tidy tabs (group + reorder), collapse/expand groups, screenshot the current tab, pause all playing media, freeze all background tabs, copy all tab URLs — each individually toggleable
- **Settings panel** — show/hide any section, quick action, or widget, pick your screenshot save location (including any folder on disk, not just Downloads), and switch themes
- **Custom icon set** — every icon in the UI is a hand-built inline SVG, no emoji, fully theme-aware

## Keyboard shortcut

Open the sidebar with **Ctrl+Shift+U** (**Cmd+Shift+U** on Mac). Rebind it anytime at `chrome://extensions/shortcuts`.

## Theme

Toggle Light/Dark from the footer bar, or pick Auto/Light/Dark explicitly in Settings.

## Move the sidebar to the left

Chrome controls side panel position globally (not per-extension): `chrome://settings/appearance` → **Side panel** → choose left or right.

## Installation

Chrome Web Store listing coming soon. Until then, install manually:

1. Grab the latest zip from the [**Download**](#-download) link above (or `git clone` this repo).
2. Unzip it if needed.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the extracted folder.
6. Click the extension icon (or open the side panel) to start using it.

## Updating

New versions are published on the [Releases page](https://github.com/JanVranka05/smart-sidebar-hub/releases). Download the newer zip, unzip over the old folder (or a fresh one), then click the reload icon for the extension on `chrome://extensions`.

## Development

The extension is plain HTML/CSS/JS, no build step required.

- `manifest.json` — extension manifest (Manifest V3)
- `background.js` — service worker (handles clipboard capture messages)
- `content/` — content script that captures text you copy on any page
- `sidepanel/` — side panel UI and all feature scripts (`icons.js` holds the inline SVG icon set, `spotify*.js` handle the Spotify integration)
- `icons/` — extension icons

Reload the extension from `chrome://extensions` after making changes.

## License

Licensed under [CC BY-NC-SA 4.0](LICENSE.md) — free to use, modify, and share for non-commercial purposes, with attribution, under the same license.
