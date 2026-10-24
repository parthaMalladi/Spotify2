import { useState } from "react";
import { uploadSong } from "../api";

const ACCEPT = ".mp3,.m4a,.aac,.opus";

// Uploads the chosen files one at a time and reports the result for each.
export default function UploadForm({ onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState([]);

  async function handleChange(event) {
    const files = Array.from(event.target.files);
    event.target.value = ""; // allow picking the same file again later
    if (files.length === 0) return;

    setBusy(true);
    setResults([]);
    for (const file of files) {
      try {
        const song = await uploadSong(file);
        setResults((r) => [...r, { name: file.name, ok: true, message: `Added "${song.title}"` }]);
        onUploaded(song);
      } catch (err) {
        setResults((r) => [...r, { name: file.name, ok: false, message: err.message }]);
      }
    }
    setBusy(false);
  }

  return (
    <section className="upload">
      <label className={`button ${busy ? "disabled" : ""}`}>
        {busy ? "Uploading…" : "Upload songs"}
        <input type="file" accept={ACCEPT} multiple hidden disabled={busy} onChange={handleChange} />
      </label>
      <span className="hint">mp3, m4a, aac, opus</span>
      {results.length > 0 && (
        <ul className="upload-results">
          {results.map((r, i) => (
            <li key={i} className={r.ok ? "ok" : "error"}>
              <strong>{r.name}:</strong> {r.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
