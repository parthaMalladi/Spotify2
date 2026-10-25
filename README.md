# Personal Music Player

A locally hosted music player: Django + DRF backend (`backend/`), React + Vite frontend (`frontend/`), audio files stored in `song_files/`.

Everything runs on your own machine. Other people reach it through a free [Cloudflare quick tunnel](#going-online-cloudflare-tunnel) and log in with accounts you create. The server itself only accepts connections from this machine (`127.0.0.1`).

## Accounts

- **One admin** (you): a Django superuser. Only the admin can upload songs, download from YouTube and delete songs.
- **Everyone else** gets an account you create on Django's admin page (`/admin/` → Users → Add user). There's no sign-up page. They can log in, browse, search and play every song, and make their own playlists from songs already in the library.
- **Playlists are private.** Each person only sees their own. Deleting a song takes it out of everyone's playlists. Deleting a user deletes their playlists (not songs).
- Songs can be streamed but there's no download button.
- Logging in is limited to 10 attempts a minute per visitor, to slow down password guessing on `/api/auth/login/`. The `/admin/` login page doesn't have this limit, so give every account a strong password.

## Features

- **Upload** mp3, m4a/aac and opus files (up to 200 MB each, several at once). Title, artist, album, length and cover art are read from the file's tags; the filename is used as the title when there are no tags (common for raw `.aac`). Files that can't be read as audio are rejected.
- **Download from YouTube:** paste a YouTube link on the Library page and press **Download**. The audio is saved in YouTube's own AAC format (`.m4a`, no conversion). Videos over 30 minutes, live streams and playlist-only links are rejected. A spinner shows while it downloads, also next to "Library" in the sidebar if you switch pages, and a message tells you when the song is in your Library. YouTube audio has no tags, so the title is the video title, the artist is the channel name and the cover is the video thumbnail. YouTube Music links usually give proper track/artist/album details.
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

Commands are for Git Bash (the VS Code terminal). In PowerShell, activate the venv with `.\.venv\Scripts\Activate.ps1` instead of `source .venv/Scripts/activate`.

Backend, from `backend/`:

```bash
python -m venv .venv          # only if .venv doesn't exist yet
source .venv/Scripts/activate
pip install -r requirements.txt
cp .env.example .env          # then put a real SECRET_KEY in .env (see below)
python manage.py createsuperuser   # your admin account (if no prompt appears: winpty python manage.py createsuperuser)
python manage.py migrate
```

`backend/.env` (git-ignored) holds `SECRET_KEY` and `DEBUG`. Make a key with:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Create the admin with `createsuperuser` **before** running `migrate` when you already have playlists: the migration that makes playlists private hands the existing ones to the admin, and stops with a message if there isn't one yet.

Frontend (from `frontend/`):

```bash
npm install
```

### YouTube downloads

YouTube downloads use [yt-dlp](https://github.com/yt-dlp/yt-dlp) (installed by `requirements.txt`). It also needs a JavaScript runtime to unlock YouTube's streams. Node.js (already needed for the frontend) works, and so does Deno. Two more notes:

- **When downloads start failing**, YouTube has usually changed something. Update yt-dlp from `backend/` with the venv active: `pip install -U "yt-dlp[default]"`, then `pip freeze > requirements.txt`.
- **ffmpeg is optional.** Without it yt-dlp warns that it's "writing DASH m4a"; the files still parse fine and should play in Chrome, Edge and Firefox. With ffmpeg installed (`winget install ffmpeg`), yt-dlp repackages the file into a standard m4a without re-encoding.

## Running for development

Set `DEBUG=True` in `backend/.env` while developing.

Backend, from `backend/` (http://localhost:8000):

```bash
source .venv/Scripts/activate
python manage.py runserver 8000
```

Frontend, from `frontend/`. Open **http://localhost:5173** (not `127.0.0.1:5173`, where the browser won't send the login cookie to `localhost:8000`):

```bash
npm run dev
```

The dev frontend talks to `http://localhost:8000` by default. To change that, copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL`. The production build ignores it and always talks to the server it was loaded from.

## Running for real (at home and online)

Here Django serves everything on one address: the built frontend, the API, and the admin page. It runs on [waitress](https://docs.pylonsproject.org/projects/waitress/) instead of the dev server. Make sure `DEBUG=False` in `backend/.env`.

1. Build the frontend (again after every frontend change), from `frontend/`:

   ```bash
   npm run build
   ```

2. Collect the admin page's CSS/JS (once, and again after upgrading Django), then start the server, from `backend/`:

   ```bash
   source .venv/Scripts/activate
   python manage.py collectstatic --noinput
   python serve.py
   ```

   It prints "Music player running at http://localhost:8000" and then stays quiet while it serves; that's normal, leave it running. The app is now at **http://localhost:8000**, and the admin page is at http://localhost:8000/admin/. It only accepts connections from this PC. Stop it with Ctrl+C. `serve.py` reads the frontend build when it starts, so restart it after `npm run build`.

### Going online (Cloudflare tunnel)

A Cloudflare quick tunnel gives the app a public `https://<random words>.trycloudflare.com` address. You don't need a Cloudflare account or a domain. The address changes every time you start the tunnel, so send people the new link each time.

1. Install cloudflared once: `winget install --id Cloudflare.cloudflared`. Then restart VS Code (not just the terminal) so `cloudflared` is found. Until then, run it by its full path: `"/c/Program Files (x86)/cloudflared/cloudflared.exe"`.
2. With `python serve.py` running, in another terminal:

   ```bash
   cloudflared tunnel --url http://127.0.0.1:8000
   ```

3. It prints the `https://….trycloudflare.com` address. Open it, log in, and share it. Ctrl+C takes the app offline again.

Notes:

- **Make accounts** at `<address>/admin/` (or http://localhost:8000/admin/): Users → Add user → username and password → Save. Leave "Staff status" and "Superuser status" unticked. To remove someone, delete or deactivate (untick "Active") their user.
- **Upload and YouTube-download at home** on http://localhost:8000. Cloudflare limits uploads to 100 MB and cuts off requests that take longer than about 100 seconds, which long YouTube downloads can hit.
- The tunnel only runs while your PC is on, awake, and both commands are running.

## Database changes

After changing models in `backend/library/models.py`, from `backend/` with the venv active:

```bash
python manage.py makemigrations library
python manage.py migrate
```

## Project layout

```
backend/
  .env                 SECRET_KEY and DEBUG (git-ignored; copy from .env.example)
  serve.py             Runs the app with waitress for real use
  config/              Django settings and root URLs
  library/
    auth_views.py      Log in / log out
    permissions.py     Who may do what (admin vs. everyone)
    models.py          Song, Playlist, PlaylistSong
    metadata.py        Reads tags and cover art with Mutagen
    streaming.py       Audio streaming with HTTP Range support (for seeking), and cover art
    youtube.py         Downloads a YouTube video's audio with yt-dlp
    views.py, urls.py  The REST API
frontend/src/
  api.js               All calls to the backend
  player/              PlayerProvider: the <audio> element, queue, shuffle and loop
  pages/               Login, Library, Playlist and Search pages
  components/          Sidebar, song table, queue panel, player bar, etc.
  index.css            All styles (colour palette at the top)
song_files/            Uploaded audio (audio/) and cover art (covers/). Git-ignored.
```

## API

Everything except the `auth/` endpoints needs a logged-in session. Requests that change something need the `X-CSRFToken` header (the token comes from the `auth/` responses). "Admin" means only the superuser may do it. Playlist endpoints only ever see your own playlists.

| Method | URL | Purpose |
| --- | --- | --- |
| GET | `/api/auth/session/` | `{user: {username, is_admin} \| null, csrf_token}` |
| POST | `/api/auth/login/` | Log in (`{username, password}`; 10 tries a minute) |
| POST | `/api/auth/logout/` | Log out |
| GET | `/api/songs/` | List all songs |
| POST | `/api/songs/` | Admin: upload a song (multipart, field `file`; mp3/m4a/aac/opus, max 200 MB) |
| POST | `/api/songs/youtube/` | Admin: download a YouTube video's audio into the library (`{url}`; max 30 minutes; waits until the download finishes) |
| GET | `/api/songs/<id>/` | One song |
| DELETE | `/api/songs/<id>/` | Admin: delete a song and its audio/cover files |
| GET | `/api/songs/<id>/stream/` | Stream the audio (supports HTTP Range, so seeking works) |
| GET | `/api/songs/<id>/cover/` | The song's cover art |
| GET | `/api/playlists/` | List your playlists (with `song_count`) |
| POST | `/api/playlists/` | Create a playlist (`{name, description?}`) |
| GET | `/api/playlists/<id>/` | One playlist, with its `songs` in order |
| PATCH | `/api/playlists/<id>/` | Rename / edit description |
| DELETE | `/api/playlists/<id>/` | Delete a playlist (its songs stay in the library) |
| POST | `/api/playlists/<id>/songs/` | Add a song to the end (`{song_id}`) |
| DELETE | `/api/playlists/<id>/songs/<song_id>/` | Remove a song from the playlist |
| PUT | `/api/playlists/<id>/order/` | Reorder (`{song_ids: [...]}`, must list exactly the playlist's songs) |
| GET | `/api/search/?q=...` | Songs matching title/artist/album and your playlists matching name (case-insensitive) |

Each song in the API includes a `stream_url` (what the player plays), a `cover_url` (or null) and a `format` (`mp3`, `m4a`, `aac` or `opus`).

## Browser format support

Not every browser plays every format. Opus in particular may fail in Safari, and raw `.aac` seeking can be approximate. If a song can't be played, the player bar shows a message naming the format. Nothing is transcoded.

## Notes

- **Your music lives in `song_files/` and the song list in `backend/db.sqlite3`.** Both are git-ignored, so back them up together if you care about your library. Add and remove songs only through the app, not by editing `song_files/` directly.
- `SECRET_KEY` lives in the git-ignored `backend/.env`. It signs everyone's login sessions, so never commit or share it. If it leaks, put a new one in `.env`, which logs everyone out.
- **Back up `backend/db.sqlite3`** too. It now also holds everyone's accounts and playlists.
- Search ignores case only for plain English letters (a SQLite limitation), so accented letters must match case.
