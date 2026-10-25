import { usePlayer } from "../player/PlayerContext";
import Cover from "./Cover";
import { ChevronDownIcon, QueueIcon } from "./icons";
import { PlaybackButtons, ProgressBar } from "./PlayerControls";

// Phones: the full-screen player opened from the mini player. There's no volume slider here,
// because phones use their volume buttons (and iOS ignores volume set by a web page anyway).
export default function NowPlayingScreen({ onClose, onOpenQueue }) {
  const { currentSong, error } = usePlayer();

  return (
    <div className="now-playing-screen" role="dialog" aria-label="Now playing">
      <div className="now-playing-header">
        <button className="icon" onClick={onClose} aria-label="Close player">
          <ChevronDownIcon />
        </button>
        <span className="now-playing-label">Now playing</span>
        <button className="icon" onClick={onOpenQueue} aria-label="Queue">
          <QueueIcon />
        </button>
      </div>

      <div className="now-playing-art">
        <Cover song={currentSong} className="big" />
      </div>

      <div className="now-playing-info">
        <div className="title">{currentSong ? currentSong.title : "Nothing playing"}</div>
        <div className="muted">{currentSong ? currentSong.artist || "Unknown artist" : ""}</div>
      </div>

      <ProgressBar />
      <PlaybackButtons />
      {error && <p className="error small">{error}</p>}
    </div>
  );
}
