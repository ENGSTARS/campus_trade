from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── JWT Auth ─────────────────────────────────────────────────
    path('api/auth/login/',   TokenObtainPairView.as_view(), name='login'),
    path('api/auth/refresh/', TokenRefreshView.as_view(),    name='refresh'),
    path('api/auth/verify/',  TokenVerifyView.as_view(),     name='verify'),

    # ── Apps ─────────────────────────────────────────────────────
    path('api/',              include('api.urls')),
    path('api/listings/',     include('listings.urls')),  # ← prefix set here
]

# Serve media files in development only
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
#                  ↑ this belongs in core/urls.py not in app urls.py
# ```

# ---

# ## URL Map — Everything End to End
# ```
# Frontend call                    Full URL                          View
# ──────────────────────────────────────────────────────────────────────────
# authApi.login()                  POST /api/auth/login/             TokenObtainPairView
# authApi.register()               POST /api/register/               RegisterView
# authApi.me()                     GET  /api/me/                     MeView

# listingsApi.getListings()        GET  /api/listings/               ListingListCreateView
# listingsApi.createListing()      POST /api/listings/               ListingListCreateView
# listingsApi.getListingById(1)    GET  /api/listings/1/             ListingDetailView
# listingsApi.updateListing(1)     PATCH /api/listings/1/            ListingDetailView
# listingsApi.deleteListing(1)     DELETE /api/listings/1/           ListingDetailView
# listingsApi.getRelatedListings() GET  /api/listings/1/related/     RelatedListingsView
# listingsApi.toggleWishlist(1)    POST /api/listings/1/wishlist/    ToggleWishlistView
# listingsApi.reportListing(1)     POST /api/listings/1/report/      ReportListingView
# listingsApi.submitReview(1)      POST /api/listings/1/review/      SubmitReviewView
# listingsApi.createOrder(1)       POST /api/listings/1/order/       CreateOrderView
# listingsApi.submitOffer(1)       POST /api/listings/1/offer/       SubmitOfferView
# listingsApi.updateStatus(1)      PATCH /api/listings/1/status/     UpdateListingStatusView