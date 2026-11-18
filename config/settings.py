import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:  # python-dotenv is optional
    pass

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1")

raw_secret = os.getenv("SECRET_KEY")
if not raw_secret:
    if DEBUG:
        SECRET_KEY = "dev-only-insecure-key-never-use-in-production"
    else:
        raise ImproperlyConfigured("CRITICAL: The SECRET_KEY environment variable must be set in production!")
else:
    SECRET_KEY = raw_secret

raw_allowed_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,.onrender.com")
ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(",") if h.strip()]
if DEBUG:
    for h in ("testserver", "localhost", "127.0.0.1", "0.0.0.0"):
        if h not in ALLOWED_HOSTS:
            ALLOWED_HOSTS.append(h)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "accounts",
    "policies",
    "feedback",
    "sentiment",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.gzip.GZipMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [BASE_DIR / "templates"],
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "django.contrib.auth.context_processors.auth",
        "django.contrib.messages.context_processors.messages",
    ]},
}]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

database_url = os.getenv("DATABASE_URL")
if database_url:
    try:
        import dj_database_url
        DATABASES["default"] = dj_database_url.config(default=database_url, conn_max_age=600)
    except ImportError:
        pass

AUTH_USER_MODEL = "accounts.User"
LOGIN_URL = "/admin/login/"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-in"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Production static files serving via WhiteNoise if installed
try:
    import whitenoise
    MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
        },
    }
except ImportError:
    pass

csrf_defaults = "https://*.onrender.com,http://localhost:8000,http://127.0.0.1:8000"
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", csrf_defaults).split(",")
    if origin.strip()
]
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Production HTTP Security Headers
if not DEBUG:
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = "DENY"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SAMESITE = "Lax"
    SECURE_HSTS_SECONDS = 31536000  # 1 year HSTS
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Project settings
SENTIMENT_ENGINE = os.getenv("SENTIMENT_ENGINE", "lexicon")
MIN_RESPONSES_FOR_CHART = int(os.getenv("MIN_RESPONSES_FOR_CHART", "10"))
FEEDBACK_RATE_LIMIT_PER_HOUR = 5
