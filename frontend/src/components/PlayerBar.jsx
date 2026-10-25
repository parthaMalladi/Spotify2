import { usePlayer } from "../player/PlayerContext";
import Cover from "./Cover";
import { QueueIcon } from "./icons";
import { PlaybackButtons, ProgressBar } from "./PlayerControls";

// The desktop/tablet player bar. `onToggleQueue` is only passed on narrower screens, where the queue
// is a drawer instead of an always-visible panel; it adds a Queue button next to the volume.
export default function PlayerBar({ onToggleQueue, queueOpen }) {
  const player = usePlayer();
  const { currentSong, volume, error } = player;

  return (
    <footer className="player-bar">
      <div className="now-playing">
        <Cover song={currentSong} />
        <div className="now-playing-text">
          <div className="title">{currentSong ? currentSong.title : "Nothing playing"}</div>
          <div className="muted">{currentSong?.artist}</div>
        </div>
      </div>

      <div className="controls">
        <PlaybackButtons />
        <ProgressBar />
        {error && <div className="player-error">{error}</div>}
      </div>

      <div className="volume">
        {onToggleQueue && (
          <button
            className={`icon toggle ${queueOpen ? "active" : ""}`}
            onClick={onToggleQueue}
            title="Queue"
            aria-label="Queue"
            aria-pressed={queueOpen}
          >
            <QueueIcon />
          </button>
        )}
        <span title="Volume">🔊</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          aria-label="Volume"
          onChange={(e) => player.setVolume(Number(e.target.value))}
        />
      </div>
    </footer>
  );
}
