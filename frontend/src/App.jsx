import { useEffect, useState } from "react";
import { deleteSong, listSongs } from "./api";
import PlayerBar from "./components/PlayerBar";
import SongList from "./components/SongList";
import UploadForm from "./components/UploadForm";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listSongs()
      .then(setSongs)
      .catch((err) => setError(`Could not load songs: ${err.message}. Is the Django server running?`))
      .finally(() => setLoading(false));
  }, []);

  function handleUploaded(song) {
    setSongs((current) => [song, ...current]);
  }

  async function handleDelete(song) {
    if (!window.confirm(`Delete "${song.title}"? This removes the file from your library.`)) return;
    try {
      await deleteSong(song.id);
      setSongs((current) => current.filter((s) => s.id !== song.id));
    } catch (err) {
      setError(`Could not delete: ${err.message}`);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Music Player</h1>
      </header>
      <main className="content">
        <h2>Library</h2>
        <UploadForm onUploaded={handleUploaded} />
        {error && <p className="error">{error}</p>}
        {loading ? <p className="muted">Loading…</p> : <SongList songs={songs} onDelete={handleDelete} />}
      </main>
      <PlayerBar />
    </div>
  );
}
