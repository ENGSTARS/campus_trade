import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# core/settings.py
APPEND_SLASH = True
# Application definition

INSTALLED_APPS = [
    'rest_framework',
    'api',
    'listings',
    'corsheaders',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-campus',
]


ROOT_URLCONF = 'core.urls'

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

WSGI_APPLICATION = 'core.wsgi.application'

from decouple import Config, RepositoryEnv, UndefinedValueError


DEFAULT_DEV_SECRET_KEY = 'django-insecure-f@(y_n)o*0l&uz7g=nl^ge&we6k=ch&u5pqh@1vuw$8yxq2y^-'
ENV_PATHS = (BASE_DIR / '.env', BASE_DIR.parent / '.env')


def read_env(option, default=None, cast=None):
    raw_value = os.getenv(option)
    if raw_value is not None:
        if cast is None:
            return raw_value
        return cast(raw_value)

    for env_path in ENV_PATHS:
        if not env_path.exists():
            continue

        try:
            env_config = Config(RepositoryEnv(str(env_path)))
            if cast is None:
                value = env_config(option, default=default)
            else:
                value = env_config(option, default=default, cast=cast)
        except UndefinedValueError:
            continue
        else:
            return value

    if default is not None:
        return default

    raise UndefinedValueError(
        f'{option} not found. Add it to an environment variable, '
        f'{BASE_DIR / ".env"}, or {BASE_DIR.parent / ".env"}.'
    )


def read_debug_flag():
    try:
        return read_env('DEBUG', default=True, cast=bool)
    except ValueError:
        return True


DEBUG = read_debug_flag()
SECRET_KEY = read_env('SECRET_KEY', default=DEFAULT_DEV_SECRET_KEY if DEBUG else None)
ALLOWED_HOSTS = [host.strip() for host in read_env('ALLOWED_HOSTS', default='').split(',') if host.strip()]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': read_env('DB_NAME', default='campustrade_db'),
        'USER': read_env('DB_USER', default='postgres'),
        'PASSWORD': read_env('DB_PASSWORD', default=''),
        'HOST': read_env('DB_HOST', default='localhost'),
        'PORT': read_env('DB_PORT', default='5432'),
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.0/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.0/howto/static-files/

STATIC_URL = 'static/'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'



from datetime import timedelta


SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ),
    'DEFAULT_THROTTLE_CLASSES': []
    if DEBUG
    else [
        'rest_framework.throttling.UserRateThrottle',
        'rest_framework.throttling.AnonRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'user': '200/minute' if DEBUG else '60/minute',
        'anon': '100/minute' if DEBUG else '30/minute',
        'password_reset': '3/hour',
        'login': '60/minute' if DEBUG else '20/minute'
    }
}


EMAIL_BACKEND = read_env('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = read_env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = read_env('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = read_env('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = read_env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = read_env('EMAIL_HOST_PASSWORD', default='')
IMGBB_API_KEY = read_env('IMGBB_API_KEY', default='')


