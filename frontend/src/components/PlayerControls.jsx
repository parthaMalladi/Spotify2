import { useState } from "react";
import { formatDuration } from "../format";
import { usePlayer } from "../player/PlayerContext";
import { LoopIcon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, ShuffleIcon } from "./icons";

// Shared by the desktop player bar and the full-screen player on phones.

const LOOP_TITLES = {
  off: "Loop: off (click to loop the list)",
  all: "Loop: whole list (click to loop this song)",
  one: "Loop: this song (click to turn off)",
};

// Shuffle, previous, play/pause, next and loop.
export function PlaybackButtons() {
  const player = usePlayer();
  const { currentSong, isPlaying } = player;

  return (
    <div className="buttons">
      <button
        className={`icon toggle ${player.isShuffled ? "active" : ""}`}
        onClick={player.toggleShuffle}
        title={player.isShuffled ? "Shuffle: on (click to restore original order)" : "Shuffle: off"}
        aria-label="Shuffle"
        aria-pressed={player.isShuffled}
      >
        <ShuffleIcon />
      </button>
      <button className="icon" onClick={player.previous} disabled={!currentSong} title="Previous" aria-label="Previous">
        <PreviousIcon />
      </button>
      <button
        className="icon play"
        onClick={player.togglePlay}
        disabled={!currentSong && !player.hasNext}
        title={isPlaying ? "Pause" : "Play"}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button className="icon" onClick={player.next} disabled={!player.hasNext} title="Next" aria-label="Next">
        <NextIcon />
      </button>
      <button
        className={`icon toggle ${player.loopMode !== "off" ? "active" : ""}`}
        onClick={player.cycleLoopMode}
        title={LOOP_TITLES[player.loopMode]}
        aria-label={LOOP_TITLES[player.loopMode]}
      >
        <LoopIcon />
        {player.loopMode === "one" && <span className="loop-one-badge">1</span>}
      </button>
    </div>
  );
}

// The seek bar with elapsed and total time. While dragging it shows the drag position and only seeks on release.
export function ProgressBar() {
  const player = usePlayer();
  const { currentSong, currentTime, duration } = player;
  const [dragTime, setDragTime] = useState(null);

  function commitSeek() {
    if (dragTime !== null) {
      player.seek(dragTime);
      setDragTime(null);
    }
  }

  const shownTime = dragTime ?? currentTime;

  return (
    <div className="progress">
      <span className="time">{formatDuration(shownTime)}</span>
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(shownTime, duration || 0)}
        disabled={!currentSong}
        aria-label="Seek"
        onChange={(e) => setDragTime(Number(e.target.value))}
        onPointerUp={commitSeek}
        onKeyUp={commitSeek}
      />
      <span className="time">{formatDuration(duration)}</span>
    </div>
  );
}
