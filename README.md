# Smart Sidebar Hub

A quick-access Chrome sidebar for downloads, pinned links, translation, notes, recently closed tabs, and a tab switcher.

## Features

- **Downloads** — quick view of recent downloads
- **Pinned links** — save and jump to your go-to pages
- **Translate** — translate page content on the fly
- **Notes** — jot things down without leaving the tab
- **Recently closed** — reopen tabs you just closed
- **Tab switcher** — jump between open tabs fast

## Installation

Chrome Web Store listing coming soon. Until then, install manually:

1. Download this repository (`Code` → `Download ZIP`, or `git clone` this repo).
2. Unzip it if needed.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode** (top-right toggle).
5. Click **Load unpacked** and select the project folder.
6. Click the extension icon (or open the side panel) to start using it.

## Development

The extension is plain HTML/CSS/JS, no build step required.

- `manifest.json` — extension manifest (Manifest V3)
- `background.js` — service worker
- `sidepanel/` — side panel UI and feature scripts (downloads, pins, notes, translate, tab switcher, recently closed)
- `icons/` — extension icons

Reload the extension from `chrome://extensions` after making changes.

## License

Licensed under [CC BY-NC-SA 4.0](LICENSE.md) — free to use, modify, and share for non-commercial purposes, with attribution, under the same license.
