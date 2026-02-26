from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import Profile
from .serializers import RegisterSerializer, ProfileSerializer

# --- REGISTRATION ---
@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    """
    API view to register a new user and send verification email.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate verification link
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        verify_url = reverse("verify_email", kwargs={"uidb64": uid, "token": token})
        verify_link = request.build_absolute_uri(verify_url)

        send_mail(
            subject="Verify your email",
            message=f"Click this link to verify your account:\n{verify_link}",
            from_email="bazu7642@gmail.com",
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({"message": "User registered. Check email to verify."}, status=status.HTTP_201_CREATED)
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
            "user": {"id": user.id, "email": user.email}
        }, status=status.HTTP_200_OK)
    
    return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# --- PROFILE VIEWS ---
@api_view(["GET"])
@permission_classes([AllowAny])
def public_profile(request, pk):
    user = get_object_or_404(User, pk=pk)
    profile = get_object_or_404(Profile, user=user)
    serializer = ProfileSerializer(profile)
    return Response(serializer.data)

@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_setup(request):
    profile = Profile.objects.get(user=request.user)
    if request.method == "GET":
        return Response(ProfileSerializer(profile).data)
    
    serializer = ProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Profile updated"})
    return Response(serializer.errors, status=400)

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