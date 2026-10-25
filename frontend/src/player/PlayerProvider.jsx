import { useEffect, useRef, useState } from "react";
import { PlayerContext } from "./PlayerContext";

// Entries wrap a song with a unique key, so the same song can appear more than once.
let nextKey = 1;
function makeEntry(song) {
  return { key: nextKey++, song };
}

// Fisher–Yates shuffle of a copy.
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Owns the one <audio> element and everything about what plays next.
// It sits above all pages, so playback continues while navigating.
//
// Two blocks decide what plays next:
//   1. The manual queue: songs added with "Add to queue". They always play first, in the order added.
//   2. The context: the Library or playlist you started playing, in its own order or shuffled.
//      When the manual queue runs out, the context carries on after the last context song played.
export default function PlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [current, setCurrent] = useState(null); // the entry playing now (from either block)
  const [manualQueue, setManualQueue] = useState([]);
  const [contextName, setContextName] = useState("");
  const [contextEntries, setContextEntries] = useState([]); // original order
  const [shuffled, setShuffled] = useState(null); // shuffled copy of contextEntries while shuffle is on, else null
  const [contextKey, setContextKey] = useState(null); // the context entry played most recently
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(NaN);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState(null);
  // "off": stop at the end of the context, "all": wrap to its start, "one": repeat the current song.
  const [loopMode, setLoopMode] = useState("off");

  const currentSong = current?.song ?? null;
  // The context position is tracked by key, not index, so toggling shuffle never interrupts playback.
  const contextOrder = shuffled ?? contextEntries;
  const contextIndex = contextOrder.findIndex((e) => e.key === contextKey);
  const isPlayingFromQueue = current !== null && current.key !== contextKey;
  const upNext = contextOrder.slice(contextIndex + 1);
  const hasNext = manualQueue.length > 0 || upNext.length > 0 || (loopMode === "all" && contextOrder.length > 0);
  // Raw AAC streams often report no usable duration, so fall back to the tagged length.
  const duration = Number.isFinite(mediaDuration) ? mediaDuration : currentSong?.duration ?? 0;

  function start(entry) {
    const audio = audioRef.current;
    setCurrent(entry);
    setError(null);
    setCurrentTime(0);
    setMediaDuration(NaN);
    audio.src = entry.song.stream_url;
    audio.play().catch((err) => {
      // Format errors are reported by the "error" event below; ignore aborts from quick skipping.
      if (err.name === "NotAllowedError") setError("The browser blocked playback. Press play to start.");
    });
  }

  function startFromContext(entry) {
    setContextKey(entry.key);
    start(entry);
  }

  // Play a Library/playlist list from startIndex. This replaces the context; the manual queue is kept.
  function playSongs(songs, startIndex, name) {
    const entries = songs.map(makeEntry);
    const first = entries[startIndex];
    setContextName(name);
    setContextEntries(entries);
    if (shuffled) setShuffled([first, ...shuffle(entries.filter((e) => e !== first))]);
    startFromContext(first);
  }

  // Jump to a song clicked in the queue panel.
  function playFromQueue(key) {
    const queueIndex = manualQueue.findIndex((e) => e.key === key);
    if (queueIndex >= 0) {
      // Skipping ahead in the manual queue drops the songs before it, like skipping through them.
      setManualQueue(manualQueue.slice(queueIndex + 1));
      start(manualQueue[queueIndex]);
      return;
    }
    const entry = contextOrder.find((e) => e.key === key);
    if (entry) startFromContext(entry);
  }

  function togglePlay() {
    const audio = audioRef.current;
    if (!current) {
      next(); // nothing loaded yet: start with whatever is up next
      return;
    }
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  }

  // Next always moves on, even in "one" mode; only the song ending by itself repeats it.
  function next() {
    if (manualQueue.length > 0) {
      const [first, ...rest] = manualQueue;
      setManualQueue(rest);
      start(first);
    } else if (upNext.length > 0) {
      startFromContext(upNext[0]);
    } else if (loopMode === "all" && contextOrder.length > 0) {
      startFromContext(contextOrder[0]);
    }
  }

  function previous() {
    const audio = audioRef.current;
    // Like most players: restart the song unless we're right at its start.
    if (audio.currentTime > 3) audio.currentTime = 0;
    // From a queued song, go back to the context song that played before it.
    else if (isPlayingFromQueue && contextIndex >= 0) startFromContext(contextOrder[contextIndex]);
    else if (contextIndex > 0) startFromContext(contextOrder[contextIndex - 1]);
    else if (loopMode === "all" && contextOrder.length > 1) startFromContext(contextOrder[contextOrder.length - 1]);
    else audio.currentTime = 0;
  }

  function cycleLoopMode() {
    setLoopMode((mode) => ({ off: "all", all: "one", one: "off" })[mode]);
  }

  // Shuffle only affects the context, never the manual queue.
  function toggleShuffle() {
    if (shuffled) {
      // Back to the original order, continuing after the current context song.
      setShuffled(null);
    } else {
      // The current context song stays first, then every other song once in random order.
      const at = contextOrder[contextIndex];
      const rest = contextEntries.filter((e) => e.key !== contextKey);
      setShuffled(at ? [at, ...shuffle(rest)] : shuffle(rest));
    }
  }

  function addToQueue(song) {
    addSongsToQueue([song]);
  }

  // Appends several songs (e.g. a whole playlist) to the end of the manual queue, in order.
  function addSongsToQueue(songs) {
    setManualQueue((q) => [...q, ...songs.map(makeEntry)]);
  }

  function removeFromQueue(key) {
    setManualQueue((q) => q.filter((e) => e.key !== key));
  }

  function moveInQueue(key, offset) {
    const entries = [...manualQueue];
    const from = entries.findIndex((e) => e.key === key);
    const to = from + offset;
    if (from < 0 || to < 0 || to >= entries.length) return;
    const [moved] = entries.splice(from, 1);
    entries.splice(to, 0, moved);
    setManualQueue(entries);
  }

  function clearQueue() {
    setManualQueue([]);
  }

  function seek(time) {
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }

  function setVolume(value) {
    audioRef.current.volume = value;
    setVolumeState(value);
  }

  // Not called in "one" mode: the <audio loop> attribute restarts the song by itself.
  function handleEnded() {
    if (hasNext) next();
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

  // Lock-screen and notification controls on phones (and media keys on desktops), via the Media Session API.
  const hasMediaSession = "mediaSession" in navigator;

  useEffect(() => {
    if (!hasMediaSession) return;
    navigator.mediaSession.metadata = currentSong
      ? new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist,
          album: currentSong.album,
          artwork: currentSong.cover_url ? [{ src: currentSong.cover_url }] : [],
        })
      : null;
  }, [hasMediaSession, currentSong]);

  useEffect(() => {
    if (hasMediaSession) navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [hasMediaSession, isPlaying]);

  // Lets the lock screen show (and seek) the song position.
  useEffect(() => {
    if (!hasMediaSession || !navigator.mediaSession.setPositionState || !currentSong || !(duration > 0)) return;
    try {
      navigator.mediaSession.setPositionState({ duration, position: Math.min(currentTime, duration), playbackRate: 1 });
    } catch {
      // Some browsers reject odd values mid-load; the next timeupdate tries again.
    }
  }, [hasMediaSession, currentSong, currentTime, duration]);

  // Re-registered after every render, because next/previous depend on the current queue.
  // A null handler greys the button out (e.g. Next when nothing is up next).
  useEffect(() => {
    if (!hasMediaSession) return;
    const handlers = {
      play: () => (current ? audioRef.current.play().catch(() => {}) : next()),
      pause: () => audioRef.current.pause(),
      previoustrack: current ? previous : null,
      nexttrack: hasNext ? next : null,
      seekto: current ? (details) => seek(details.seekTime) : null,
    };
    for (const [action, handler] of Object.entries(handlers)) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // This browser doesn't support that action.
      }
    }
  });

  const value = {
    currentSong,
    currentKey: current?.key ?? null,
    manualQueue,
    upNext,
    contextName,
    isShuffled: shuffled !== null,
    isPlaying,
    currentTime,
    duration,
    volume,
    error,
    loopMode,
    hasNext,
    playSongs,
    playFromQueue,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    cycleLoopMode,
    toggleShuffle,
    addToQueue,
    addSongsToQueue,
    removeFromQueue,
    moveInQueue,
    clearQueue,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        loop={loopMode === "one"}
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
