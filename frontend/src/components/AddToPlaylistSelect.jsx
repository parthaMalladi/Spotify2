import { addSongToPlaylist } from "../api";

// A dropdown that adds the song to the chosen playlist. It resets to the placeholder
// after each pick, so it works like a menu. Reports the outcome through onResult({ error, text }).
export default function AddToPlaylistSelect({ song, playlists, onResult }) {
  if (playlists.length === 0) return null;

  async function handleChange(event) {
    const playlist = playlists.find((p) => p.id === Number(event.target.value));
    try {
      await addSongToPlaylist(playlist.id, song.id);
      onResult({ error: false, text: `Added "${song.title}" to "${playlist.name}".` });
    } catch (err) {
      onResult({ error: true, text: err.message });
    }
  }

  return (
    <select className="add-to-playlist" value="" onChange={handleChange}>
      <option value="" disabled>
        Add to playlist…
      </option>
      {playlists.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
