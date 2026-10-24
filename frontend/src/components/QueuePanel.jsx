import { usePlayer } from "../player/PlayerContext";

// The always-visible queue on the right: Now playing, then the manual queue, then the rest of the playlist/library.
export default function QueuePanel() {
  const player = usePlayer();
  const { currentSong, manualQueue, upNext, contextName, isShuffled } = player;
  const nothingQueued = manualQueue.length === 0 && upNext.length === 0;

  return (
    <aside className="queue-panel">
      <h2>Queue</h2>

      {currentSong && (
        <section>
          <h3>Now playing</h3>
          <QueueItem song={currentSong} current />
        </section>
      )}

      {/* Only shown once something has been added with "Add to queue". */}
      {manualQueue.length > 0 && (
        <section>
          <div className="section-heading">
            <h3>Next in queue</h3>
            <button className="link danger small" onClick={player.clearQueue}>
              Clear
            </button>
          </div>
          {manualQueue.map((entry, i) => (
            <QueueItem key={entry.key} song={entry.song} onPlay={() => player.playFromQueue(entry.key)}>
              <button
                className="link"
                onClick={() => player.moveInQueue(entry.key, -1)}
                disabled={i === 0}
                title="Move up"
              >
                ↑
              </button>
              <button
                className="link"
                onClick={() => player.moveInQueue(entry.key, 1)}
                disabled={i === manualQueue.length - 1}
                title="Move down"
              >
                ↓
              </button>
              <button className="link danger" onClick={() => player.removeFromQueue(entry.key)} title="Remove from queue">
                ✕
              </button>
            </QueueItem>
          ))}
        </section>
      )}

      {upNext.length > 0 && (
        <section>
          <div className="section-heading">
            <h3>Next from: {contextName}</h3>
            {isShuffled && <span className="muted small">Shuffled</span>}
          </div>
          {upNext.map((entry) => (
            <QueueItem key={entry.key} song={entry.song} onPlay={() => player.playFromQueue(entry.key)} />
          ))}
        </section>
      )}

      {nothingQueued && <p className="muted">No songs queued.</p>}
    </aside>
  );
}

// One compact row. `children` are the action buttons (only queued songs have them).
function QueueItem({ song, current, onPlay, children }) {
  return (
    <div className={`queue-item ${current ? "current" : ""}`}>
      <button className="queue-item-main" onClick={onPlay} disabled={!onPlay} title={onPlay ? "Play" : undefined}>
        {song.cover_url ? <img className="cover" src={song.cover_url} alt="" /> : <div className="cover placeholder">♪</div>}
        <span className="queue-item-text">
          <span className="title">{song.title}</span>
          <span className="muted small">{song.artist || "Unknown artist"}</span>
        </span>
      </button>
      {children && <span className="queue-item-actions">{children}</span>}
    </div>
  );
}
