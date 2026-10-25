import tempfile

from django.conf import settings
from django.core.files import File
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Max, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .metadata import UnsupportedFile, extract_metadata
from .models import Playlist, PlaylistSong, Song
from .permissions import IsAdmin, IsAdminOrReadOnly
from .serializers import PlaylistDetailSerializer, PlaylistSerializer, SongSerializer
from .youtube import YouTubeError, download_audio


def _save_song(meta, audio_file):
    """Create a Song from extract_metadata()-style fields and a Django file object."""
    song = Song(
        title=meta["title"],
        artist=meta["artist"],
        album=meta["album"],
        duration=meta["duration"],
        audio=audio_file,
    )
    if meta["cover"]:
        data, ext = meta["cover"]
        song.cover.save(f"cover{ext}", ContentFile(data), save=False)
    song.save()
    return song


class SongListCreate(generics.ListCreateAPIView):
    """GET: list all songs. POST (multipart, field "file", admin only): upload one song."""

    queryset = Song.objects.all()
    serializer_class = SongSerializer
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def create(self, request, *args, **kwargs):
        uploaded = request.FILES.get("file")
        if uploaded is None:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded.size > settings.MAX_UPLOAD_SIZE:
            limit_mb = settings.MAX_UPLOAD_SIZE // (1024 * 1024)
            return Response(
                {"detail": f"File is too large (limit {limit_mb} MB)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            meta = extract_metadata(uploaded.file, uploaded.name)
        except UnsupportedFile as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        song = _save_song(meta, uploaded)
        serializer = self.get_serializer(song)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdmin])
def youtube_import(request):
    """POST {url} (admin only): download a YouTube video's audio (AAC, max 30 minutes) and add it to the library.

    Runs synchronously, so the request takes as long as the download.
    """
    url = request.data.get("url")
    if not isinstance(url, str) or not url.strip():
        return Response({"detail": "Paste a YouTube link."}, status=status.HTTP_400_BAD_REQUEST)

    # Download into a throwaway folder; only the saved copy ends up in song_files/.
    with tempfile.TemporaryDirectory() as folder:
        try:
            path, info, cover = download_audio(url.strip(), folder)
        except YouTubeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        with open(path, "rb") as f:
            # Same validation as a normal upload; this also reads the real duration.
            try:
                meta = extract_metadata(f, path.name)
            except UnsupportedFile as e:
                return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

            # YouTube audio has no tags, so take the details from the video instead.
            # YouTube Music links fill in track/artist/album; plain videos only have a title and channel.
            artist = info.get("artist") or info.get("creator") or info.get("channel") or info.get("uploader") or ""
            meta["title"] = (info.get("track") or info.get("title") or meta["title"])[:255]
            meta["artist"] = meta["artist"] or artist.removesuffix(" - Topic")[:255]
            meta["album"] = meta["album"] or (info.get("album") or "")[:255]
            meta["cover"] = meta["cover"] or cover

            song = _save_song(meta, File(f, name=path.name))

    serializer = SongSerializer(song, context={"request": request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


class SongDetail(generics.RetrieveDestroyAPIView):
    """GET: one song. DELETE (admin only): remove the song and its files, and so from everyone's playlists."""

    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


# Playlists are private: every playlist view only sees the logged-in user's own playlists,
# so someone else's playlist id gives a 404.

class PlaylistListCreate(generics.ListCreateAPIView):
    """GET: list your playlists. POST {name, description?}: create one."""

    serializer_class = PlaylistSerializer

    def get_queryset(self):
        return Playlist.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class PlaylistDetail(generics.RetrieveUpdateDestroyAPIView):
    """GET: playlist with its songs in order. PATCH: rename / edit description. DELETE: remove it (songs are kept)."""

    serializer_class = PlaylistDetailSerializer

    def get_queryset(self):
        return Playlist.objects.filter(owner=self.request.user)


def _playlist_response(request, playlist, status_code=status.HTTP_200_OK):
    serializer = PlaylistDetailSerializer(playlist, context={"request": request})
    return Response(serializer.data, status=status_code)


@api_view(["POST"])
def playlist_add_song(request, pk):
    """POST {song_id}: append a song to the end of the playlist."""
    playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
    song_id = request.data.get("song_id")
    if not isinstance(song_id, int):
        return Response({"detail": "song_id must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
    song = get_object_or_404(Song, pk=song_id)

    if playlist.entries.filter(song=song).exists():
        return Response({"detail": f'"{song.title}" is already in "{playlist.name}".'}, status=status.HTTP_400_BAD_REQUEST)

    last = playlist.entries.aggregate(Max("position"))["position__max"]
    PlaylistSong.objects.create(playlist=playlist, song=song, position=0 if last is None else last + 1)
    return _playlist_response(request, playlist, status.HTTP_201_CREATED)


@api_view(["DELETE"])
def playlist_remove_song(request, pk, song_id):
    """Remove a song from the playlist (the song itself stays in the library)."""
    playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
    entry = get_object_or_404(PlaylistSong, playlist=playlist, song_id=song_id)
    entry.delete()
    return _playlist_response(request, playlist)


@api_view(["PUT"])
def playlist_reorder(request, pk):
    """PUT {song_ids: [...]}: set the playlist order. Must list exactly the songs already in it."""
    playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
    song_ids = request.data.get("song_ids")
    entries = {entry.song_id: entry for entry in playlist.entries.all()}

    valid = isinstance(song_ids, list) and all(isinstance(i, int) for i in song_ids)
    if not valid or sorted(song_ids) != sorted(entries):
        return Response(
            {"detail": "song_ids must contain exactly the songs in this playlist."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    for position, song_id in enumerate(song_ids):
        entries[song_id].position = position
    with transaction.atomic():
        PlaylistSong.objects.bulk_update(entries.values(), ["position"])
    return _playlist_response(request, playlist)


@api_view(["GET"])
def search(request):
    """GET ?q=...: songs matching title/artist/album and your playlists matching name (case-insensitive)."""
    q = request.query_params.get("q", "").strip()
    if not q:
        return Response({"songs": [], "playlists": []})

    songs = Song.objects.filter(Q(title__icontains=q) | Q(artist__icontains=q) | Q(album__icontains=q))
    playlists = Playlist.objects.filter(owner=request.user, name__icontains=q)
    context = {"request": request}
    return Response({
        "songs": SongSerializer(songs, many=True, context=context).data,
        "playlists": PlaylistSerializer(playlists, many=True, context=context).data,
    })
