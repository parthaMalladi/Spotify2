import { useState } from "react";
import { addSongToPlaylist, deleteSong } from "../api";
import AddToQueueButton from "../components/AddToQueueButton";
import SongList from "../components/SongList";
import UploadForm from "../components/UploadForm";

export default function LibraryPage({ songs, setSongs, loadError, playlists, onPlaylistsChanged }) {
  const [message, setMessage] = useState(null);

  function handleUploaded(song) {
    setSongs((current) => [song, ...current]);
  }

  async function handleDelete(song) {
    if (!window.confirm(`Delete "${song.title}"? This removes the file from your library and from any playlists.`)) return;
    try {
      await deleteSong(song.id);
      setSongs((current) => current.filter((s) => s.id !== song.id));
      onPlaylistsChanged();
    } catch (err) {
      setMessage({ error: true, text: `Could not delete: ${err.message}` });
    }
  }

  async function handleAddToPlaylist(song, playlistId) {
    const playlist = playlists.find((p) => p.id === playlistId);
    try {
      await addSongToPlaylist(playlistId, song.id);
      setMessage({ error: false, text: `Added "${song.title}" to "${playlist.name}".` });
      onPlaylistsChanged();
    } catch (err) {
      setMessage({ error: true, text: err.message });
    }
  }

  return (
    <>
      <h2>Library</h2>
      <UploadForm onUploaded={handleUploaded} />
      {loadError && <p className="error">{loadError}</p>}
      {message && <p className={message.error ? "error" : "success"}>{message.text}</p>}
      <SongList
        songs={songs ?? []}
        contextName="Library"
        emptyMessage={songs === null ? "Loading…" : "No songs yet. Upload some to get started."}
        actions={(song) => (
          <>
            <AddToQueueButton song={song} />
            {playlists.length > 0 && (
              // Resets to the placeholder after each pick, so it works like a menu.
              <select
                className="add-to-playlist"
                value=""
                onChange={(e) => handleAddToPlaylist(song, Number(e.target.value))}
              >
                <option value="" disabled>
                  Add to playlist…
                </option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            <button className="link danger" onClick={() => handleDelete(song)}>
              Delete
            </button>
          </>
        )}
      />
    </>
  );
}
