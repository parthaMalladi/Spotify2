import { useState } from "react";
import { deleteSong } from "../api";
import AddToPlaylistSelect from "../components/AddToPlaylistSelect";
import AddToQueueButton from "../components/AddToQueueButton";
import SongList from "../components/SongList";
import UploadForm from "../components/UploadForm";
import YouTubeImportForm from "../components/YouTubeImportForm";

export default function LibraryPage({
  songs,
  setSongs,
  loadError,
  playlists,
  onPlaylistsChanged,
  youtubeImport,
  onYouTubeImport,
}) {
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

  function handleAddedToPlaylist(result) {
    setMessage(result);
    if (!result.error) onPlaylistsChanged();
  }

  return (
    <>
      <h2>Library</h2>
      <UploadForm onUploaded={handleUploaded} />
      <YouTubeImportForm status={youtubeImport} onImport={onYouTubeImport} />
      {loadError && <p className="error">{loadError}</p>}
      {message && <p className={message.error ? "error" : "success"}>{message.text}</p>}
      <SongList
        songs={songs ?? []}
        contextName="Library"
        emptyMessage={songs === null ? "Loading…" : "No songs yet. Upload some to get started."}
        actions={(song) => (
          <>
            <AddToQueueButton song={song} />
            <AddToPlaylistSelect song={song} playlists={playlists} onResult={handleAddedToPlaylist} />
            <button className="link danger" onClick={() => handleDelete(song)}>
              Delete
            </button>
          </>
        )}
      />
    </>
  );
}
