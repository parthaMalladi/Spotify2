# Personal Music Player

A locally hosted music player: Django + DRF backend (`backend/`), React + Vite frontend (`frontend/`), audio files stored in `song_files/`.

Everything runs on your own machine. It isn't deployed anywhere, has no accounts, and only accepts connections from `localhost` / `127.0.0.1`.

## Features

- **Upload** mp3, m4a/aac and opus files (up to 200 MB each, several at once). Title, artist, album, length and cover art are read from the file's tags; the filename is used as the title when there are no tags (common for raw `.aac`). Files that can't be read as audio are rejected.
- **Library:** every song, newest first. Deleting a song removes its audio and cover files too, and takes it out of any playlists.
- **Playlists:** create, rename/describe, delete (the songs stay in the library), add songs, remove songs, reorder with ↑/↓.
- **Search** songs by title, artist or album, and playlists by name, from the box at the top of the sidebar.
- **Queue** (always visible on the right):
  - *Next in queue*: songs you add with **Add to queue** play right after the current song, in the order added. You can reorder, remove or clear them. Right-click a playlist in the sidebar (or use **Add to queue** on its page) to queue the whole playlist.
  - *Next from: …*: the rest of the playlist, library or search results you started playing. It carries on once the manual queue is used up.
- **Shuffle** plays every song of the current playlist/library once in random order. Turning it off goes back to the original order without interrupting the current song. The manual queue is never shuffled.
- **Loop:** off → loop the whole list → loop the current song (shown by a "1" badge).
- **Player bar:** play/pause, previous/next, seek (drag the progress bar), volume. It keeps playing while you move between pages.

## Using the app

- **Play:** click a song's cover (or double-click its row). The list it's in (Library, a playlist or search results) becomes "Next from".
- **Queue a song:** **Add to queue** on any row. **Queue a playlist:** right-click it in the sidebar → **Add playlist to queue**.
- **Add to a playlist:** the **Add to playlist…** dropdown on Library and search rows. Create playlists with **+ New** in the sidebar.
- **Previous** restarts the current song if it's more than 3 seconds in; press it again to go back a song.

## First-time setup

Backend (PowerShell, from `backend/`):

```powershell
python -m venv .venv          # only if .venv doesn't exist yet
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
```

Frontend (from `frontend/`):

```powershell
npm install
```

## Running

Backend, from `backend/` (http://localhost:8000):

```powershell
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

Frontend, from `frontend/` (http://localhost:5173):

```powershell
npm run dev
```

The frontend talks to `http://localhost:8000` by default. To change that, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`.

## Database changes

After changing models in `backend/library/models.py`, from `backend/` with the venv active:

```powershell
python manage.py makemigrations library
python manage.py migrate
```

## Project layout

```
backend/
  config/              Django settings and root URLs
  library/
    models.py          Song, Playlist, PlaylistSong
    metadata.py        Reads tags and cover art with Mutagen
    streaming.py       Audio streaming with HTTP Range support (for seeking)
    views.py, urls.py  The REST API
frontend/src/
  api.js               All calls to the backend
  player/              PlayerProvider: the <audio> element, queue, shuffle and loop
  pages/               Library, Playlist and Search pages
  components/          Sidebar, song table, queue panel, player bar, etc.
  index.css            All styles (colour palette at the top)
song_files/            Uploaded audio (audio/) and cover art (covers/). Git-ignored.
```

## API

| Method | URL | Purpose |
| --- | --- | --- |
| GET | `/api/songs/` | List all songs |
| POST | `/api/songs/` | Upload a song (multipart, field `file`; mp3/m4a/aac/opus, max 200 MB) |
| GET | `/api/songs/<id>/` | One song |
| DELETE | `/api/songs/<id>/` | Delete a song and its audio/cover files |
| GET | `/api/songs/<id>/stream/` | Stream the audio (supports HTTP Range, so seeking works) |
| GET | `/api/playlists/` | List playlists (with `song_count`) |
| POST | `/api/playlists/` | Create a playlist (`{name, description?}`) |
| GET | `/api/playlists/<id>/` | One playlist, with its `songs` in order |
| PATCH | `/api/playlists/<id>/` | Rename / edit description |
| DELETE | `/api/playlists/<id>/` | Delete a playlist (its songs stay in the library) |
| POST | `/api/playlists/<id>/songs/` | Add a song to the end (`{song_id}`) |
| DELETE | `/api/playlists/<id>/songs/<song_id>/` | Remove a song from the playlist |
| PUT | `/api/playlists/<id>/order/` | Reorder (`{song_ids: [...]}`, must list exactly the playlist's songs) |
| GET | `/api/search/?q=...` | Songs matching title/artist/album and playlists matching name (case-insensitive) |

Each song in the API includes a `stream_url` (what the player plays) and a `format` (`mp3`, `m4a`, `aac` or `opus`).

## Browser format support

Not every browser plays every format. Opus in particular may fail in Safari, and raw `.aac` seeking can be approximate. If a song can't be played, the player bar shows a message naming the format. Nothing is transcoded.

## Notes

- **Your music lives in `song_files/` and the song list in `backend/db.sqlite3`.** Both are git-ignored, so back them up together if you care about your library. Add and remove songs only through the app, not by editing `song_files/` directly.
- The `SECRET_KEY` in `backend/config/settings.py` is Django's insecure development placeholder. That's fine for a local-only app. If you ever publish the repo or deploy, move it to a git-ignored `.env` first.
- Search ignores case only for plain English letters (a SQLite limitation), so accented letters must match case.
