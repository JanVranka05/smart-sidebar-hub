import { getStorage, setStorage } from "./util.js";

export const CLIENT_ID_KEY = "spotifyClientId";
const TOKEN_KEY = "spotifyTokens";

const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
  "playlist-read-private",
].join(" ");

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function randomVerifier(length = 64) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return base64UrlEncode(arr.buffer).slice(0, length);
}

async function sha256(text) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
}

export function getRedirectUri() {
  return chrome.identity.getRedirectURL();
}

export async function isConnected() {
  return !!(await getStorage(TOKEN_KEY, null));
}

export async function disconnect() {
  await setStorage(TOKEN_KEY, null);
}

export async function connect(clientId) {
  const redirectUri = getRedirectUri();
  const codeVerifier = randomVerifier();
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));

  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    scope: SCOPES,
  })}`;

  const resultUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
  const code = new URL(resultUrl).searchParams.get("code");
  if (!code) throw new Error("No authorization code returned");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);

  const tokens = await res.json();
  await setStorage(TOKEN_KEY, { ...tokens, obtained_at: Date.now(), client_id: clientId });
  await setStorage(CLIENT_ID_KEY, clientId);
}

async function refresh(stored) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: stored.client_id,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed (${res.status})`);

  const tokens = await res.json();
  const merged = { ...stored, ...tokens, obtained_at: Date.now() };
  await setStorage(TOKEN_KEY, merged);
  return merged;
}

async function getValidToken() {
  let stored = await getStorage(TOKEN_KEY, null);
  if (!stored) return null;

  const expiresAt = stored.obtained_at + stored.expires_in * 1000 - 60_000;
  if (Date.now() > expiresAt) stored = await refresh(stored);
  return stored.access_token;
}

export async function spotifyFetch(path, options = {}) {
  const token = await getValidToken();
  if (!token) throw new Error("Not connected to Spotify");

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` },
  });

  if (res.status === 204 || res.status === 202) return null;
  if (res.status === 404) throw new Error("No active Spotify device — open Spotify somewhere first");
  if (!res.ok) throw new Error(`Spotify API error (${res.status})`);

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
