from django.conf import settings
from django.core.files.base import ContentFile
from rest_framework import generics, status
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .metadata import UnsupportedFile, extract_metadata
from .models import Song
from .serializers import SongSerializer


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
