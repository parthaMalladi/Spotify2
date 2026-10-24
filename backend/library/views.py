from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import Max
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .metadata import UnsupportedFile, extract_metadata
from .models import Playlist, PlaylistSong, Song
from .serializers import PlaylistDetailSerializer, PlaylistSerializer, SongSerializer


class SongListCreate(generics.ListCreateAPIView):
    """GET: list all songs. POST (multipart, field "file"): upload one song."""

    queryset = Song.objects.all()
    serializer_class = SongSerializer
    parser_classes = [MultiPartParser]

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

        song = Song(
            title=meta["title"],
            artist=meta["artist"],
            album=meta["album"],
            duration=meta["duration"],
            audio=uploaded,
        )
        if meta["cover"]:
            data, ext = meta["cover"]
            song.cover.save(f"cover{ext}", ContentFile(data), save=False)
        song.save()

        serializer = self.get_serializer(song)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SongDetail(generics.RetrieveDestroyAPIView):
    """GET: one song. DELETE: remove the song and its files."""

    queryset = Song.objects.all()
    serializer_class = SongSerializer


class PlaylistListCreate(generics.ListCreateAPIView):
    """GET: list playlists. POST {name, description?}: create one."""

    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer


class PlaylistDetail(generics.RetrieveUpdateDestroyAPIView):
    """GET: playlist with its songs in order. PATCH: rename / edit description. DELETE: remove it (songs are kept)."""

    queryset = Playlist.objects.all()
    serializer_class = PlaylistDetailSerializer


def _playlist_response(request, playlist, status_code=status.HTTP_200_OK):
    serializer = PlaylistDetailSerializer(playlist, context={"request": request})
    return Response(serializer.data, status=status_code)


@api_view(["POST"])
def playlist_add_song(request, pk):
    """POST {song_id}: append a song to the end of the playlist."""
    playlist = get_object_or_404(Playlist, pk=pk)
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
    playlist = get_object_or_404(Playlist, pk=pk)
    entry = get_object_or_404(PlaylistSong, playlist=playlist, song_id=song_id)
    entry.delete()
    return _playlist_response(request, playlist)


@api_view(["PUT"])
def playlist_reorder(request, pk):
    """PUT {song_ids: [...]}: set the playlist order. Must list exactly the songs already in it."""
    playlist = get_object_or_404(Playlist, pk=pk)
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
