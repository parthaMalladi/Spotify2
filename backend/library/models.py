import uuid
from pathlib import Path

from django.db import models


def audio_upload_to(instance, filename):
    # Store under a generated name; the user's original filename is never used on disk.
    return f"audio/{uuid.uuid4().hex}{Path(filename).suffix.lower()}"


def cover_upload_to(instance, filename):
    return f"covers/{uuid.uuid4().hex}{Path(filename).suffix.lower()}"


class Song(models.Model):
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255, blank=True)
    album = models.CharField(max_length=255, blank=True)
    duration = models.FloatField(help_text="Length in seconds")
    audio = models.FileField(upload_to=audio_upload_to)
    cover = models.FileField(upload_to=cover_upload_to, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        # Remove the files from song_files/ along with the database row.
        self.audio.delete(save=False)
        if self.cover:
            self.cover.delete(save=False)
        return super().delete(*args, **kwargs)


class Playlist(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    songs = models.ManyToManyField(Song, through="PlaylistSong", related_name="playlists")

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class PlaylistSong(models.Model):
    """A song's place in a playlist. Deleting either side removes only this link row."""

    playlist = models.ForeignKey(Playlist, on_delete=models.CASCADE, related_name="entries")
    song = models.ForeignKey(Song, on_delete=models.CASCADE, related_name="playlist_entries")
    position = models.PositiveIntegerField()

    class Meta:
        ordering = ["position"]
        constraints = [
            models.UniqueConstraint(fields=["playlist", "song"], name="unique_song_per_playlist"),
        ]
