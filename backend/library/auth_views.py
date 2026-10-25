"""Log in / log out with Django's session login. Accounts are created by the admin in /admin/."""

from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle


class LoginThrottle(AnonRateThrottle):
    scope = "login"  # rate is in settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]


def _session_response(request):
    # The frontend sends csrf_token back in an X-CSRFToken header on every change it makes.
    # Django issues a new token on login and logout, so it's returned each time.
    user = request.user
    data = {"username": user.username, "is_admin": user.is_superuser} if user.is_authenticated else None
    return Response({"user": data, "csrf_token": get_token(request)})


@api_view(["GET"])
@permission_classes([AllowAny])
def session(request):
    """GET: who is logged in ({user: null} when nobody is), plus a CSRF token."""
    return _session_response(request)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    """POST {username, password}: log in."""
    username = request.data.get("username")
    password = request.data.get("password")
    user = None
    if isinstance(username, str) and isinstance(password, str):
        user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({"detail": "Wrong username or password."}, status=status.HTTP_400_BAD_REQUEST)
    login(request, user)
    return _session_response(request)


@api_view(["POST"])
def logout_view(request):
    """POST: log out."""
    logout(request)
    return _session_response(request)
