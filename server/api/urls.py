from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login_api'),
    path('me/', views.profile_setup, name='me'),
    path('me/transactions/', views.profile_transactions, name='me-transactions'),
    path('admin/stats/', views.admin_stats, name='admin-stats'),
    path('admin/reports/', views.admin_reports, name='admin-reports'),
    path('admin/reports/<int:report_id>/', views.admin_update_report, name='admin-report-update'),
    path('admin/users/', views.admin_users, name='admin-users'),
    path('admin/users/<int:user_id>/detail/', views.admin_user_detail, name='admin-user-detail'),
    path('admin/users/<int:user_id>/suspend/', views.admin_suspend_user, name='admin-user-suspend'),
    path('admin/users/<int:user_id>/', views.admin_delete_user, name='admin-user-delete'),
    path('verify-email/<str:uidb64>/<str:token>/', views.verify_email, name='verify_email'),
    # 2FA paths removed
    path('users/<int:pk>/', views.public_profile, name='public-profile'),
]
