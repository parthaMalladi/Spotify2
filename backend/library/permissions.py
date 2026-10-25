from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdmin(BasePermission):
    """The one admin account (a Django superuser). Only it may add or delete songs."""

    def has_permission(self, request, view):
        return request.user.is_superuser


class IsAdminOrReadOnly(BasePermission):
    """Any logged-in user may read; only the admin may change."""

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or request.user.is_superuser
