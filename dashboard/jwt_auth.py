"""
JWT Authentication Utility for Government Staff & Admin Access.
Provides secure token issuance, validation, and request authentication.
"""
import datetime
from functools import wraps
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse

User = get_user_model()

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 12


def generate_jwt_token(user):
    """
    Generate a signed JWT token containing user identity and administrative roles.
    Valid for 12 hours.
    """
    payload = {
        "sub": str(user.pk),
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "role": getattr(user, "role", "admin" if user.is_staff else "officer"),
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS),
    }
    secret = settings.SECRET_KEY
    token = jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)
    return token


def decode_jwt_token(token):
    """
    Decodes and validates a JWT token. Returns payload dict or None.
    """
    try:
        secret = settings.SECRET_KEY
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_user_from_jwt(request):
    """
    Extracts Bearer token from HTTP Authorization header or cookie,
    decodes it, and retrieves the User object if valid and staff.
    """
    auth_header = request.headers.get("Authorization") or request.META.get("HTTP_AUTHORIZATION", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()
    elif "admin_jwt" in request.COOKIES:
        token = request.COOKIES.get("admin_jwt")

    if not token:
        return None

    payload = decode_jwt_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    try:
        user = User.objects.get(pk=user_id, is_active=True)
        if user.is_staff or user.is_superuser:
            return user
    except User.DoesNotExist:
        return None

    return None


def jwt_or_staff_required(view_func):
    """
    Decorator for views that requires authentication either via:
    1. Active Django staff session (request.user.is_authenticated and is_staff)
    2. Valid JWT Bearer token / cookie belonging to an active staff member.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # 1. Standard Django session
        if request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser):
            return view_func(request, *args, **kwargs)

        # 2. Check JWT Authorization Header or Cookie
        user = get_user_from_jwt(request)
        if user:
            request.user = user  # Attach authenticated user to request
            return view_func(request, *args, **kwargs)

        return JsonResponse({
            "error": "Unauthorized: Valid Admin/Staff JWT token or government credentials required."
        }, status=403)

    return _wrapped_view
