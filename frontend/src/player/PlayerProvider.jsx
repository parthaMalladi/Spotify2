import { useRef, useState } from "react";
import { PlayerContext } from "./PlayerContext";

// Owns the one <audio> element and the list of songs being played.
// It sits above all pages, so playback continues while navigating.
export default function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [list, setList] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(NaN);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState(null);

  const currentSong = list[index] ?? null;
  // Raw AAC streams often report no usable duration, so fall back to the tagged length.
  const duration = Number.isFinite(mediaDuration) ? mediaDuration : currentSong?.duration ?? 0;

  // Switch to song i of songs and start it playing.
  function playAt(songs, i) {
    const audio = audioRef.current;
    setList(songs);
    setIndex(i);
    setError(null);
    setCurrentTime(0);
    setMediaDuration(NaN);
    audio.src = songs[i].stream_url;
    audio.play().catch((err) => {
      // Format errors are reported by the "error" event below; ignore aborts from quick skipping.
      if (err.name === "NotAllowedError") setError("The browser blocked playback. Press play to start.");
    });
  }

  function playSongs(songs, startIndex = 0) {
    playAt(songs, startIndex);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!currentSong) return;
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  function next() {
    if (index < list.length - 1) playAt(list, index + 1);
  }

  function previous() {
    const audio = audioRef.current;
    // Like most players: restart the song unless we're right at its start.
    if (audio.currentTime > 3 || index <= 0) {
      audio.currentTime = 0;
    } else {
      playAt(list, index - 1);
    }
  }

  function seek(time) {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function setVolume(value) {
    audioRef.current.volume = value;
    setVolumeState(value);
  }

  function handleEnded() {
    if (index < list.length - 1) playAt(list, index + 1);
    else setIsPlaying(false);
  }

  function handleError() {
    const code = audioRef.current.error?.code;
    if (code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || code === MediaError.MEDIA_ERR_DECODE) {
      setError(`This browser can't play ${currentSong?.format} files, so "${currentSong?.title}" won't play here.`);
    } else if (code) {
      setError(`Could not load "${currentSong?.title}". Is the Django server running?`);
    }
    setIsPlaying(false);
  }

  const value = {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    hasNext: index < list.length - 1,
    playSongs,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setMediaDuration(e.currentTarget.duration)}
        onDurationChange={(e) => setMediaDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onError={handleError}
      />
    </PlayerContext.Provider>
  );
}
