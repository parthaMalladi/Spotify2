import { formatDuration } from "../format";
import { usePlayer } from "../player/PlayerContext";

// A table of songs. Clicking a cover (or double-clicking a row) plays the whole list from that song;
// `contextName` ("Library" or the playlist name) labels that list in the queue panel.
// `actions(song, index)` renders the buttons in the last column, which differ per page.
export default function SongList({ songs, contextName, actions, emptyMessage }) {
  const { currentSong, playSongs } = usePlayer();
  const play = (i) => playSongs(songs, i, contextName);

  if (songs.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
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
          <tr key={song.id} className={currentSong?.id === song.id ? "current" : ""} onDoubleClick={() => play(i)}>
            <td>
              <button className="cover-button" onClick={() => play(i)} title="Play">
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
              <div className="actions">{actions(song, i)}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
