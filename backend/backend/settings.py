"""
Django settings for backend project.

Configuration is loaded from environment variables (see `.env.example`).
"""

from pathlib import Path

import environ
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, True),
    SECURE_SSL_REDIRECT=(bool, False),
    USE_SECURE_PROXY_HEADER=(bool, False),
)

environ.Env.read_env(BASE_DIR / '.env')

# Default True matches local dev when `.env` is missing; set DEBUG=false in production `.env`.
DEBUG = env.bool('DEBUG', default=True)

_DEV_PLACEHOLDER_SECRET = 'django-insecure-dev-change-me-in-dotenv'
SECRET_KEY = env('SECRET_KEY', default=_DEV_PLACEHOLDER_SECRET)
if not DEBUG and SECRET_KEY == _DEV_PLACEHOLDER_SECRET:
    raise ImproperlyConfigured(
        'SECRET_KEY must be set in .env to a unique value when DEBUG is false.'
    )

ALLOWED_HOSTS = env.list(
    'ALLOWED_HOSTS',
    default=(['localhost', '127.0.0.1'] if DEBUG else []),
)
if not DEBUG and not ALLOWED_HOSTS:
    raise ImproperlyConfigured(
        'ALLOWED_HOSTS must be set in .env when DEBUG is false.'
    )

CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

_sqlite_url = 'sqlite:///' + str(BASE_DIR / 'db.sqlite3')
DATABASES = {'default': env.db('DATABASE_URL', default=_sqlite_url)}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
    if not CORS_ALLOWED_ORIGINS:
        raise ImproperlyConfigured(
            'CORS_ALLOWED_ORIGINS must list your frontend origin(s) when DEBUG is false.'
        )

SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

if env.bool('USE_SECURE_PROXY_HEADER', default=False):
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- OSINT collectors (optional in dev) ---
APIFY_API_TOKEN = env('APIFY_API_TOKEN', default='')
APIFY_ACTOR_LINKEDIN_PROFILE = env(
    'APIFY_ACTOR_LINKEDIN_PROFILE', default='etiW1XfulkpulZA4D'
)
APIFY_ACTOR_LINKEDIN_POSTS = env(
    'APIFY_ACTOR_LINKEDIN_POSTS', default='Wpp1BZ6yGWjySadk3'
)
APIFY_ACTOR_TWITTER = env('APIFY_ACTOR_TWITTER', default='dy7gIgPRMhrOrfW0f')
APIFY_ACTOR_INSTAGRAM = env('APIFY_ACTOR_INSTAGRAM', default='bGApZ3CtTxA9fv2rl')

GEMINI_API_KEY = env('GEMINI_API_KEY', default='')
GEMINI_MODEL = env('GEMINI_MODEL', default='gemini-2.0-flash')
