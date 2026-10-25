from django.conf import settings
from django.db import migrations, models


def give_existing_playlists_to_admin(apps, schema_editor):
    Playlist = apps.get_model("library", "Playlist")
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    if not Playlist.objects.exists():
        return
    admin = User.objects.filter(is_superuser=True).order_by("pk").first()
    if admin is None:
        raise RuntimeError(
            "Existing playlists need an owner. Create the admin account first with "
            "`python manage.py createsuperuser`, then run `python manage.py migrate` again."
        )
    Playlist.objects.update(owner=admin)


class Migration(migrations.Migration):

    dependencies = [
        ("library", "0002_playlist_playlistsong_playlist_songs_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Added as nullable, filled in, then made required.
        migrations.AddField(
            model_name="playlist",
            name="owner",
            field=models.ForeignKey(
                null=True,
                on_delete=models.deletion.CASCADE,
                related_name="playlists",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(give_existing_playlists_to_admin, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="playlist",
            name="owner",
            field=models.ForeignKey(
                on_delete=models.deletion.CASCADE,
                related_name="playlists",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
