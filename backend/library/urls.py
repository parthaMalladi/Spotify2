from django.urls import path

from . import streaming, views

urlpatterns = [
    path("songs/", views.SongListCreate.as_view()),
    path("songs/<int:pk>/", views.SongDetail.as_view()),
    path("songs/<int:pk>/stream/", streaming.stream_song, name="song-stream"),
    path("playlists/", views.PlaylistListCreate.as_view()),
    path("playlists/<int:pk>/", views.PlaylistDetail.as_view()),
    path("playlists/<int:pk>/songs/", views.playlist_add_song),
    path("playlists/<int:pk>/songs/<int:song_id>/", views.playlist_remove_song),
    path("playlists/<int:pk>/order/", views.playlist_reorder),
]
