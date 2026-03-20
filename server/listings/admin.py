from django.contrib import admin

from .models import Listing, Order, Report, Offer, Review, Wishlist


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'seller', 'price', 'quantity', 'status', 'campus', 'is_active', 'created_at')
    list_filter = ('status', 'campus', 'type', 'condition', 'is_active')
    search_fields = ('title', 'seller__email', 'seller__username', 'category')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'buyer', 'seller', 'amount', 'created_at')
    search_fields = ('listing__title', 'buyer__email', 'seller__email')


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'listing', 'reporter', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('listing__title', 'reporter__email', 'reason')


admin.site.register(Offer)
admin.site.register(Review)
admin.site.register(Wishlist)
