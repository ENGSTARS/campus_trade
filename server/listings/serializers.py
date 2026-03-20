from rest_framework import serializers
from .models import Listing, ListingImage, Review, Report, Order, Offer
from .models import Wishlist


class SellerSerializer(serializers.Serializer):
    """Nested seller shape — matches mock: { id, name, rating, transactions }"""
    id           = serializers.IntegerField()
    name         = serializers.SerializerMethodField()
    rating       = serializers.SerializerMethodField()
    transactions = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.profile.full_name or obj.username

    def get_rating(self, obj):
        return getattr(obj.profile, 'rating', 0.0)

    def get_transactions(self, obj):
        return getattr(obj.profile, 'transactions', 0)


class ListingSerializer(serializers.ModelSerializer):
    sellerId     = serializers.IntegerField(source='seller.id',   read_only=True)
    seller       = SellerSerializer(read_only=True)
    images       = serializers.ListField(
        child=serializers.URLField(),
        source='image_urls',
        required=False,
    )
    postedAt     = serializers.DateTimeField(source='created_at', read_only=True)
    isWishlisted = serializers.SerializerMethodField()

    class Meta:
        model  = Listing
        fields = [
            'id', 'title', 'description', 'price',
            'campus', 'category', 'condition', 'type', 'status', 'quantity',
            'sellerId', 'seller', 'images', 'postedAt', 'isWishlisted',
        ]
        read_only_fields = ['sellerId', 'seller', 'postedAt', 'isWishlisted']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        uploaded_images = [
            request.build_absolute_uri(img.image.url)
            for img in instance.images.all()
            if request and img.image
        ]
        data['images'] = [*data.get('images', []), *uploaded_images]
        return data

    def get_isWishlisted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Wishlist.objects.filter(listing=obj, user=request.user).exists()
        return False


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(
        source='reviewer.profile.full_name', read_only=True
    )
    class Meta:
        model  = Review
        fields = ['id', 'rating', 'content', 'reviewer_name', 'created_at']
        read_only_fields = ['reviewer', 'created_at']


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Report
        fields = ['id', 'reason']


class OrderSerializer(serializers.ModelSerializer):
    listingId = serializers.IntegerField(source='listing.id',    read_only=True)
    buyerId   = serializers.IntegerField(source='buyer.id',      read_only=True)
    sellerId  = serializers.IntegerField(source='seller.id',     read_only=True)
    item      = serializers.CharField(source='listing.title',    read_only=True)
    status    = serializers.SerializerMethodField()
    date      = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model  = Order
        fields = ['id', 'listingId', 'buyerId', 'sellerId', 'item', 'amount', 'status', 'date']

    def get_status(self, obj):
        return 'Completed'


class OfferSerializer(serializers.ModelSerializer):
    message = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model  = Offer
        fields = ['id', 'amount', 'message']
