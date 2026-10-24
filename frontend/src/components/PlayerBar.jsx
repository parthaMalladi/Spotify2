import { useState } from "react";
import { formatDuration } from "../format";
import { usePlayer } from "../player/PlayerContext";

export default function PlayerBar() {
  const player = usePlayer();
  const { currentSong, isPlaying, currentTime, duration, volume, error } = player;
  // While the progress bar is being dragged, show the drag position and only seek on release.
  const [dragTime, setDragTime] = useState(null);

  function commitSeek() {
    if (dragTime !== null) {
      player.seek(dragTime);
      setDragTime(null);
    }
  }

  const shownTime = dragTime ?? currentTime;

  return (
    <footer className="player-bar">
      <div className="now-playing">
        {currentSong?.cover_url ? (
          <img className="cover" src={currentSong.cover_url} alt="" />
        ) : (
          <div className="cover placeholder">♪</div>
        )}
        <div className="now-playing-text">
          <div className="title">{currentSong ? currentSong.title : "Nothing playing"}</div>
          <div className="muted">{currentSong?.artist}</div>
        </div>
      </div>

      <div className="controls">
        <div className="buttons">
          <button className="icon" onClick={player.previous} disabled={!currentSong} title="Previous">
            ⏮
          </button>
          <button className="icon play" onClick={player.togglePlay} disabled={!currentSong} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button className="icon" onClick={player.next} disabled={!player.hasNext} title="Next">
            ⏭
          </button>
        </div>
        <div className="progress">
          <span className="time">{formatDuration(shownTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(shownTime, duration || 0)}
            disabled={!currentSong}
            onChange={(e) => setDragTime(Number(e.target.value))}
            onPointerUp={commitSeek}
            onKeyUp={commitSeek}
          />
          <span className="time">{formatDuration(duration)}</span>
        </div>
        {error && <div className="player-error">{error}</div>}
      </div>

      <div className="volume">
        <span title="Volume">🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => player.setVolume(Number(e.target.value))}
        />
      </div>
    </footer>
  );
}
