import os

from .base import *


DEBUG = False

render_hostname = os.getenv("RENDER_EXTERNAL_HOSTNAME", "").strip()
configured_hosts = env_list("ALLOWED_HOSTS")
ALLOWED_HOSTS = [host for host in [render_hostname, *configured_hosts] if host]

configured_cors_origins = env_list("CORS_ALLOWED_ORIGINS")
if configured_cors_origins:
    CORS_ALLOWED_ORIGINS = configured_cors_origins

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env_bool("SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"
