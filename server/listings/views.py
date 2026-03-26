from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.db import transaction
import base64
import requests
from api.models import Notification
from .models import (
    Listing, Wishlist, Review,
    Report, Order, Offer
)
from .serializers import (
    ListingSerializer, ReviewSerializer,
    ReportSerializer, OrderSerializer, OfferSerializer,
)

IMGBB_API_KEY = getattr(settings, 'IMGBB_API_KEY', '')


# ── GET /api/listings/   POST /api/listings/ ─────────────────────
class ListingListCreateView(generics.ListCreateAPIView):
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        include_inactive = self.request.query_params.get('includeInactive') in {'1', 'true', 'True'}
        seller_id = self.request.query_params.get('sellerId')
        is_admin = bool(
            self.request.user
            and self.request.user.is_authenticated
            and (self.request.user.is_staff or self.request.user.is_superuser)
        )

        if include_inactive and is_admin:
            qs = Listing.objects.all()
        else:
            qs = Listing.objects.filter(is_active=True)

        if seller_id:
            qs = qs.filter(seller_id=seller_id)

        # Filter by X-Campus header sent by axiosClient
        campus = self.request.headers.get('X-Campus')
        if campus:
            qs = qs.filter(campus=campus)

        # Filter by query params
        category = self.request.query_params.get('category')
        search   = self.request.query_params.get('search')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        condition = self.request.query_params.get('condition')
        type_     = self.request.query_params.get('type')

        if category:  qs = qs.filter(category=category)
        if search:    qs = qs.filter(title__icontains=search)
        if min_price: qs = qs.filter(price__gte=min_price)
        if max_price: qs = qs.filter(price__lte=max_price)
        if condition: qs = qs.filter(condition=condition)
        if type_:     qs = qs.filter(type=type_)

        return qs

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        campus = self.request.data.get('campus') or self.request.headers.get('X-Campus', '')
        raw_quantity = self.request.data.get('quantity', 1)
        try:
            quantity = max(0, int(raw_quantity))
        except (TypeError, ValueError):
            quantity = 1

        serializer.save(
            seller=self.request.user,
            campus=campus,
            quantity=quantity,
            status='SOLD' if quantity == 0 else 'AVAILABLE',
        )


class MyListingsView(generics.ListAPIView):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        include_inactive = self.request.query_params.get('includeInactive') in {'1', 'true', 'True'}
        queryset = Listing.objects.filter(seller=self.request.user)
        if not include_inactive:
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('-created_at')

    def get_serializer_context(self):
        return {'request': self.request}


# ── GET /api/listings/:id/   PATCH   DELETE ──────────────────────
class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        base_queryset = Listing.objects.all()
        if self.request.method in {'PATCH', 'PUT', 'DELETE'}:
            return base_queryset.filter(seller=self.request.user, is_active=True)
        return base_queryset.filter(is_active=True)

    def get_object(self):
        instance = super().get_object()
        if self.request.method in {'PATCH', 'PUT', 'DELETE'} and instance.seller_id != self.request.user.id:
            raise ValidationError({'error': 'You can only modify your own listings.'})
        return instance

    def perform_update(self, serializer):
        campus = self.request.data.get('campus')
        current = self.get_object()
        quantity = self.request.data.get('quantity')

        if quantity is None:
            next_quantity = current.quantity
        else:
            try:
                next_quantity = max(0, int(quantity))
            except (TypeError, ValueError):
                next_quantity = current.quantity

        requested_status = self.request.data.get('status')
        if next_quantity == 0:
            next_status = 'SOLD'
        elif requested_status == 'SOLD':
            next_quantity = 0
            next_status = 'SOLD'
        elif requested_status == 'RESERVED':
            if next_quantity != 1:
                raise ValidationError({'status': 'Reserved status is only allowed when quantity is exactly 1.'})
            next_status = 'RESERVED'
        elif requested_status == 'AVAILABLE':
            next_status = 'AVAILABLE'
        else:
            next_status = 'RESERVED' if current.status == 'RESERVED' and next_quantity == 1 else 'AVAILABLE'

        if campus is not None:
            serializer.save(campus=campus, quantity=next_quantity, status=next_status)
            return
        serializer.save(quantity=next_quantity, status=next_status)

    def perform_destroy(self, instance):
        # Soft delete — don't actually remove from DB
        instance.is_active = False
        instance.save()


class ListingImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not IMGBB_API_KEY:
            return Response(
                {'error': 'IMGBB_API_KEY is not configured on the server.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'Image file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        encoded_image = base64.b64encode(image_file.read()).decode('utf-8')

        try:
            response = requests.post(
                'https://api.imgbb.com/1/upload',
                data={
                    'key': IMGBB_API_KEY,
                    'image': encoded_image,
                    'name': image_file.name,
                },
                timeout=30,
            )
            response.raise_for_status()
            payload = response.json().get('data', {})
        except requests.RequestException as exc:
            return Response(
                {'error': f'Could not upload image to ImgBB: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        image_url = payload.get('url')
        if not image_url:
            return Response(
                {'error': 'ImgBB did not return an image URL.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        return Response({'imageUrl': image_url}, status=status.HTTP_201_CREATED)


# ── GET /api/listings/:id/related/ ───────────────────────────────
class RelatedListingsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)
        related = Listing.objects.filter(
            category=listing.category,
            is_active=True,
            status='AVAILABLE'
        ).exclude(pk=pk)[:3]
        serializer = ListingSerializer(
            related, many=True, context={'request': request}
        )
        return Response({'items': serializer.data})


# ── POST /api/listings/:id/wishlist/ ─────────────────────────────
class ToggleWishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing = get_object_or_404(Listing, pk=pk)
        item, created = Wishlist.objects.get_or_create(
            user=request.user,
            listing=listing,
        )
        if not created:
            item.delete()
            return Response({'success': True, 'wishlisted': False})
        return Response({'success': True, 'wishlisted': True})


# ── POST /api/listings/:id/report/ ───────────────────────────────
class ReportListingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing    = get_object_or_404(Listing, pk=pk)
        serializer = ReportSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(reporter=request.user, listing=listing)
            return Response({'success': True})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── POST /api/listings/:id/review/ ───────────────────────────────
class SubmitReviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing    = get_object_or_404(Listing, pk=pk)
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(reviewer=request.user, listing=listing)
            return Response({'success': True})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── POST /api/listings/:id/order/ ────────────────────────────────
class CreateOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        with transaction.atomic():
            listing = get_object_or_404(Listing.objects.select_for_update(), pk=pk, is_active=True)
            if listing.seller_id == request.user.id:
                return Response(
                    {'error': 'You cannot place an order on your own listing.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if listing.status != 'AVAILABLE':
                return Response(
                    {'error': 'This listing is not available for ordering.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if listing.quantity <= 0:
                listing.status = 'SOLD'
                listing.save(update_fields=['status'])
                return Response(
                    {'error': 'This item is out of stock.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            order = Order.objects.create(
                listing=listing,
                buyer=request.user,
                seller=listing.seller,
                amount=listing.price,
            )
            listing.quantity = max(0, listing.quantity - 1)
            listing.status = 'SOLD' if listing.quantity == 0 else 'AVAILABLE'
            listing.save(update_fields=['quantity', 'status'])
            Notification.objects.create(
                recipient=listing.seller,
                title='New order placed',
                body=f'{request.user.profile.full_name or request.user.email} placed an order for "{listing.title}".',
            )
        return Response({
            'success':  True,
            'message':  'Order request placed',
            'order_id': order.id,
            'quantity': listing.quantity,
            'status': listing.status,
        })


# ── POST /api/listings/:id/offer/ ────────────────────────────────
class SubmitOfferView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        listing    = get_object_or_404(Listing, pk=pk)
        serializer = OfferSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(buyer=request.user, listing=listing)
            return Response({
                'success': True,
                'message': 'Offer sent to seller'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── PATCH /api/listings/:id/status/ ──────────────────────────────
class UpdateListingStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        # Only the seller can update their listing status
        listing    = get_object_or_404(Listing, pk=pk, seller=request.user)
        new_status = request.data.get('status')
        allowed    = [s[0] for s in Listing.STATUS_CHOICES]

        if new_status not in allowed:
            return Response(
                {'error': f'Invalid status. Choose from: {allowed}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == 'AVAILABLE' and listing.quantity == 0:
            return Response(
                {'error': 'Restock quantity before marking this listing as available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == 'RESERVED' and listing.quantity != 1:
            return Response(
                {'error': 'Reserved status is only allowed when quantity is exactly 1.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        listing.status = new_status
        if new_status == 'SOLD':
            listing.quantity = 0
            listing.save(update_fields=['status', 'quantity'])
        else:
            listing.save(update_fields=['status'])
        return Response({'success': True, 'status': listing.status, 'quantity': listing.quantity})
