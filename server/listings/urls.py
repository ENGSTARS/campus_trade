from django.urls import path
from . import views

urlpatterns = [
    path('',                        views.ListingListCreateView.as_view(),  name='listing-list-create'),
    path('<int:pk>/',               views.ListingDetailView.as_view(),      name='listing-detail'),
    path('<int:pk>/related/',       views.RelatedListingsView.as_view(),    name='listing-related'),
    path('<int:pk>/wishlist/',      views.ToggleWishlistView.as_view(),     name='listing-wishlist'),
    path('<int:pk>/report/',        views.ReportListingView.as_view(),      name='listing-report'),
    path('<int:pk>/review/',        views.SubmitReviewView.as_view(),       name='listing-review'),
    path('<int:pk>/order/',         views.CreateOrderView.as_view(),        name='listing-order'),
    path('<int:pk>/offer/',         views.SubmitOfferView.as_view(),        name='listing-offer'),
    path('<int:pk>/status/',        views.UpdateListingStatusView.as_view(),name='listing-status'),
]