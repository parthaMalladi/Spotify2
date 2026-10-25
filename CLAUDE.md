# Personal Music Player

A locally hosted music player for personal use. I upload audio files (mp3, aac/m4a, opus), organize them into playlists, search my library, build a play queue, and play with shuffle. Everything runs on my own machine. It is not deployed anywhere and has no cloud component.

**Keep it simple.** This is a small personal project. Prefer the plain, obvious solution over anything clever or "scalable". Do not add features, services, or dependencies I haven't asked for beyond what the work genuinely needs.

## Stack

- **Backend:** Django 6.1 + Django REST Framework + django-cors-headers, in `backend/`. The Django project package is named `config`.
- **Database:** Django's built-in SQLite (`backend/db.sqlite3`)
- **Frontend:** React + Vite, in `frontend/` (check the project to see whether it uses TypeScript or JavaScript, and follow that)
- **Audio storage:** plain files on disk in `song_files/` (project root, next to `backend/` and `frontend/`)
- **Metadata:** Mutagen, to read embedded tags (title, artist, album, duration, cover art)

## Folder layout

```
music-player/
├── backend/        Django project (settings in backend/config/)
├── frontend/       React + Vite app
├── song_files/     Uploaded audio files and cover art (git-ignored, never edit by hand)
├── CLAUDE.md
└── README.md
```

## Current state (already done, don't redo)

- Django project `config` exists with REST Framework and `corsheaders` installed and added to `INSTALLED_APPS` and middleware.
- CORS is configured with `CORS_ALLOWED_ORIGINS` containing `http://localhost:5173`. Add `http://127.0.0.1:5173` too if needed. Do not replace this with a proxy setup.
- SQLite database is configured (the default).
- The Vite React frontend is scaffolded.
- Still to do: no Django app for songs/playlists yet, `MEDIA_ROOT`/`MEDIA_URL` are not set, no API URLs yet, and the frontend is still the Vite starter.

## Running things

- Backend: activate the backend virtual environment (expected at `backend/.venv`), then run the Django dev server from `backend/` on port 8000.
- Frontend: run the Vite dev server from `frontend/` on port 5173.
- The frontend reads the API base URL from a Vite environment variable (`VITE_API_BASE_URL`), defaulting to `http://localhost:8000`. Don't scatter hard-coded URLs through components. Keep API calls in one small module.
- Keep the commands for running and migrating in the README as they get established. Keep `backend/requirements.txt` up to date as packages are added.

## Features

1. **Upload songs** (mp3, aac/m4a, opus). On upload, extract title, artist, album, duration, and cover art from the file's tags. Fall back to the filename if tags are missing. Raw `.aac` files often have no tags, so expect the fallback there. Reject files Mutagen cannot parse.
2. **Library:** list all songs, and delete a song (this removes both the database record and the audio/cover files from `song_files/`).
3. **Playlists:** create, rename, delete. Add and remove songs, and reorder songs within a playlist. A song can be in many playlists. Deleting a playlist never deletes its songs.
4. **Search** across songs (title, artist, album) and playlists (name). Simple case-insensitive database queries are enough.
5. **Play queue:** a single "Add to queue" action (no separate "play next"). Queued songs play right after the current song, in the order added, before the playlist/library continues. Queue songs can be removed, reordered and cleared. A whole playlist can be added to the queue (all its songs appended in playlist order), from the playlist page or by right-clicking the playlist in the sidebar.
6. **Shuffle:** play every song once in random order (a real shuffle of a copy of the playlist/library being played, not repeated random picks; the manual queue is never shuffled). Turning shuffle off restores the original order without interrupting the current song.
7. **Playback controls:** play, pause, next, previous, seek, volume. The player bar stays mounted while navigating between pages.

## Data model

- **Song:** title, artist, album, duration, audio file, optional cover art, upload date
- **Playlist:** name, optional description, created date
- **PlaylistSong:** links a playlist to a song and stores `position`, so order is stable and a song can appear in several playlists

