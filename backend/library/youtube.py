"""Download the audio track of a single YouTube video with yt-dlp, keeping YouTube's own AAC (.m4a) stream."""

from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from django.conf import settings

MAX_DURATION = 30 * 60  # seconds

ALLOWED_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"}


class YouTubeError(Exception):
    pass


def download_audio(url, folder):
    """Download the video's audio into `folder`.

    Returns (path_to_m4a, info, cover) where info is yt-dlp's metadata dict and cover is
    (jpeg_bytes, ".jpg") or None. Raises YouTubeError with a user-facing message on failure.
    """
    host = (urlparse(url).hostname or "").lower()
    if host not in ALLOWED_HOSTS:
        raise YouTubeError("Only YouTube links (youtube.com or youtu.be) are supported.")

    options = {
        # YouTube's AAC stream, no transcoding. Without ffmpeg installed yt-dlp warns that it can't
        # tidy the DASH m4a container; browsers play it either way.
        "format": "bestaudio[ext=m4a]",
        "noplaylist": True,  # a watch?v=...&list=... link downloads just that video
        "outtmpl": str(Path(folder) / "audio.%(ext)s"),
        "max_filesize": settings.MAX_UPLOAD_SIZE,
        "socket_timeout": 30,
        "quiet": True,
        "noprogress": True,
        # YouTube needs a JavaScript runtime to unlock its streams. yt-dlp only tries Deno by default; allow Node too.
        "js_runtimes": {"deno": {}, "node": {}},
    }
    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            # Look up the video first so long videos and live streams are rejected before downloading anything.
            info = ydl.extract_info(url, download=False)
            if info.get("_type") == "playlist":
                raise YouTubeError("That's a playlist link. Paste the link to a single video.")
            if info.get("is_live") or not info.get("duration"):
                raise YouTubeError("Live streams can't be downloaded.")
            if info["duration"] > MAX_DURATION:
                minutes = round(info["duration"] / 60)
                raise YouTubeError(f"That video is {minutes} minutes long. The limit is {MAX_DURATION // 60} minutes.")

            info = ydl.process_ie_result(info, download=True)
            downloads = info.get("requested_downloads") or []
            path = Path(downloads[0]["filepath"]) if downloads else None
            if path is None or not path.exists():
                # yt-dlp skips (rather than fails) files over max_filesize.
                raise YouTubeError("The download didn't produce a file. It may be over the size limit.")

            return path, info, _thumbnail(ydl, info)
    except yt_dlp.utils.DownloadError as e:
        raise YouTubeError(str(e).removeprefix("ERROR: ")) from None


def _thumbnail(ydl, info):
    """Fetch the best available JPEG thumbnail as cover art. Thumbnails are optional, so failures return None."""
    # yt-dlp lists thumbnails worst to best; some listed sizes don't exist for every video.
    jpegs = [t["url"] for t in info.get("thumbnails") or [] if t.get("url", "").split("?")[0].endswith(".jpg")]
    for thumb_url in reversed(jpegs):
        try:
            data = ydl.urlopen(thumb_url).read()
        except Exception:
            continue
        if data.startswith(b"\xff\xd8"):  # JPEG signature
            return data, ".jpg"
    return None
