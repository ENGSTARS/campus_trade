from django.urls import path
from .views import (
    register,
    verify_email,
    login_view,
    verify_2fa,
    resend_2fa_code,
    profile_setup,
    password_reset_request,
    password_reset_confirm,
    password_reset_complete,
    password_reset_invalid,
    password_reset_sent
)
urlpatterns = [
    path("register/", register, name="register_api"),
    path("verify-email/<str:uidb64>/<str:token>/", verify_email, name="verify_email"),
    path("login/", login_view, name="login_api"),
    path("2fa/", verify_2fa, name="verify_2fa"),
    path("2fa/resend/", resend_2fa_code, name="resend_2fa"),
    path("profile-setup/", profile_setup, name="profile_setup"),
    path("password-reset/", password_reset_request, name="password_reset_request"),
    path("password-reset-confirm/<str:uidb64>/<str:token>/", password_reset_confirm, name="password_reset_confirm"),
    path("password-reset/sent/", password_reset_sent),
    path("password-reset/complete/", password_reset_complete),
    path("password-reset/invalid/", password_reset_invalid),
]