Put these in a single Django app (for example `library`) inside `backend/`.

## Architecture rules

- **Queue and shuffle live in the frontend** (in React state). The backend only knows about songs and playlists.
- **File storage:** set `MEDIA_ROOT` to the `song_files/` folder at the project root (one level above `backend/`, so `BASE_DIR.parent / "song_files"`). Use Django `FileField`/`ImageField` for all audio and cover art, with audio under an `audio/` subfolder and covers under a `covers/` subfolder. Store only the relative path in the database. Save files under generated unique names (not the user's original filename) to avoid collisions and unsafe characters.
- **The API returns a playable URL for each song.** The frontend never builds media URLs itself.
- **Streaming must support HTTP Range requests**, so seeking works. Django's default static/media serving does not reliably do this, so implement or add a small streaming view so that dragging the progress bar mid-song works.
- **Format support varies by browser** (Opus in particular, notably in Safari). If a format won't play, tell me. Don't silently add transcoding.
- Metadata extraction runs synchronously during the upload request. No background workers.
- Use Django migrations for every schema change. Never edit the database by hand.

## Security basics (local, but still be sensible)

- Validate uploaded file type and parse it before accepting it. Cap upload size at something reasonable.
- `ALLOWED_HOSTS` is `localhost`, `127.0.0.1` and `.trycloudflare.com` (the tunnel). The server only listens on `127.0.0.1`; other machines reach it only through the tunnel.
- `SECRET_KEY` and `DEBUG` come from the git-ignored `backend/.env` (template: `backend/.env.example`). Never put a key in settings or commit `.env`.

## Out of scope (do not add unless I ask)

Docker, PostgreSQL, Celery or any task queue, cloud storage, transcoding, and social or sharing features. (YouTube download, and later accounts plus online access through a Cloudflare tunnel, were requested and added; see the decisions log.)

## How to work with me

- **Make the changes directly in my files.** You don't need to ask me to approve a plan first.
- **Work in stages**, in this order, and stop after each one:
  1. Songs app, `MEDIA_ROOT`, Song model, upload with metadata extraction, song list, and delete
  2. Audio streaming with seek support, and the player bar
  3. Playlists
  4. Queue and shuffle
  5. Search
  6. Polish and README
- **At the end of each stage**, give me a short summary: what you built, the exact commands to start both servers, and what I should try in the browser to check it. I test by using the app myself, so don't write automated tests unless I ask.
- **Don't start the next stage until I say "continue."**
- Install any packages the work needs and tell me what you added.
- Keep code simple and readable, with comments only where the reason isn't obvious.
- Never read, modify, or delete anything inside `song_files/` except through the app's own upload and delete code paths. The only file you may create there by hand is `.gitkeep`.
- Do not run git commits or pushes. I handle git myself.
- When we make a decision (library choice, naming, behavior), add it to this file so it carries into future sessions.

## Decisions log

- **Stage 1 done.** Django app is `library` (`backend/library/`). Frontend is plain JavaScript (`.jsx`), no router yet.
- Cover art uses a `FileField` (not `ImageField`), so Pillow isn't needed. Covers are only ever extracted from tags by our code, never uploaded directly; only embedded JPEG/PNG covers are kept.
- Metadata extraction lives in `backend/library/metadata.py`. Each extension maps to exactly one Mutagen class (`.mp3`→MP3, `.m4a`→MP4, `.aac`→AAC, `.opus`→OggOpus). Using the class for the extension, instead of `mutagen.File()` auto-detection, rejects files whose content doesn't match the extension and stops raw ADTS `.aac` being mis-detected as MP3.
- Upload limit is `MAX_UPLOAD_SIZE` in settings (200 MB), checked in the upload view. One file per request; the frontend uploads multiple files one after another.
- DRF has `DEFAULT_AUTHENTICATION_CLASSES = []` because there are no accounts. As a side effect, the API has no CSRF checks.
- Covers are served from `/media/` via Django's `static()` helper (works in dev only, which is all we use). Audio streaming gets its own Range-capable view in stage 2.
- Songs are listed newest first. Song API fields: `id, title, artist, album, duration (seconds, float), cover_url (absolute or null), uploaded_at`.
- All API calls go through `frontend/src/api.js`.
- **Stage 2 done.** Streaming is a hand-written view in `backend/library/streaming.py` at `/api/songs/<id>/stream/` (Django's `FileResponse` has no Range support). It honours a single `bytes=` range and returns 206/416. The song API now also returns `stream_url` and `format` (file extension).
- Player state lives in `frontend/src/player/PlayerProvider.jsx`, which wraps `<App />` in `main.jsx` and owns the single `<audio>` element. Components use `usePlayer()` from `player/PlayerContext.js`. `playSongs(list, index, contextName)` plays a Library/playlist list (the "context"). Songs are loaded from the action that changes them (`playAt`), not from an effect.
- Player behaviour: "previous" restarts the song if more than 3 s in, otherwise goes back one. The progress bar seeks on release, not while dragging. The displayed duration falls back to the tagged `duration` when the browser can't report one (common for raw AAC). Unplayable formats show an error in the player bar naming the format.
- **Stage 3 done.** `Playlist` + `PlaylistSong(position)` models. A song can appear at most once per playlist (unique constraint), so reordering is done by sending the full list of song ids. Playlists are listed by name. Deleting a song removes it from all playlists; deleting a playlist never deletes songs.
- Frontend navigation is in-memory state in `App.jsx` (`{name: "library"}` or `{name: "playlist", id}`), with no router library. Layout: sidebar (Library + playlists) | page | fixed player bar. Pages live in `frontend/src/pages/`. `SongList` is shared and takes an `actions(song, index)` render prop for the per-page buttons. Songs are added to playlists from a per-row "Add to playlist…" dropdown in the Library, and reordered with ↑/↓ buttons.
- **Loop modes (user-requested addition):** a player-bar button cycles off → all → one. "All" wraps from the last song to the first (and Previous wraps from the first to the last). "One" uses the `<audio loop>` attribute; Next/Previous still change song. In stage 4, "the list" becomes the queue.
- **Stage 4 done (queue reworked at the user's request).** `PlayerProvider` keeps two separate blocks, Spotify-style: (1) the **manual queue**, songs added with "Add to queue", appended to the end and always played next, in order; (2) the **context**, the Library or playlist you started playing (`contextEntries` in original order, plus `shuffled`, a Fisher–Yates copy or null). When the manual queue is empty, playback continues in the context after the last context song played (`contextKey`). Entries are `{key, song}` with unique keys. Positions are tracked by key, so toggling shuffle never interrupts the current song.
- Queue behaviour: shuffle and loop-all affect only the context, never the manual queue. Shuffle on puts the current context song first, then every other context song once in random order; shuffle off continues the original order from there. Playing from the Library or a playlist replaces the context but keeps the manual queue. Queued songs are consumed as they play. Clicking a queued song in the queue panel skips the queued songs before it. Previous from a queued song goes back to the context song that played before it. Remove/reorder/clear apply to the manual queue only; context order comes from the playlist (or shuffle). The queue is an always-visible panel on the right (`components/QueuePanel.jsx`, compact rows, not the SongList table) showing Now playing, "Next in queue" (only when it has songs) and "Next from: <name>", or "No songs queued." when nothing is up next. There is no Queue page or sidebar entry. Layout: sidebar | page | queue panel, with the player bar fixed along the bottom.
- Shuffle and loop buttons use SVG icons (`components/icons.jsx`) so CSS can colour them. Loop-one adds a solid "1" badge (the user found the 🔂 emoji too small to read).
- **Stage 5 done.** Search is one endpoint, `GET /api/search/?q=` → `{songs, playlists}`, using `icontains` on song title/artist/album and playlist name (a blank query returns empty lists). SQLite's case-insensitive matching only covers ASCII letters, which is accepted. Frontend: a search box at the top of the sidebar navigates to `{name: "search", query}`. `SearchPage` waits 250 ms after typing stops before querying and ignores stale responses. Results show playlists (click to open) then songs. Playing a song from results uses the results as the context ("Next from: Search: “q”"). The "Add to playlist…" dropdown is a shared component (`AddToPlaylistSelect`) used by Library and Search.
- **Add playlist to queue (user-requested addition):** `addSongsToQueue(songs)` in `PlayerProvider` appends to the manual queue. It's offered by an "Add to queue" button on the playlist page and by a right-click menu on sidebar playlists (`components/ContextMenu.jsx`, a small reusable menu that closes on outside click, Escape, scroll or resize; it renders through a portal into `<body>` because the sticky sidebar traps `z-index`, which let the song table cover it). The sidebar fetches the playlist's songs before adding. Empty playlists show the option disabled.
- **Stage 6 (polish) done.** Colour theme: **black background with one main colour, purple `#42068f`**. The user tried and rejected a five-colour palette with Night Bordeaux, then Dark Spruce; don't bring those back. Purple is 1.6:1 on black, so it's never text on black. It fills highlighted surfaces with near-white text on top (11.5:1): player bar, selected sidebar item, now-playing rows, primary buttons (with a `#6b3fc0` outline so they stand out on black), menu hover, and the play button/"1" badge icon colour. Supporting shades: text `#f5f3fa`, muted lavender grey `#a8a1b8`, accent lavender `#b794ff` (success, focus), secondary text on purple `#cdbdf0`, surfaces `#17141f`/`#2a2338`, purple hover `#5212ad`, danger `#ff6b81` (`#ffb8c4` on the purple bar). All text pairs are ≥ 4.5:1. Palette variables are at the top of `index.css`; use them rather than new hex values.
- Layout polish: sidebar is 260px wide. In the song table the cover, length and action columns use `.shrink` (width 1%), so spare width goes to title/artist/album and the action buttons sit right next to Length.
- Removed the scaffold `config/views.py` / `/api/hello/` demo endpoint, plus the Vite starter `App.css` and `src/assets/`.
- **YouTube download (user-requested addition):** paste a link on the Library page → `POST /api/songs/youtube/ {url}`. `backend/library/youtube.py` uses **yt-dlp** (`yt-dlp[default]` in requirements) with format `bestaudio[ext=m4a]`: YouTube's own AAC, **never transcoded** (the user chose AAC over MP3). It looks the video up first and rejects videos over **30 minutes** (`MAX_DURATION`), live streams and playlist links before downloading anything. Only youtube.com / youtu.be / music.youtube.com links, one video (`noplaylist`), `max_filesize = MAX_UPLOAD_SIZE`. It downloads into a temp folder, then goes through the normal `extract_metadata` + save path (`_save_song` in `views.py`). Title/artist/album come from the video info (`track`/`artist`/`album` when YouTube Music has them, else video title and channel, with " - Topic" stripped). The best JPEG thumbnail becomes the cover. Synchronous like uploads (no workers).
- yt-dlp needs a JS runtime for YouTube; `js_runtimes` allows Deno or Node (the user has Node, not Deno). ffmpeg isn't installed: yt-dlp warns about "DASH m4a" but the files parse and play. Installing ffmpeg would only remux, never re-encode. When YouTube breaks things, the fix is `pip install -U "yt-dlp[default]"`.
- Frontend: `YouTubeImportForm` on the Library page. The download state lives in `App.jsx` (`youtubeImport`), so it keeps going and still reports back if the user changes page. While downloading, the form and the sidebar "Library" item show a spinner. When it finishes, the song is prepended to the Library, the form shows a done/failed message, and the sidebar shows "New song"/"Download failed" until the user visits the Library. One download at a time.
- **Online access (built).** The PC stays the server, reached through a free **Cloudflare quick tunnel** (random `*.trycloudflare.com` URL that changes each time it starts; no domain, no Cloudflare account). Accounts with Django session login: exactly **one admin** (superuser, created with `createsuperuser`) who can upload, YouTube-download and delete songs. Every other user is created by the admin in Django's `/admin/` page (no self sign-up). They can log in, browse/search and stream all songs, and create/rename/delete their own **private** playlists from existing songs only. No download button for anyone (streaming inherently sends the file, which the user accepted). Playlists get an `owner`; existing playlists go to the admin. Deleting a song removes it from everyone's playlists. Admin is identified by login, never by "request comes from localhost" (tunnel traffic arrives from localhost). Planned parts: (1) accounts and permissions, (2) production serving (Django serves the built frontend, waitress, whitenoise, `DEBUG=False`, `.env`), (3) tunnel. Large uploads / long YouTube downloads are done at home on localhost to avoid Cloudflare's upload and timeout limits.
- How online access was built:
  - **Auth:** DRF `SessionAuthentication` + `IsAuthenticated` by default (this replaced `DEFAULT_AUTHENTICATION_CLASSES = []`, so CSRF is enforced again). Endpoints are `/api/auth/session/`, `login/` and `logout/` in `library/auth_views.py`. Each returns `{user: {username, is_admin} | null, csrf_token}`. `api.js` keeps the token and sends `X-CSRFToken` on non-GET requests, with `credentials: "include"`. "Admin" means `is_superuser` (`library/permissions.py`: `IsAdmin`, `IsAdminOrReadOnly`). Login is throttled to 10/minute per IP (DRF `LoginThrottle`, LocMem cache). `/admin/` login is not throttled.
  - **Playlists:** `Playlist.owner` FK (CASCADE). Migration `0003` gives existing playlists to the first superuser and refuses to run if there's none (run `createsuperuser` first). All playlist views and search filter by `owner=request.user`, so other people's playlists return 404.
  - **Files:** stream and cover views (`library/streaming.py`, `/api/songs/<id>/stream/` and `/cover/`) require login. `song_files/` is never served directly (the `static()` media route was removed). `cover_url` now points at the cover view.
  - **Frontend:** `App.jsx` checks the session first and shows `pages/LoginPage.jsx` or `MusicApp`. The sidebar footer shows the username, "Manage users" (admin only, opens `/admin/`) and "Log out" (which reloads the page so playback and state reset). Upload, YouTube and Delete are only rendered for the admin. In dev, `api.js` uses `VITE_API_BASE_URL` (default `http://localhost:8000`). In a production build it uses `""` (same origin). Dev must use `localhost:5173`, not `127.0.0.1:5173` (cookies are same-site only).
  - **Production serving:** `python serve.py` (waitress, `127.0.0.1:8000`, 16 threads). WhiteNoise serves `STATIC_ROOT` (`backend/staticfiles`, from `collectstatic`) and the built frontend via `WHITENOISE_ROOT = frontend/dist` + `WHITENOISE_INDEX_FILE`. It scans the folder at startup, so restart after `npm run build`. waitress trusts `X-Forwarded-For`/`X-Forwarded-Proto` only from `127.0.0.1` (cloudflared), so `request.is_secure()` and the client IP are correct behind the tunnel. Without that, waitress strips them. Django's `SECURE_PROXY_SSL_HEADER`/DRF `NUM_PROXIES` aren't used. `CSRF_TRUSTED_ORIGINS` includes `https://*.trycloudflare.com` and the Vite dev origins. Session/CSRF cookies are `Secure` when `DEBUG` is off (browsers accept that on http://localhost).
  - **Tunnel:** `cloudflared tunnel --url http://127.0.0.1:8000` (cloudflared installed by the user with winget; use 127.0.0.1, not localhost, because waitress listens on IPv4 only).
  - New packages: `waitress`, `whitenoise`, `python-dotenv`.
