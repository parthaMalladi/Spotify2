from django.urls import path

from . import auth_views, streaming, views

urlpatterns = [
    path("auth/session/", auth_views.session),
    path("auth/login/", auth_views.login_view),
    path("auth/logout/", auth_views.logout_view),
    path("songs/", views.SongListCreate.as_view()),
    path("songs/youtube/", views.youtube_import),
    path("songs/<int:pk>/", views.SongDetail.as_view()),
    path("songs/<int:pk>/stream/", streaming.stream_song, name="song-stream"),
    path("songs/<int:pk>/cover/", streaming.song_cover, name="song-cover"),
    path("playlists/", views.PlaylistListCreate.as_view()),
    path("playlists/<int:pk>/", views.PlaylistDetail.as_view()),
    path("playlists/<int:pk>/songs/", views.playlist_add_song),
    path("playlists/<int:pk>/songs/<int:song_id>/", views.playlist_remove_song),
    path("playlists/<int:pk>/order/", views.playlist_reorder),
    path("search/", views.search),
]
