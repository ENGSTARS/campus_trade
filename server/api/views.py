from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_str
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Count, F, Prefetch, Q
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import Conversation, ConversationParticipant, Message, Notification, Profile
from .serializers import (
    ConversationSerializer,
    EmailTokenObtainPairSerializer,
    MessageSerializer,
    NotificationSerializer,
    ProfileSerializer,
    RegisterSerializer,
)
from rest_framework_simplejwt.views import TokenObtainPairView
from listings.models import Order, Listing, Report
from listings.serializers import OrderSerializer


def build_user_payload(user, profile):
    avatar_url = profile.profile_picture.url if getattr(profile, "profile_picture", None) else ""
    return {
        "id": user.id,
        "email": user.email,
        "role": "admin" if user.is_superuser else "student",
        "isStaff": user.is_staff,
        "isSuperuser": user.is_superuser,
        "fullName": profile.full_name,
        "bio": profile.bio,
        "campus": profile.campus,
        "contact": profile.contact,
        "avatar": avatar_url,
    }


def build_admin_user_payload(user, profile):
    active_listings = Listing.objects.filter(seller=user, is_active=True).count()
    inventory_units = sum(Listing.objects.filter(seller=user, is_active=True).values_list('quantity', flat=True))
    sold_out_listings = Listing.objects.filter(seller=user, is_active=True, quantity=0).count()
    return {
        **build_user_payload(user, profile),
        "accountStatus": "Suspended" if not user.is_active else "Active",
        "dateJoined": user.date_joined,
        "lastLogin": user.last_login,
        "activeListings": active_listings,
        "inventoryUnits": inventory_units,
        "soldOutListings": sold_out_listings,
    }

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer


def ensure_admin(user):
    return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))

