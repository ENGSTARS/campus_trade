from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login_api'),
    path('me/', views.profile_setup, name='me'),
    path('verify-email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),
    # 2FA paths removed
    path('users/<int:pk>/', views.public_profile, name='public-profile'),
]