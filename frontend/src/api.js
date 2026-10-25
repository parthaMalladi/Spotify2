// All calls to the Django backend go through this module.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, options);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail) {
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
