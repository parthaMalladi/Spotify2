"""Run the app for online use with waitress: python serve.py

Before starting: DEBUG=False in backend/.env, `npm run build` in frontend/, and `python manage.py collectstatic`.
Then start the Cloudflare tunnel in another terminal (see README).
"""

import os

from waitress import serve

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from django.core.wsgi import get_wsgi_application  # noqa: E402  (needs the settings module set first)

application = get_wsgi_application()

# waitress itself prints nothing here, so say that it's up. flush=True because Git Bash buffers Python's output.
print("Music player running at http://localhost:8000 (admin: http://localhost:8000/admin/)", flush=True)
print("Start the tunnel in another terminal. Press Ctrl+C to stop.", flush=True)

serve(
    application,
    # Only this machine can connect; other people reach the app through cloudflared, which runs here too.
    listen="127.0.0.1:8000",
    # Each playing song holds a thread while it streams, and a YouTube download holds one until it finishes.
    threads=16,
    # cloudflared connects from 127.0.0.1 and tells us the visitor's IP and that they used HTTPS.
    # Waitress applies that (so song links are https:// and the login rate limit is per visitor),
    # and drops these headers when anything else sends them.
    trusted_proxy="127.0.0.1",
    trusted_proxy_headers={"x-forwarded-for", "x-forwarded-proto"},
)
