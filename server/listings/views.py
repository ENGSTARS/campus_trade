from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import (
    Listing, Wishlist, Review,
    Report, Order, Offer
)
from .serializers import (
    ListingSerializer, ReviewSerializer,
    ReportSerializer, OrderSerializer, OfferSerializer,
)


# ── GET /api/listings/   POST /api/listings/ ─────────────────────
class ListingListCreateView(generics.ListCreateAPIView):
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Listing.objects.filter(is_active=True)

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
        campus = self.request.headers.get('X-Campus', '')
        serializer.save(seller=self.request.user, campus=campus)


# ── GET /api/listings/:id/   PATCH   DELETE ──────────────────────
class ListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Listing.objects.all()
    serializer_class = ListingSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_destroy(self, instance):
        # Soft delete — don't actually remove from DB
        instance.is_active = False
        instance.save()


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
        listing = get_object_or_404(Listing, pk=pk, status='AVAILABLE')
        order   = Order.objects.create(
            listing=listing,
            buyer=request.user,
            seller=listing.seller,
            amount=listing.price,
        )
        # Auto-update listing status to RESERVED
        listing.status = 'RESERVED'
        listing.save()
        return Response({
            'success':  True,
            'message':  'Order request placed',
            'order_id': order.id,
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
        listing.status = new_status
        listing.save()
        return Response({'success': True, 'status': listing.status})