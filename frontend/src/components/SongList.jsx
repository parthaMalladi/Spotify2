import { formatDuration } from "../format";
import { usePlayer } from "../player/PlayerContext";

export default function SongList({ songs, onDelete }) {
  const { currentSong, playSongs } = usePlayer();

  if (songs.length === 0) {
    return <p className="empty">No songs yet. Upload some to get started.</p>;
  }

  return (
    <table className="song-list">
      <thead>
        <tr>
          <th></th>
          <th>Title</th>
          <th>Artist</th>
          <th>Album</th>
          <th className="num">Length</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, i) => (
          <tr
            key={song.id}
            className={currentSong?.id === song.id ? "current" : ""}
            onDoubleClick={() => playSongs(songs, i)}
          >
            <td>
              <button className="cover-button" onClick={() => playSongs(songs, i)} title="Play">
                {song.cover_url ? (
                  <img className="cover" src={song.cover_url} alt="" />
                ) : (
                  <div className="cover placeholder">♪</div>
                )}
                <span className="play-overlay">▶</span>
              </button>
            </td>
            <td>{song.title}</td>
            <td>{song.artist || <span className="muted">Unknown artist</span>}</td>
            <td>{song.album || <span className="muted">—</span>}</td>
            <td className="num">{formatDuration(song.duration)}</td>
            <td className="num">
              <button className="link danger" onClick={() => onDelete(song)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
