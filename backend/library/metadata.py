"""Read title/artist/album/duration/cover art from an uploaded audio file using Mutagen."""

import base64
from pathlib import Path

from mutagen.aac import AAC
from mutagen.flac import Picture
from mutagen.id3 import ID3
from mutagen.mp3 import MP3
from mutagen.mp4 import MP4, MP4Cover, MP4Tags
from mutagen.oggopus import OggOpus
from mutagen._vorbis import VCommentDict

# Each extension is parsed with exactly one Mutagen class. This checks the file really
# is that format, and avoids raw ADTS .aac being mis-detected as MP3 (they share a sync word).
PARSERS = {
    ".mp3": MP3,
    ".m4a": MP4,
    ".aac": AAC,
    ".opus": OggOpus,
}

ALLOWED_EXTENSIONS = sorted(PARSERS)


class UnsupportedFile(Exception):
    pass


def extract_metadata(fileobj, filename):
    """Return a dict with title, artist, album, duration and cover ((bytes, ext) or None).

    Raises UnsupportedFile if the file isn't an allowed type or can't be parsed.
    """
    ext = Path(filename).suffix.lower()
    parser = PARSERS.get(ext)
    if parser is None:
        raise UnsupportedFile(f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")

    fileobj.seek(0)
    try:
        audio = parser(fileobj)
    except Exception:
        # Mutagen raises a variety of errors on malformed files; any of them means "reject".
        raise UnsupportedFile("Could not read this file as audio. It may be corrupt or not the format its extension claims.")
    finally:
        fileobj.seek(0)

    duration = getattr(audio.info, "length", 0) or 0
    if duration <= 0:
        raise UnsupportedFile("Could not determine the length of this audio file.")

    tags = audio.tags
    title = _text_tag(tags, "title")
    return {
        "title": (title or Path(filename).stem)[:255],
        "artist": _text_tag(tags, "artist")[:255],
        "album": _text_tag(tags, "album")[:255],
        "duration": duration,
        "cover": _cover(tags),
    }


TAG_KEYS = {
    # field: (ID3 frame, MP4 atom, Vorbis comment)
    "title": ("TIT2", "\xa9nam", "title"),
    "artist": ("TPE1", "\xa9ART", "artist"),
    "album": ("TALB", "\xa9alb", "album"),
}


def _text_tag(tags, field):
    id3_key, mp4_key, vorbis_key = TAG_KEYS[field]
    values = None
    if isinstance(tags, ID3):
        frame = tags.get(id3_key)
        values = frame.text if frame else None
    elif isinstance(tags, MP4Tags):
        values = tags.get(mp4_key)
    elif isinstance(tags, VCommentDict):
        values = tags.get(vorbis_key)
    if values:
        return str(values[0]).strip()
    return ""


def _cover(tags):
    """Return (image_bytes, extension) for embedded JPEG/PNG cover art, or None."""
    if isinstance(tags, ID3):
        frames = tags.getall("APIC")
        if frames:
            return _image(frames[0].data, frames[0].mime)
    elif isinstance(tags, MP4Tags):
        covers = tags.get("covr")
        if covers:
            mime = "image/png" if covers[0].imageformat == MP4Cover.FORMAT_PNG else "image/jpeg"
            return _image(bytes(covers[0]), mime)
    elif isinstance(tags, VCommentDict):
        pictures = tags.get("metadata_block_picture")
        if pictures:
            try:
                picture = Picture(base64.b64decode(pictures[0]))
            except Exception:
                return None
            return _image(picture.data, picture.mime)
    return None


def _image(data, mime):
    ext = {"image/jpeg": ".jpg", "image/jpg": ".jpg", "image/png": ".png"}.get((mime or "").lower())
    if not data or ext is None:
        return None
    return data, ext
