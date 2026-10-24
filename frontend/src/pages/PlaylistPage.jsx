import { useEffect, useState } from "react";
import { deletePlaylist, getPlaylist, removeSongFromPlaylist, reorderPlaylist, updatePlaylist } from "../api";
import AddToQueueButton from "../components/AddToQueueButton";
import SongList from "../components/SongList";
import { usePlayer } from "../player/PlayerContext";

// Rendered with key={id}, so it remounts (and refetches) when switching playlists.
export default function PlaylistPage({ id, onPlaylistsChanged, onDeleted }) {
  const { playSongs } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getPlaylist(id)
      .then(setPlaylist)
      .catch((err) => setError(`Could not load playlist: ${err.message}`));
  }, [id]);

  async function run(action) {
    setError(null);
    try {
      const updated = await action();
      setPlaylist(updated);
      onPlaylistsChanged();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  function handleRemove(song) {
    run(() => removeSongFromPlaylist(id, song.id));
  }

  function handleMove(index, offset) {
    const songs = [...playlist.songs];
    const [moved] = songs.splice(index, 1);
    songs.splice(index + offset, 0, moved);
    setPlaylist({ ...playlist, songs }); // show the new order immediately
    run(() => reorderPlaylist(id, songs.map((s) => s.id)));
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the playlist "${playlist.name}"? The songs stay in your library.`)) return;
    try {
      await deletePlaylist(id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSave(name, description) {
    // Keep the form open if saving failed (e.g. blank name), so the error can be fixed.
    if (await run(() => updatePlaylist(id, { name, description }))) setEditing(false);
  }

  if (!playlist) {
    return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
  }

  return (
    <>
      {editing ? (
        <PlaylistForm playlist={playlist} onSave={handleSave} onCancel={() => setEditing(false)} />
      ) : (
        <div className="playlist-header">
          <h2>{playlist.name}</h2>
          {playlist.description && <p className="muted">{playlist.description}</p>}
          <div className="playlist-actions">
            <button className="button" onClick={() => playSongs(playlist.songs, 0, playlist.name)} disabled={playlist.songs.length === 0}>
              ▶ Play
            </button>
            <button className="link" onClick={() => setEditing(true)}>
              Rename / edit
            </button>
            <button className="link danger" onClick={handleDelete}>
              Delete playlist
            </button>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
      <SongList
        songs={playlist.songs}
        contextName={playlist.name}
        emptyMessage='This playlist is empty. Add songs from the Library with "Add to playlist…".'
        actions={(song, i) => (
          <>
            <AddToQueueButton song={song} />
            <button className="link" onClick={() => handleMove(i, -1)} disabled={i === 0} title="Move up">
              ↑
            </button>
            <button
              className="link"
              onClick={() => handleMove(i, 1)}
              disabled={i === playlist.songs.length - 1}
              title="Move down"
            >
              ↓
            </button>
            <button className="link danger" onClick={() => handleRemove(song)}>
              Remove
            </button>
          </>
        )}
      />
    </>
  );
}

function PlaylistForm({ playlist, onSave, onCancel }) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description);

  function handleSubmit(event) {
    event.preventDefault();
    onSave(name, description);
  }

  return (
    <form className="playlist-form" onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" maxLength={100} autoFocus />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
      />
      <div className="playlist-actions">
        <button className="button" type="submit">
          Save
        </button>
        <button className="link" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