# --- REGISTRATION ---
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        profile = Profile.objects.get(user=user)
        return Response(
            {
                "message": "Registration successful. You can now log in.",
                "user": build_user_payload(user, profile),
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- LOGIN (Direct JWT) ---
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)

    user = authenticate(username=email, password=password)

    if user is not None:
        if not user.is_active:
            return Response({"error": "Account not verified."}, status=403)
        
        refresh = RefreshToken.for_user(user)
        profile = Profile.objects.get(user=user)

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "profile_complete": profile.is_complete(),
            "user": build_user_payload(user, profile),
        }, status=status.HTTP_200_OK)
    
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# --- PROFILE VIEWS ---
@api_view(["GET"])
@permission_classes([AllowAny])
def public_profile(request, pk):
    user = get_object_or_404(User, pk=pk)
    profile = get_object_or_404(Profile, user=user)
    return Response({"user": build_user_payload(user, profile)})

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_setup(request):
    profile = Profile.objects.get(user=request.user)
    if request.method == "GET":
        return Response({"user": build_user_payload(request.user, profile)})
    
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            "message": "Profile updated",
            "user": build_user_payload(request.user, profile),
        })
    return Response(serializer.errors, status=400)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_transactions(request):
    items = Order.objects.filter(buyer=request.user) | Order.objects.filter(seller=request.user)
    items = items.order_by("-created_at")
    serializer = OrderSerializer(items, many=True)
    return Response({"items": serializer.data})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def notifications_list(request):
    items = Notification.objects.filter(recipient=request.user)
    serializer = NotificationSerializer(items, many=True)
    return Response({"items": serializer.data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def notification_mark_read(request, notification_id):
    notification = get_object_or_404(Notification, pk=notification_id, recipient=request.user)
    if not notification.is_read:
        notification.is_read = True
        notification.save(update_fields=["is_read"])
    return Response({"success": True, "id": notification.id, "isRead": notification.is_read})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def notifications_mark_all_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({"success": True})


def build_conversation_payload(conversation, current_user):
    other_link = next(
        (link for link in conversation.participant_links.all() if link.user_id != current_user.id),
        None,
    )
    current_link = next(
        (link for link in conversation.participant_links.all() if link.user_id == current_user.id),
        None,
    )
    last_message = conversation.messages.last()
    payload = ConversationSerializer(conversation).data
    payload.update(
        {
            "participantId": other_link.user_id if other_link else current_user.id,
            "name": (
                other_link.user.profile.full_name
                or other_link.user.email
                if other_link
                else current_user.profile.full_name or current_user.email
            ),
            "unread": current_link.unread_count if current_link else 0,
            "lastMessage": last_message.body if last_message else "",
        }
    )
    return payload


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def messaging_conversations(request):
    if request.method == "GET":
        conversations = (
            Conversation.objects.filter(participants=request.user)
            .prefetch_related(
                Prefetch(
                    "participant_links",
                    queryset=ConversationParticipant.objects.select_related("user__profile"),
                ),
                "messages",
            )
            .distinct()
        )
        return Response(
            {"items": [build_conversation_payload(conversation, request.user) for conversation in conversations]}
        )

    participant_id = request.data.get("participantId")
    if not participant_id:
        return Response({"error": "participantId is required"}, status=status.HTTP_400_BAD_REQUEST)

    participant = get_object_or_404(User, pk=participant_id)
    if participant == request.user:
        return Response({"error": "You cannot message yourself."}, status=status.HTTP_400_BAD_REQUEST)

    listing_id = request.data.get("listingId")
    filters = Q(participants=request.user) & Q(participants=participant)
    if listing_id:
        filters &= Q(listing_id=listing_id)
    else:
        filters &= Q(listing__isnull=True)

    conversation = (
        Conversation.objects.filter(filters)
        .annotate(participant_total=Count("participants", distinct=True))
        .filter(participant_total=2)
        .prefetch_related(
            Prefetch(
                "participant_links",
                queryset=ConversationParticipant.objects.select_related("user__profile"),
            ),
            "messages",
        )
        .first()
    )

    if conversation is None:
        with transaction.atomic():
            conversation = Conversation.objects.create(listing_id=listing_id or None)
            ConversationParticipant.objects.create(conversation=conversation, user=request.user)
            ConversationParticipant.objects.create(conversation=conversation, user=participant)
        conversation = (
            Conversation.objects.filter(pk=conversation.pk)
            .prefetch_related(
                Prefetch(
                    "participant_links",
                    queryset=ConversationParticipant.objects.select_related("user__profile"),
                ),
                "messages",
            )
            .get()
        )

    return Response({"item": build_conversation_payload(conversation, request.user)})


@api_view(["GET", "POST", "DELETE"])
@permission_classes([IsAuthenticated])
def messaging_conversation_detail(request, conversation_id):
    conversation = get_object_or_404(
        Conversation.objects.prefetch_related(
            Prefetch(
                "participant_links",
                queryset=ConversationParticipant.objects.select_related("user__profile"),
            ),
            "messages__sender",
        ),
        pk=conversation_id,
        participants=request.user,
    )

    if request.method == "GET":
        ConversationParticipant.objects.filter(conversation=conversation, user=request.user).update(unread_count=0)
        items = [
            {
                **MessageSerializer(message).data,
                "fromMe": message.sender_id == request.user.id,
            }
            for message in conversation.messages.all()
        ]
        return Response({"items": items})

    if request.method == "DELETE":
        conversation.delete()
        return Response({"success": True, "id": conversation_id})

    body = (request.data.get("message") or "").strip()
    if not body:
        return Response({"error": "message is required"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        message = Message.objects.create(conversation=conversation, sender=request.user, body=body)
        ConversationParticipant.objects.filter(conversation=conversation).exclude(user=request.user).update(
            unread_count=F("unread_count") + 1
        )
        ConversationParticipant.objects.filter(conversation=conversation, user=request.user).update(unread_count=0)

    return Response(
        {
            "item": {
                **MessageSerializer(message).data,
                "fromMe": True,
            }
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    today = timezone.now().date()
    return Response({
        "totalUsers": User.objects.count(),
        "activeListings": Listing.objects.filter(is_active=True).count(),
        "reportsOpen": Report.objects.filter(status='Open').count(),
        "ordersToday": Order.objects.filter(created_at__date=today).count(),
        "totalInventoryUnits": sum(Listing.objects.filter(is_active=True).values_list('quantity', flat=True)),
        "soldOutListings": Listing.objects.filter(is_active=True, quantity=0).count(),
        "lowStockListings": Listing.objects.filter(is_active=True, quantity__gt=0, quantity__lte=3).count(),
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_reports(request):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    items = Report.objects.select_related('listing', 'reporter__profile').order_by('-created_at')
    return Response({
        "items": [
            {
                "id": report.id,
                "listingId": report.listing_id,
                "listingTitle": report.listing.title,
                "reason": report.reason,
                "reportedBy": {
                    "id": report.reporter_id,
                    "name": report.reporter.profile.full_name or report.reporter.email,
                },
                "createdAt": report.created_at,
                "status": report.status,
            }
            for report in items
        ]
    })


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def admin_update_report(request, report_id):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    report = get_object_or_404(Report, pk=report_id)
    next_status = request.data.get('status')
    allowed = {choice[0] for choice in Report.STATUS_CHOICES}
    if next_status not in allowed:
        return Response({"error": f"Invalid status. Choose from: {sorted(allowed)}"}, status=status.HTTP_400_BAD_REQUEST)

    report.status = next_status
    report.save(update_fields=['status'])
    return Response({"success": True, "id": report.id, "status": report.status})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_users(request):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.select_related('profile').filter(is_superuser=False).order_by('id')
    return Response({
        "items": [
            {
                "id": user.id,
                "name": user.profile.full_name or user.email,
                "email": user.email,
                "status": 'Suspended' if not user.is_active else 'Active',
            }
            for user in users
        ]
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_user_detail(request, user_id):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, pk=user_id)
    profile = get_object_or_404(Profile, user=user)
    return Response({"user": build_admin_user_payload(user, profile)})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_suspend_user(request, user_id):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, pk=user_id)
    if user.is_superuser:
        return Response({"error": "Superusers cannot be suspended."}, status=status.HTTP_400_BAD_REQUEST)

    user.is_active = False
    user.save(update_fields=['is_active'])
    return Response({"success": True})


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, user_id):
    if not ensure_admin(request.user):
        return Response({"detail": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    user = get_object_or_404(User, pk=user_id)
    if user == request.user:
        return Response({"error": "You cannot delete your own admin account."}, status=status.HTTP_400_BAD_REQUEST)
    if user.is_superuser:
        return Response({"error": "Superusers cannot be deleted."}, status=status.HTTP_400_BAD_REQUEST)

    user.delete()
    return Response({"success": True})

# --- EMAIL VERIFY ---
@api_view(["GET"])
@permission_classes([AllowAny])
def verify_email(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except: user = None
    if user and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return Response({"message": "Verified!"})
    return Response({"error": "Invalid link"}, status=400)
