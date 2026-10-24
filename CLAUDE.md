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
5. **Play queue:** add to end, play next, remove, reorder, clear.
6. **Shuffle:** play every song once in random order (a real shuffle of a copy of the queue, not repeated random picks). Turning shuffle off restores the original order without interrupting the current song.
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
- Set `ALLOWED_HOSTS` to `localhost` and `127.0.0.1` only. This app should not be reachable from other machines.
- The current `SECRET_KEY` in settings is Django's insecure development placeholder. That's acceptable for this local-only project, but never reuse it anywhere else. If I ever publish the repo or deploy, move it to a git-ignored `.env` first.

## Out of scope (do not add unless I ask)

Authentication and user accounts, Docker, PostgreSQL, Celery or any task queue, cloud storage, transcoding, deployment configuration, and social or sharing features.

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
- Player state lives in `frontend/src/player/PlayerProvider.jsx`, which wraps `<App />` in `main.jsx` and owns the single `<audio>` element. Components use `usePlayer()` from `player/PlayerContext.js`. `playSongs(list, index)` plays a list of songs; stage 4 will turn that list into the queue. Songs are loaded from the action that changes them (`playAt`), not from an effect.
- Player behaviour: "previous" restarts the song if more than 3 s in, otherwise goes back one. The progress bar seeks on release, not while dragging. The displayed duration falls back to the tagged `duration` when the browser can't report one (common for raw AAC). Unplayable formats show an error in the player bar naming the format.
- Removed the scaffold `config/views.py` / `/api/hello/` demo endpoint, plus the Vite starter `App.css` and `src/assets/`.