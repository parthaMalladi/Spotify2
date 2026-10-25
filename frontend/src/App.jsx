import { useEffect, useState } from "react";
import { createPlaylist, getCurrentUser, importFromYouTube, listPlaylists, listSongs, logOut } from "./api";
import MiniPlayer from "./components/MiniPlayer";
import MobileTabBar from "./components/MobileTabBar";
import NewPlaylistDialog from "./components/NewPlaylistDialog";
import NowPlayingScreen from "./components/NowPlayingScreen";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";
import Sidebar from "./components/Sidebar";
import LibraryPage from "./pages/LibraryPage";
import LoginPage from "./pages/LoginPage";
import PlaylistPage from "./pages/PlaylistPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import SearchPage from "./pages/SearchPage";
import { NARROW_QUERY, useIsMobile, useMediaQuery } from "./useMediaQuery";

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

const START_PAGE = { name: "library" };
// Pages that only exist in the phone layout. On wider screens the sidebar and queue panel show these instead.
const PHONE_ONLY_PAGES = ["playlists", "queue"];

// The player itself, shown once someone is logged in.
// Layouts: wide screens get sidebar | page | queue panel; tablets and small laptops the same with the queue
// as a drawer; phones get the page with a mini player and a tab bar along the bottom.
function MusicApp({ user, onLogOut }) {
  // Simple in-memory navigation: { name: "library" }, { name: "playlist", id }, { name: "search", query },
  // and on phones { name: "playlists" } and { name: "queue" }. Each page is also pushed onto the browser
  // history, so the Back button (and swiping back on phones) works.
  const [page, setPage] = useState(START_PAGE);
  const [songs, setSongs] = useState(null); // null while loading
  const [playlists, setPlaylists] = useState([]);
  const [loadError, setLoadError] = useState(null);
  // YouTube download: null, or { state: "downloading" | "done" | "error", text }.
  const [youtubeImport, setYoutubeImport] = useState(null);
  // A finished download the user hasn't looked at yet; the sidebar flags it until they visit the Library.
  const [youtubeUnseen, setYoutubeUnseen] = useState(false);
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false); // phones: the full-screen player
  const [queueDrawerOpen, setQueueDrawerOpen] = useState(false); // narrower screens: the queue drawer
  const isMobile = useIsMobile();
  const isNarrow = useMediaQuery(NARROW_QUERY);

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

  // The app's first history entry is the start page, so Back from there leaves the app as usual.
  useEffect(() => {
    window.history.replaceState({ page: START_PAGE }, "");
  }, []);

  // Back/Forward: show the page (and full-screen player state) stored in that history entry.
  // Re-added after every render so the handler sees the current page.
  useEffect(() => {
    function handlePopState(event) {
      showPage(event.state?.page ?? START_PAGE);
      setNowPlayingOpen(Boolean(event.state?.nowPlaying));
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });

  function showPage(next) {
    // Arriving at or leaving the Library means the download result has been seen there.
    if (next.name === "library" || page.name === "library") setYoutubeUnseen(false);
    setPage(next);
  }

  function navigate(next) {
    if (next.name === "search" && page.name === "search") {
      // Typing in the search box updates the current history entry instead of adding one per keystroke.
      window.history.replaceState({ page: next }, "");
    } else {
      window.history.pushState({ page: next }, "");
      window.scrollTo(0, 0);
    }
    showPage(next);
  }

  // The full-screen player gets its own history entry, so Back closes it.
  function openNowPlaying() {
    window.history.pushState({ page, nowPlaying: true }, "");
    setNowPlayingOpen(true);
  }

  function closeNowPlaying() {
    window.history.back(); // the popstate handler closes it
  }

  function openQueueFromPlayer() {
    // Swap the player's history entry for the Queue page, so Back returns to where the player was opened.
    const next = { name: "queue" };
    window.history.replaceState({ page: next }, "");
    setNowPlayingOpen(false);
    showPage(next);
    window.scrollTo(0, 0);
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

  // Called by NewPlaylistDialog, which shows the error if this throws.
  async function handleCreatePlaylist(name) {
    const playlist = await createPlaylist(name);
    setCreatingPlaylist(false);
    refreshPlaylists();
    navigate({ name: "playlist", id: playlist.id });
  }

  // Phone-only pages fall back to the Library if the window is widened past the phone layout.
  const shownPage = !isMobile && PHONE_ONLY_PAGES.includes(page.name) ? START_PAGE : page;

  const pageContent = (
    <main className="content">
      {shownPage.name === "library" && (
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
      {shownPage.name === "search" && (
        <SearchPage
          query={shownPage.query}
          onQueryChange={(query) => navigate({ name: "search", query })}
          playlists={playlists}
          onOpenPlaylist={(id) => navigate({ name: "playlist", id })}
          onPlaylistsChanged={refreshPlaylists}
        />
      )}
      {shownPage.name === "playlist" && (
        <PlaylistPage
          key={shownPage.id}
          id={shownPage.id}
          onPlaylistsChanged={refreshPlaylists}
          onDeleted={() => {
            refreshPlaylists();
            navigate({ name: "library" });
          }}
        />
      )}
      {shownPage.name === "playlists" && (
        <PlaylistsPage
          playlists={playlists}
          onOpenPlaylist={(id) => navigate({ name: "playlist", id })}
          onCreatePlaylist={() => setCreatingPlaylist(true)}
          user={user}
          onLogOut={onLogOut}
        />
      )}
      {shownPage.name === "queue" && <QueuePanel variant="page" />}
    </main>
  );

  const newPlaylistDialog = creatingPlaylist && (
    <NewPlaylistDialog onCreate={handleCreatePlaylist} onCancel={() => setCreatingPlaylist(false)} />
  );

  if (isMobile) {
    return (
      <div className="app mobile">
        {pageContent}
        <MiniPlayer onOpen={openNowPlaying} />
        <MobileTabBar page={shownPage} onNavigate={navigate} youtubeImport={youtubeImport} youtubeUnseen={youtubeUnseen} />
        {nowPlayingOpen && <NowPlayingScreen onClose={closeNowPlaying} onOpenQueue={openQueueFromPlayer} />}
        {newPlaylistDialog}
      </div>
    );
  }

  return (
    <div className="app">
      <Sidebar
        playlists={playlists}
        page={shownPage}
        onNavigate={navigate}
        onCreatePlaylist={() => setCreatingPlaylist(true)}
        youtubeImport={youtubeImport}
        youtubeUnseen={youtubeUnseen}
        user={user}
        onLogOut={onLogOut}
      />
      {pageContent}
      {!isNarrow && <QueuePanel />}
      {isNarrow && queueDrawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setQueueDrawerOpen(false)} />
          <QueuePanel variant="drawer" onClose={() => setQueueDrawerOpen(false)} />
        </>
      )}
      <PlayerBar
        onToggleQueue={isNarrow ? () => setQueueDrawerOpen((open) => !open) : undefined}
        queueOpen={queueDrawerOpen}
      />
      {newPlaylistDialog}
    </div>
  );
}
