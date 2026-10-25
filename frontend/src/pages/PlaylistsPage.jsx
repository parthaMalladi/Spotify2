import { useState } from "react";
import AccountInfo from "../components/AccountInfo";
import ActionSheet from "../components/ActionSheet";
import { MoreIcon } from "../components/icons";
import { usePlayer } from "../player/PlayerContext";
import { queuePlaylist } from "../player/queuePlaylist";

// Phones only: the playlist list and account links that the sidebar shows on wider screens.
export default function PlaylistsPage({ playlists, onOpenPlaylist, onCreatePlaylist, user, onLogOut }) {
  const { addSongsToQueue } = usePlayer();
  const [sheetPlaylist, setSheetPlaylist] = useState(null); // the playlist whose ⋯ menu is open

  return (
    <>
      <div className="page-heading">
        <h2>Playlists</h2>
        <button className="button" onClick={onCreatePlaylist}>
          + New
        </button>
      </div>
      {playlists.length === 0 && <p className="muted">No playlists yet.</p>}
      {playlists.map((playlist) => (
        <div key={playlist.id} className="playlist-row">
          <button className="nav-item" onClick={() => onOpenPlaylist(playlist.id)}>
            <span className="nav-name">{playlist.name}</span>
            <span className="muted small">
              {playlist.song_count} {playlist.song_count === 1 ? "song" : "songs"}
            </span>
          </button>
          <button className="icon more" onClick={() => setSheetPlaylist(playlist)} aria-label={`More actions for ${playlist.name}`}>
            <MoreIcon />
          </button>
        </div>
      ))}

      <AccountInfo user={user} onLogOut={onLogOut} />

      {sheetPlaylist && (
        <ActionSheet header={<strong>{sheetPlaylist.name}</strong>} onClose={() => setSheetPlaylist(null)}>
          <button onClick={() => onOpenPlaylist(sheetPlaylist.id)}>Open</button>
          <button
            disabled={sheetPlaylist.song_count === 0}
            onClick={() => queuePlaylist(sheetPlaylist, addSongsToQueue)}
          >
            {sheetPlaylist.song_count === 0 ? "Add to queue (playlist is empty)" : "Add playlist to queue"}
          </button>
        </ActionSheet>
      )}
    </>
  );
}
