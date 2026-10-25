import { useEffect, useState } from "react";
import { search } from "../api";
import AddToPlaylistSelect from "../components/AddToPlaylistSelect";
import AddToQueueButton from "../components/AddToQueueButton";
import SongList from "../components/SongList";
import { useIsMobile } from "../useMediaQuery";

export default function SearchPage({ query, onQueryChange, playlists, onOpenPlaylist, onPlaylistsChanged }) {
  const isMobile = useIsMobile();
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

  // Phones have no sidebar, so the search box lives on this page.
  const searchBox = isMobile && (
    <input
      className="search-box"
      type="search"
      placeholder="Search songs & playlists"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      autoFocus={!q}
    />
  );

  // The heading and box stay at the same place in the tree whether or not there's a query, so the box keeps
  // focus (and a phone keeps its keyboard open) when the first letter is typed.
  return (
    <>
      <h2>{q && !isMobile ? `Results for “${q}”` : "Search"}</h2>
      {searchBox}
      {q ? (
        <>
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
      ) : (
        <p className="muted">Type in the search box to find songs (by title, artist or album) and playlists.</p>
      )}
    </>
  );
}
