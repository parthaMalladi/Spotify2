import { LibraryIcon, PlaylistsIcon, QueueIcon, SearchIcon } from "./icons";

const TABS = [
  { name: "library", label: "Library", Icon: LibraryIcon },
  { name: "search", label: "Search", Icon: SearchIcon },
  { name: "playlists", label: "Playlists", Icon: PlaylistsIcon },
  { name: "queue", label: "Queue", Icon: QueueIcon },
];

// Phones: the tab bar along the bottom, in place of the sidebar.
export default function MobileTabBar({ page, onNavigate, youtubeImport, youtubeUnseen }) {
  // An open playlist counts as being inside the Playlists tab.
  const activeTab = page.name === "playlist" ? "playlists" : page.name;

  function handleClick(name) {
    if (page.name === name) return; // already there (and keeps the search text when tapping Search again)
    onNavigate(name === "search" ? { name, query: "" } : { name });
  }

  return (
    <nav className="tab-bar">
      {TABS.map(({ name, label, Icon }) => (
        <button
          key={name}
          className={`tab ${activeTab === name ? "active" : ""}`}
          onClick={() => handleClick(name)}
          aria-current={activeTab === name ? "page" : undefined}
        >
          <span className="tab-icon">
            <Icon />
            {name === "library" && <YouTubeDot status={youtubeImport} unseen={youtubeUnseen && page.name !== "library"} />}
          </span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// The phone version of the sidebar's YouTube badge: a spinner while downloading, then a dot until the Library is visited.
function YouTubeDot({ status, unseen }) {
  if (status?.state === "downloading") return <span className="spinner" title="Downloading from YouTube" />;
  if (!unseen) return null;
  if (status?.state === "error") return <span className="tab-dot error" title="Download failed" />;
  return <span className="tab-dot" title="New song" />;
}
