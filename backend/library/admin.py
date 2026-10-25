from django.contrib import admin

from .models import Playlist, PlaylistSong, Song


@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ["title", "artist", "album", "duration", "uploaded_at"]


class PlaylistSongInline(admin.TabularInline):
    model = PlaylistSong
    extra = 0


@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ["name", "owner", "created_at"]
    list_filter = ["owner"]
    inlines = [PlaylistSongInline]
