// All calls to the Django backend go through this module.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, options);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = await response.json();
      if (data.detail) message = data.detail;
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

export function deleteSong(id) {
  return request(`/songs/${id}/`, { method: "DELETE" });
}
