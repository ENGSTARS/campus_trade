from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views

urlpatterns = [
    path("api/listings/", views.listings_home),
    path("api/listings/create/", views.create_listing),
    path("api/listings/<int:listing_id>/edit/", views.edit_listing),
    path("api/listings/<int:listing_id>/delete/", views.delete_listing),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 