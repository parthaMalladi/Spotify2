import { useEffect, useState } from "react";
import { createPlaylist, listPlaylists, listSongs } from "./api";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";
import Sidebar from "./components/Sidebar";
import LibraryPage from "./pages/LibraryPage";
import PlaylistPage from "./pages/PlaylistPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  // Simple in-memory navigation: { name: "library" }, { name: "playlist", id } or { name: "search", query }.
  const [page, setPage] = useState({ name: "library" });
  const [songs, setSongs] = useState(null); // null while loading
  const [playlists, setPlaylists] = useState([]);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    Promise.all([listSongs(), listPlaylists()])
      .then(([songList, playlistList]) => {
        setSongs(songList);
        setPlaylists(playlistList);
      })
      .catch((err) => {
        setSongs([]);
        setLoadError(`Could not load your library: ${err.message}. Is the Django server running?`);
      });
  }, []);

  function refreshPlaylists() {
    listPlaylists()
      .then(setPlaylists)
      .catch(() => {}); // the sidebar just keeps its old counts
  }

  async function handleCreatePlaylist() {
    const name = window.prompt("Name for the new playlist:");
    if (!name?.trim()) return;
    try {
      const playlist = await createPlaylist(name.trim());
      refreshPlaylists();
      setPage({ name: "playlist", id: playlist.id });
    } catch (err) {
      window.alert(`Could not create playlist: ${err.message}`);
    }
  }

  return (
    <div className="app">
      <Sidebar playlists={playlists} page={page} onNavigate={setPage} onCreatePlaylist={handleCreatePlaylist} />
      <main className="content">
        {page.name === "library" && (
          <LibraryPage
            songs={songs}
            setSongs={setSongs}
            loadError={loadError}
            playlists={playlists}
            onPlaylistsChanged={refreshPlaylists}
          />
        )}
        {page.name === "search" && (
          <SearchPage
            query={page.query}
            playlists={playlists}
            onOpenPlaylist={(id) => setPage({ name: "playlist", id })}
            onPlaylistsChanged={refreshPlaylists}
          />
        )}
        {page.name === "playlist" && (
          <PlaylistPage
            key={page.id}
            id={page.id}
            onPlaylistsChanged={refreshPlaylists}
            onDeleted={() => {
              refreshPlaylists();
              setPage({ name: "library" });
            }}
          />
        )}
      </main>
      <QueuePanel />
      <PlayerBar />
    </div>
  );
}
