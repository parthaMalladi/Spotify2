import { useState } from "react";
import { logIn } from "../api";

// Shown instead of the app until someone logs in. Accounts are created by the admin in Django's admin site.
export default function LoginPage({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLoggedIn(await logIn(username, password));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>Music Player</h1>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="button" type="submit" disabled={busy || !username || !password}>
          {busy ? "Logging in…" : "Log in"}
        </button>
        <p className="muted small">Ask the owner of this player for an account.</p>
      </form>
    </main>
  );
}
