"""Serve audio files (with HTTP Range support so the browser can seek) and cover art, to logged-in users only.

These are plain Django views rather than DRF ones because <audio> and <img> load them directly.
"""

import re
from pathlib import Path

from django.http import FileResponse, Http404, HttpResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_safe

from .models import Song

CONTENT_TYPES = {
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
    ".opus": "audio/ogg",
}

CHUNK_SIZE = 64 * 1024
RANGE_RE = re.compile(r"^bytes=(\d*)-(\d*)$")


def _parse_range(header, size):
    """Return (start, end) inclusive for a single "bytes=" range, or None if unsatisfiable.

    Only the first range is honoured if the browser asks for several (browsers don't in practice).
    """
    match = RANGE_RE.match(header.split(",")[0].strip())
    if not match:
        return None
    first, last = match.groups()
    if first:
        start = int(first)
        end = int(last) if last else size - 1
    elif last:
        # "bytes=-500" means the final 500 bytes.
        start = max(size - int(last), 0)
        end = size - 1
    else:
        return None
    end = min(end, size - 1)
    if start > end:
        return None
    return start, end


def _file_iterator(path, start, length):
    with open(path, "rb") as f:
        f.seek(start)
        remaining = length
        while remaining > 0:
            chunk = f.read(min(CHUNK_SIZE, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@require_safe
def stream_song(request, pk):
    if not request.user.is_authenticated:
        return HttpResponse("Log in to play songs.", status=403)
    song = get_object_or_404(Song, pk=pk)
    path = Path(song.audio.path)
    if not path.is_file():
        raise Http404("Audio file is missing")

    size = path.stat().st_size
    content_type = CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")

    range_header = request.headers.get("Range")
    if range_header:
        byte_range = _parse_range(range_header, size)
        if byte_range is None:
            response = HttpResponse(status=416)
            response["Content-Range"] = f"bytes */{size}"
            return response
        start, end = byte_range
        length = end - start + 1
        response = StreamingHttpResponse(_file_iterator(path, start, length), status=206, content_type=content_type)
        response["Content-Range"] = f"bytes {start}-{end}/{size}"
    else:
        length = size
        response = StreamingHttpResponse(_file_iterator(path, 0, size), content_type=content_type)

    response["Content-Length"] = str(length)
    response["Accept-Ranges"] = "bytes"
    return response


@require_safe
def song_cover(request, pk):
    if not request.user.is_authenticated:
        return HttpResponse("Log in to see cover art.", status=403)
    song = get_object_or_404(Song, pk=pk)
    if not song.cover:
        raise Http404("This song has no cover art")
    response = FileResponse(song.cover.open("rb"))
    # Covers never change for a song, so the browser may keep them for a day (but shared caches may not).
    response["Cache-Control"] = "private, max-age=86400"
    return response
