// All calls to the Django backend go through this module.

// While developing, the Vite dev server (port 5173) talks to Django on port 8000. The production build is
// served by Django itself, so it calls the same address the page came from (localhost or the tunnel).
const API_BASE = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "")
  : "";

// Django's admin site, where the admin creates accounts.
export const ADMIN_URL = `${API_BASE}/admin/`;

// Sent with every request that changes something. Django hands out a new one on login and logout.
let csrfToken = null;

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.method && options.method !== "GET") headers["X-CSRFToken"] = csrfToken;
  // "include" sends the login cookie to port 8000 while developing.
  const response = await fetch(`${API_BASE}/api${path}`, { ...options, headers, credentials: "include" });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail === "Authentication credentials were not provided.") {
        message = "You've been logged out. Reload the page to log in again.";
      } else if (data.detail) {
        message = data.detail;
      } else {
        // DRF field validation errors look like {"name": ["This field may not be blank."]}.
        const [field, errors] = Object.entries(data)[0] ?? [];
        if (Array.isArray(errors)) message = `${field}: ${errors[0]}`;
      }
    } catch {
      // Response wasn't JSON; keep the generic message.
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

// Session calls resolve to the logged-in user ({username, is_admin}) or null, and keep the new CSRF token.
async function sessionRequest(path, options) {
  const data = await request(path, options);
  csrfToken = data.csrf_token;
  return data.user;
}

export function getCurrentUser() {
  return sessionRequest("/auth/session/");
}

export function logIn(username, password) {
  return sessionRequest("/auth/login/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function logOut() {
  return sessionRequest("/auth/logout/", { method: "POST" });
}

export function listSongs() {
  return request("/songs/");
}

export function uploadSong(file) {
  const body = new FormData();
  body.append("file", file);
  return request("/songs/", { method: "POST", body });
}

// Slow: the backend downloads the whole video's audio before responding.
export function importFromYouTube(url) {
  return sendJson("/songs/youtube/", "POST", { url });
}

export function deleteSong(id) {
  return request(`/songs/${id}/`, { method: "DELETE" });
}

function sendJson(path, method, data) {
  return request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function listPlaylists() {
  return request("/playlists/");
}

export function getPlaylist(id) {
  return request(`/playlists/${id}/`);
}

export function createPlaylist(name, description = "") {
  return sendJson("/playlists/", "POST", { name, description });
}

export function updatePlaylist(id, changes) {
  return sendJson(`/playlists/${id}/`, "PATCH", changes);
}

export function deletePlaylist(id) {
  return request(`/playlists/${id}/`, { method: "DELETE" });
}

export function addSongToPlaylist(playlistId, songId) {
  return sendJson(`/playlists/${playlistId}/songs/`, "POST", { song_id: songId });
}

export function removeSongFromPlaylist(playlistId, songId) {
  return request(`/playlists/${playlistId}/songs/${songId}/`, { method: "DELETE" });
}

export function reorderPlaylist(playlistId, songIds) {
  return sendJson(`/playlists/${playlistId}/order/`, "PUT", { song_ids: songIds });
}

export function search(query) {
  return request(`/search/?q=${encodeURIComponent(query)}`);
}
