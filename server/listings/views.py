from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import Listing
from .serializers import ListingSerializer
from django.views.decorators.csrf import csrf_exempt


@api_view(["POST"])
@permission_classes([AllowAny])
@csrf_exempt
def create_listing(request):
    serializer = ListingSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save(seller=request.user)
        return Response(serializer.data, status=201)

    return Response(serializer.errors, status=400)


@api_view(["GET"])
def listings_home(request):
    listings = Listing.objects.filter(status="available")

    condition = request.GET.get("condition")
    category = request.GET.get("category")
    min_price = request.GET.get("min_price")
    max_price = request.GET.get("max_price")
    search = request.GET.get("search")

    if condition:
        listings = listings.filter(condition=condition)

    if category:
        listings = listings.filter(category__name__icontains=category)

    if min_price:
        listings = listings.filter(price__gte=min_price)

    if max_price:
        listings = listings.filter(price__lte=max_price)

    if search:
        listings = listings.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search)
        )

    serializer = ListingSerializer(listings, many=True)
    return Response(serializer.data)

@api_view(["PUT"])
@permission_classes([AllowAny])
def edit_listing(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id, seller=request.user)

    serializer = ListingSerializer(listing, data=request.data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)

    return Response(serializer.errors, status=400)

@api_view(["DELETE"])
@permission_classes([AllowAny])
def delete_listing(request, listing_id):
    listing = get_object_or_404(Listing, id=listing_id, seller=request.user)
    listing.delete()

    return Response({"message": "Listing deleted successfully"}, status=204)