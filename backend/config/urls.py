from django.contrib import admin
from django.urls import include, path

# Audio and cover art are served by views in library/streaming.py, which require a login,
# so song_files/ is never served directly. The built frontend is served by WhiteNoise (see settings).
urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("library.urls")),
]
