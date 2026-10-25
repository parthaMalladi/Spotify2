import { useCallback, useState } from "react";
import { getPlaylist } from "../api";
import { usePlayer } from "../player/PlayerContext";
import ContextMenu from "./ContextMenu";

export default function Sidebar({ playlists, page, onNavigate, onCreatePlaylist, youtubeImport, youtubeUnseen }) {
  const { addSongsToQueue } = usePlayer();
  const [menu, setMenu] = useState(null); // { x, y, playlist } while the right-click menu is open
  const closeMenu = useCallback(() => setMenu(null), []);

  function handleContextMenu(event, playlist) {
    event.preventDefault();
    setMenu({ x: event.clientX, y: event.clientY, playlist });
  }

  async function addPlaylistToQueue(playlist) {
    try {
      // The sidebar list only has counts, so fetch the songs in playlist order.
      const detail = await getPlaylist(playlist.id);
      addSongsToQueue(detail.songs);
    } catch (err) {
      window.alert(`Could not add "${playlist.name}" to the queue: ${err.message}`);
    }
  }

  return (
    <nav className="sidebar">
      <h1>Music Player</h1>
      <input
        className="search-box"
        type="search"
        placeholder="Search songs & playlists"
        value={page.name === "search" ? page.query : ""}
        onChange={(e) => onNavigate({ name: "search", query: e.target.value })}
      />
      <button
        className={`nav-item ${page.name === "library" ? "active" : ""}`}
        onClick={() => onNavigate({ name: "library" })}
      >
        <span className="nav-name">Library</span>
        <YouTubeBadge status={youtubeImport} unseen={youtubeUnseen && page.name !== "library"} />
      </button>

      <div className="sidebar-heading">
        <span>Playlists</span>
        <button className="link" onClick={onCreatePlaylist} title="New playlist">
          + New
        </button>
      </div>
      {playlists.length === 0 && <p className="muted small">No playlists yet.</p>}
      {playlists.map((playlist) => (
        <button
          key={playlist.id}
          className={`nav-item ${page.name === "playlist" && page.id === playlist.id ? "active" : ""}`}
          onClick={() => onNavigate({ name: "playlist", id: playlist.id })}
          onContextMenu={(e) => handleContextMenu(e, playlist)}
        >
          <span className="nav-name">{playlist.name}</span>
          <span className="muted small">{playlist.song_count}</span>
        </button>
      ))}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onClose={closeMenu}
          items={[
            {
              label: menu.playlist.song_count === 0 ? "Add to queue (playlist is empty)" : "Add playlist to queue",
              disabled: menu.playlist.song_count === 0,
              onClick: () => addPlaylistToQueue(menu.playlist),
            },
          ]}
        />
      )}
    </nav>
  );
}

// Small note next to "Library" so a YouTube download's progress and result are visible from any page.
function YouTubeBadge({ status, unseen }) {
  if (status?.state === "downloading") {
    return (
      <span className="nav-badge" title="Downloading from YouTube">
        <span className="spinner" aria-hidden="true" /> Downloading
      </span>
    );
  }
  if (!unseen) return null;
  if (status?.state === "error") return <span className="nav-badge error">Download failed</span>;
  return <span className="nav-badge success">New song</span>;
}
