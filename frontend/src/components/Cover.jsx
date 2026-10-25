// A song's cover art, or a ♪ placeholder when it has none (or no song is loaded). The size comes from CSS.
export default function Cover({ song, className = "" }) {
  if (song?.cover_url) return <img className={`cover ${className}`} src={song.cover_url} alt="" />;
  return <div className={`cover placeholder ${className}`}>♪</div>;
}
