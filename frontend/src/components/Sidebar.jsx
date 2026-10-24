export default function Sidebar({ playlists, page, onNavigate, onCreatePlaylist }) {
  return (
    <nav className="sidebar">
      <h1>Music Player</h1>
      <button
        className={`nav-item ${page.name === "library" ? "active" : ""}`}
        onClick={() => onNavigate({ name: "library" })}
      >
        Library
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
        >
          <span className="nav-name">{playlist.name}</span>
          <span className="muted small">{playlist.song_count}</span>
        </button>
      ))}
    </nav>
  );
}
