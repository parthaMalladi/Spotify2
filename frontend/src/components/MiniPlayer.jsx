import { usePlayer } from "../player/PlayerContext";
import Cover from "./Cover";
import { NextIcon, PauseIcon, PlayIcon } from "./icons";

// Phones: a small player above the tab bar. Tapping the song opens the full-screen player.
// Hidden until there's something to play.
export default function MiniPlayer({ onOpen }) {
  const player = usePlayer();
  const { currentSong, isPlaying, currentTime, duration, error } = player;
  if (!currentSong && !player.hasNext) return null;

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) * 100 : 0;

  return (
    <div className="mini-player">
      <button className="mini-player-main" onClick={onOpen} disabled={!currentSong} aria-label="Open player">
        <Cover song={currentSong} />
        <span className="mini-player-text">
          <span className="title">{currentSong ? currentSong.title : "Nothing playing"}</span>
          {error ? (
            <span className="player-error">{error}</span>
          ) : (
            <span className="muted small">{currentSong ? currentSong.artist || "Unknown artist" : "Press play to start"}</span>
          )}
        </span>
      </button>
      <button className="icon" onClick={player.togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="icon" onClick={player.next} disabled={!player.hasNext} aria-label="Next">
        <NextIcon />
      </button>
      <div className="mini-progress" style={{ width: `${progress}%` }} />
    </div>
  );
}
