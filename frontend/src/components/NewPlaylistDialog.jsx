import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// An in-app dialog for naming a new playlist, instead of the browser's prompt box.
// onCreate(name) throws on failure; the error is shown here so the name can be fixed and tried again.
export default function NewPlaylistDialog({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(name.trim()); // on success the dialog is closed (unmounted) by the caller
    } catch (err) {
      setError(`Could not create playlist: ${err.message}`);
      setBusy(false);
    }
  }

  return createPortal(
    // pointerdown rather than click, so a text selection dragged out of the box doesn't close it.
    <div className="dialog-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="dialog" onSubmit={handleSubmit} role="dialog" aria-modal="true" aria-labelledby="new-playlist-title">
        <h2 id="new-playlist-title">New playlist</h2>
        <input
          className="dialog-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          maxLength={100}
          autoFocus
        />
        {error && <p className="error small">{error}</p>}
        <div className="dialog-actions">
          <button className="link" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="button" type="submit" disabled={busy || !name.trim()}>
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
