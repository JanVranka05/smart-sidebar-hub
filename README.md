# Smart Sidebar Hub

A quick-access Chrome sidebar for downloads, pinned links, translation, notes, recently closed tabs, and grouping open tabs by site.

## 📦 Download

[**Download Smart Sidebar Hub v1.0.0**](https://github.com/JanVranka05/smart-sidebar-hub/releases/latest)

The zip contains the ready-to-load extension folder — no build step needed.

## Features

- **Downloads** — quick view of recent downloads
- **Pinned links** — save and jump to your go-to pages
- **Translate** — translate page content on the fly
- **Notes** — jot things down without leaving the tab
- **Recently closed** — reopen tabs you just closed
- **Group tabs by site** — organize open tabs into Chrome's native tab groups (Gmail, Drive, GitHub, YouTube, etc.)

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
- `background.js` — service worker
- `sidepanel/` — side panel UI and feature scripts (downloads, pins, notes, translate, tab grouping, recently closed)
- `icons/` — extension icons

Reload the extension from `chrome://extensions` after making changes.

## License

Licensed under [CC BY-NC-SA 4.0](LICENSE.md) — free to use, modify, and share for non-commercial purposes, with attribution, under the same license.
