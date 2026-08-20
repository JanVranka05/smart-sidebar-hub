# Connecting Spotify

Smart Sidebar Hub can show what's currently playing on Spotify and let you control playback (play/pause, skip, browse playlists) right from the sidebar.

This requires connecting your own Spotify account through Spotify's official developer platform — there's no shared/pre-configured connection, so each user sets up their own. It takes about 5 minutes and is free.

**Before you start, two things worth knowing:**

- **Playback control (play/pause/skip) requires Spotify Premium.** Free accounts can still see what's playing, but Spotify's API blocks remote play/pause/skip commands for free accounts.
- **This controls an existing Spotify session — it doesn't play audio itself.** You need Spotify already open somewhere (the desktop app, the mobile app, or web player) for play/pause/skip to have anything to act on. If nothing is open, you'll see a "no active device" message.

## Step 1 — Get your Redirect URI from the extension

1. Open the sidebar and click **⚙️ Settings** (bottom-left icon in the footer bar).
2. Scroll to the **Spotify** section.
3. Click **📋 Copy redirect URI**. It copies something like:
   ```
   https://<a long id>.chromiumapp.org/
   ```
   Keep this copied — you'll paste it into Spotify in the next step. This value is unique to your install of the extension, so don't reuse one from someone else's screenshot or guide.

## Step 2 — Create a Spotify app

1. Go to [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and log in with your normal Spotify account.
2. Click **Create app**.
3. Fill in:
   - **App name**: anything, e.g. "My Sidebar Hub"
   - **App description**: anything, e.g. "Personal browser sidebar integration"
   - **Website**: optional, can leave blank
   - **Redirect URIs**: paste the URI you copied in Step 1, then click **Add** next to the field — it's not saved until you click Add.
4. Under **"Which API/SDKs are you planning to use?"**, check **Web API** only.
5. Check the box agreeing to Spotify's Developer Terms of Service and Design Guidelines.
6. Click **Save**.

## Step 3 — Get your Client ID

1. You'll land on your new app's page. Click into its **Settings**.
2. Copy the **Client ID** shown there.
3. You do **not** need the Client Secret — this extension uses a secure flow (PKCE) that never needs it, so don't paste it anywhere.

## Step 4 — Connect in the extension

1. Back in the sidebar's Settings → Spotify section, paste the Client ID into the **Client ID** field.
2. Click **Connect**.
3. A Spotify login/consent popup opens once — approve it.
4. The status should change to **✅ Connected**.

## Using it

- **🎵 Spotify tab** in the sidebar's tab bar: shows the current track with album art, play/pause/skip controls, progress bar, and your playlists — click a playlist to start playing it.
- **Spotify widget**: a compact always-visible bar showing the current track, right below the browser tab "Now Playing" widget. Toggle it on/off independently in Settings → Widgets.

## Troubleshooting

**"No active Spotify device"** — Open Spotify somewhere first (desktop app, phone, or [open.spotify.com](https://open.spotify.com)) so there's something for the extension to control.

**Redirect URI mismatch / invalid redirect URI** — The URI you pasted into the Spotify dashboard must exactly match what the extension's Settings page showed you, including the trailing slash. If you ever reload the extension in a way that changes its ID (e.g. moving the extension's folder), the URI will change too, and you'll need to update it in the Spotify dashboard.

**Play/pause/skip does nothing** — Most likely you're on a free Spotify account. Spotify's API restricts playback control to Premium accounts; viewing what's playing still works either way.

**Connect button does nothing / popup doesn't appear** — Make sure you clicked **Add** next to the Redirect URI field on the Spotify dashboard (typing it in isn't enough), and that you copied the full URI including `https://` and the trailing `/`.
