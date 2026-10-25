import { useState } from "react";
import { formatDuration } from "../format";
import { usePlayer } from "../player/PlayerContext";
import { useIsMobile } from "../useMediaQuery";
import ActionSheet from "./ActionSheet";
import Cover from "./Cover";
import { MoreIcon } from "./icons";

// A list of songs. Playing a song plays the whole list from that song; `contextName` ("Library" or the
// playlist name) labels that list in the queue. `actions(song, index)` renders the per-song buttons,
// which differ per page.
// Desktop: a table; click a cover (or double-click a row) to play, actions in the last column.
// Phones: compact rows; tap a row to play, ⋯ opens the actions in a sheet from the bottom.
export default function SongList({ songs, contextName, actions, emptyMessage }) {
  const { currentSong, playSongs } = usePlayer();
  const isMobile = useIsMobile();
  const [sheet, setSheet] = useState(null); // phones: { song, index } whose action sheet is open
  const play = (i) => playSongs(songs, i, contextName);

  if (songs.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }

  if (isMobile) {
    return (
      <>
        <ul className="song-rows">
          {songs.map((song, i) => (
            <li key={song.id} className={`song-row ${currentSong?.id === song.id ? "current" : ""}`}>
              <button className="song-row-main" onClick={() => play(i)}>
                <Cover song={song} />
                <span className="song-row-text">
                  <span className="title">{song.title}</span>
                  <span className="muted small">{[song.artist || "Unknown artist", song.album].filter(Boolean).join(" · ")}</span>
                </span>
              </button>
              <button className="icon more" onClick={() => setSheet({ song, index: i })} aria-label={`More actions for ${song.title}`}>
                <MoreIcon />
              </button>
            </li>
          ))}
        </ul>
        {sheet && (
          <ActionSheet
            onClose={() => setSheet(null)}
            header={
              <>
                <Cover song={sheet.song} />
                <span className="action-sheet-header-text">
                  <strong>{sheet.song.title}</strong>
                  <span className="muted small">
                    {sheet.song.artist || "Unknown artist"} · {formatDuration(sheet.song.duration)}
                  </span>
                </span>
              </>
            }
          >
            {actions(sheet.song, sheet.index)}
          </ActionSheet>
        )}
      </>
    );
  }

  return (
    <table className="song-list">
      <thead>
        <tr>
          <th className="shrink"></th>
          <th>Title</th>
          <th>Artist</th>
          <th>Album</th>
          <th className="num shrink">Length</th>
          <th className="shrink"></th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, i) => (
          <tr key={song.id} className={currentSong?.id === song.id ? "current" : ""} onDoubleClick={() => play(i)}>
            <td className="shrink">
              <button className="cover-button" onClick={() => play(i)} title="Play">
                <Cover song={song} />
                <span className="play-overlay">▶</span>
              </button>
            </td>
            <td>{song.title}</td>
            <td>{song.artist || <span className="muted">Unknown artist</span>}</td>
            <td>{song.album || <span className="muted">—</span>}</td>
            <td className="num shrink">{formatDuration(song.duration)}</td>
            <td className="shrink">
              <div className="actions">{actions(song, i)}</div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
