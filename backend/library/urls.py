from django.urls import path

from . import streaming, views

urlpatterns = [
    path("songs/", views.SongListCreate.as_view()),
    path("songs/<int:pk>/", views.SongDetail.as_view()),
    path("songs/<int:pk>/stream/", streaming.stream_song, name="song-stream"),
]
