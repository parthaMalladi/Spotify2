import { useEffect, useState } from "react";
import { search } from "../api";
import AddToPlaylistSelect from "../components/AddToPlaylistSelect";
import AddToQueueButton from "../components/AddToQueueButton";
import SongList from "../components/SongList";

export default function SearchPage({ query, playlists, onOpenPlaylist, onPlaylistsChanged }) {
  const [results, setResults] = useState(null); // { songs, playlists } for the latest finished search
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const q = query.trim();

  useEffect(() => {
    if (!q) return;
    let cancelled = false;
    // Wait for a pause in typing instead of querying on every keystroke.
    const timer = setTimeout(() => {
      search(q)
        .then((data) => {
          if (cancelled) return;
          setResults(data);
          setError(null);
        })
        .catch((err) => !cancelled && setError(`Search failed: ${err.message}`));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q]);

  function handleAddedToPlaylist(result) {
    setMessage(result);
    if (!result.error) onPlaylistsChanged();
  }

  if (!q) {
    return (
      <>
        <h2>Search</h2>
        <p className="muted">Type in the search box to find songs (by title, artist or album) and playlists.</p>
      </>
    );
  }

  return (
    <>
      <h2>Results for “{q}”</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className={message.error ? "error" : "success"}>{message.text}</p>}
      {results === null ? (
        !error && <p className="muted">Searching…</p>
      ) : (
        <>
          {results.playlists.length > 0 && (
            <>
              <h3>Playlists</h3>
              <div className="search-playlists">
                {results.playlists.map((playlist) => (
                  <button key={playlist.id} className="nav-item" onClick={() => onOpenPlaylist(playlist.id)}>
                    <span className="nav-name">{playlist.name}</span>
                    <span className="muted small">
                      {playlist.song_count} {playlist.song_count === 1 ? "song" : "songs"}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          <h3>Songs</h3>
          <SongList
            songs={results.songs}
            contextName={`Search: “${q}”`}
            emptyMessage="No songs match."
            actions={(song) => (
              <>
                <AddToQueueButton song={song} />
                <AddToPlaylistSelect song={song} playlists={playlists} onResult={handleAddedToPlaylist} />
              </>
            )}
          />
        </>
      )}
    </>
  );
}
