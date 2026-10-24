from pathlib import Path

from django.urls import reverse
from rest_framework import serializers

from .models import Song


class SongSerializer(serializers.ModelSerializer):
    cover_url = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()
    format = serializers.SerializerMethodField()

    class Meta:
        model = Song
        fields = ["id", "title", "artist", "album", "duration", "cover_url", "stream_url", "format", "uploaded_at"]

    def get_cover_url(self, song):
        if not song.cover:
            return None
        return self.context["request"].build_absolute_uri(song.cover.url)

    def get_stream_url(self, song):
        return self.context["request"].build_absolute_uri(reverse("song-stream", args=[song.pk]))

    def get_format(self, song):
        # "mp3", "m4a", "aac" or "opus", so the frontend can say which format a browser can't play.
        return Path(song.audio.name).suffix.lstrip(".").lower()
