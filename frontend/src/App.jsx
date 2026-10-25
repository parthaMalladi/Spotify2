import { useEffect, useState } from "react";
import { createPlaylist, getCurrentUser, importFromYouTube, listPlaylists, listSongs, logOut } from "./api";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";
import Sidebar from "./components/Sidebar";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import PlaylistPage from "./pages/PlaylistPage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined while checking, null when logged out
  const [error, setError] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch((err) => setError(`Could not reach the server: ${err.message}. Is the Django server running?`));
  }, []);

  async function handleLogOut() {
    try {
      await logOut();
    } catch {
      // The reload below shows the login page anyway once the session is gone.
    }
    // Reloading stops playback and forgets this user's songs, playlists and queue.
    window.location.reload();
  }

  if (error) return <p className="error app-message">{error}</p>;
  if (user === undefined) return <p className="muted app-message">Loading…</p>;
  if (user === null) return <LoginPage onLoggedIn={setUser} />;
  return <MusicApp user={user} onLogOut={handleLogOut} />;
}

// The player itself, shown once someone is logged in.
function MusicApp({ user, onLogOut }) {
  // Simple in-memory navigation: { name: "library" }, { name: "playlist", id } or { name: "search", query }.
  const [page, setPage] = useState({ name: "library" });
  const [songs, setSongs] = useState(null); // null while loading
  const [playlists, setPlaylists] = useState([]);
  const [loadError, setLoadError] = useState(null);
  // YouTube download: null, or { state: "downloading" | "done" | "error", text }.
  const [youtubeImport, setYoutubeImport] = useState(null);
  // A finished download the user hasn't looked at yet; the sidebar flags it until they visit the Library.
  const [youtubeUnseen, setYoutubeUnseen] = useState(false);

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

  function navigate(next) {
    // Arriving at or leaving the Library means the download result has been seen there.
    if (next.name === "library" || page.name === "library") setYoutubeUnseen(false);
    setPage(next);
  }

  // Returns true on success so the form can clear its input.
  async function handleYouTubeImport(url) {
    setYoutubeImport({ state: "downloading" });
    setYoutubeUnseen(false);
    try {
      const song = await importFromYouTube(url);
      setSongs((current) => [song, ...(current ?? [])]);
      setYoutubeImport({ state: "done", text: `Finished downloading "${song.title}". It's now at the top of your Library.` });
      return true;
    } catch (err) {
      setYoutubeImport({ state: "error", text: `Download failed: ${err.message}` });
      return false;
    } finally {
      setYoutubeUnseen(true);
    }
  }

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
      navigate({ name: "playlist", id: playlist.id });
    } catch (err) {
      window.alert(`Could not create playlist: ${err.message}`);
    }
  }

  return (
    <div className="app">
      <Sidebar
        playlists={playlists}
        page={page}
        onNavigate={navigate}
        onCreatePlaylist={handleCreatePlaylist}
        youtubeImport={youtubeImport}
        youtubeUnseen={youtubeUnseen}
        user={user}
        onLogOut={onLogOut}
      />
      <main className="content">
        {page.name === "library" && (
          <LibraryPage
            songs={songs}
            setSongs={setSongs}
            loadError={loadError}
            isAdmin={user.is_admin}
            playlists={playlists}
            onPlaylistsChanged={refreshPlaylists}
            youtubeImport={youtubeImport}
            onYouTubeImport={handleYouTubeImport}
          />
        )}
        {page.name === "search" && (
          <SearchPage
            query={page.query}
            playlists={playlists}
            onOpenPlaylist={(id) => navigate({ name: "playlist", id })}
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
              navigate({ name: "library" });
            }}
          />
        )}
      </main>
      <QueuePanel />
      <PlayerBar />
    </div>
  );
}
