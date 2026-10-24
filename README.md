# Personal Music Player

A locally hosted music player: Django + DRF backend (`backend/`), React + Vite frontend (`frontend/`), audio files stored in `song_files/`.

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

Each song in the API includes a `stream_url` (what the player plays) and a `format` (`mp3`, `m4a`, `aac` or `opus`).

## Browser format support

Not every browser plays every format. Opus in particular may fail in Safari, and raw `.aac` seeking can be approximate. If a song can't be played, the player bar shows a message naming the format. Nothing is transcoded.
