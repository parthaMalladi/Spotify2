import { getPlaylist } from "../api";

// Playlist lists only carry song counts, so fetch the songs (in playlist order) before queueing them.
export async function queuePlaylist(playlist, addSongsToQueue) {
  try {
    const detail = await getPlaylist(playlist.id);
    addSongsToQueue(detail.songs);
  } catch (err) {
    window.alert(`Could not add "${playlist.name}" to the queue: ${err.message}`);
  }
}
