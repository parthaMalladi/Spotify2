import { ADMIN_URL } from "../api";

// Who's logged in, plus "Manage users" (admin only) and "Log out". At the bottom of the sidebar on
// desktops, and of the Playlists tab on phones.
export default function AccountInfo({ user, onLogOut }) {
  return (
    <div className="account">
      <span className="muted small">
        Logged in as <strong>{user.username}</strong>
      </span>
      <div className="account-actions">
        {user.is_admin && (
          <a className="link" href={ADMIN_URL} target="_blank" rel="noreferrer">
            Manage users
          </a>
        )}
        <button className="link" onClick={onLogOut}>
          Log out
        </button>
      </div>
    </div>
  );
}
