import { useState } from "react";

// Paste a YouTube link to add its audio to the library. The download itself runs in App so it
// keeps going (and still reports back) if you switch pages while it's in progress.
export default function YouTubeImportForm({ status, onImport }) {
  const [url, setUrl] = useState("");
  const downloading = status?.state === "downloading";

  async function handleSubmit(event) {
    event.preventDefault();
    if (!url.trim() || downloading) return;
    const ok = await onImport(url.trim());
    if (ok) setUrl("");
  }

  return (
    <form className="youtube-import" onSubmit={handleSubmit}>
      <input
        className="youtube-url"
        type="url"
        placeholder="Paste a YouTube link (max 30 minutes)"
        value={url}
        disabled={downloading}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button className="button" type="submit" disabled={downloading || !url.trim()}>
        {downloading ? "Downloading…" : "Download"}
      </button>
      {downloading && (
        <p className="youtube-status">
          <span className="spinner" aria-hidden="true" /> Downloading audio from YouTube. This can take a minute for long
          videos.
        </p>
      )}
      {status?.state === "done" && <p className="youtube-status success">{status.text}</p>}
      {status?.state === "error" && <p className="youtube-status error">{status.text}</p>}
    </form>
  );
}
