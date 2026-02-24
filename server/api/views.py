from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from django.core.mail import send_mail
import time
import secrets
from .models import Profile
from django.contrib.auth.decorators import login_required
from .serializers import PasswordResetConfirmSerializer, RegisterSerializer, ProfileSerializer, TwoFASerializer, passwordResetSerializer
from rest_framework.decorators import api_view, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import BasicAuthentication



# REGISTER
@csrf_exempt
@api_view(["POST"])
def register(request):
    """
    API view to register a new user and create profile with email verification.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        # Save user and profile
        user = serializer.save()
        profile = Profile.objects.get(user=user)  # profile created via signal
        # profile fields already set in serializer (full_name, contact)

        # Generate email verification token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        verify_url = reverse("verify_email", kwargs={"uidb64": uid, "token": token})
        verify_link = request.build_absolute_uri(verify_url)

        # Send verification email
        send_mail(
            subject="Verify your email",
            message=f"Click this link to verify your account:\n{verify_link}",
            from_email="bazu7642@gmail.com",  # replace with your email
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"message": "User registered successfully. Check your email to verify your account."},
            status=status.HTTP_201_CREATED,
        )

    # Return serializer errors
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# EMAIL VERIFICATION
@csrf_exempt
@api_view(["GET"])
def verify_email(request, uidb64, token):
    """
    API to verify user's email from the verification link.
    """
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        user = None

    if user and default_token_generator.check_token(user, token):
        user.is_active = True
        user.save()
        return Response({"message": "Email verified successfully. You can now log in."}, status=200)

    return Response({"error": "Invalid or expired link"}, status=400)


# LOGIN (STEP 1 → SEND 2FA)
@csrf_exempt
@api_view(["POST"])
def login_view(request):
    """
    Login API with email 2FA code
    """
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)

    user = authenticate(username=email, password=password)

    if user is None or not user.is_active:
        return Response({"error": "Invalid credentials or email not verified"}, status=400)

    # generate 2FA code
    code = str(secrets.randbelow(900000) + 100000)  # 6-digit code

    # clear previous session data
    request.session.pop("2fa_code", None)
    request.session.pop("pre_2fa_user", None)
    request.session.pop("2fa_time", None)
    request.session.pop("2fa_attempts", None)

    # store 2FA data in session
    request.session["pre_2fa_user"] = user.pk
    request.session["2fa_code"] = code
    request.session["2fa_time"] = time.time()
    request.session["2fa_attempts"] = 0

    # send 2FA code by email
    send_mail(
        "Your login code",
        f"Your login code is: {code}",
        "bazu7642@gmail.com",
        [email],
        fail_silently=False,
    )

    return Response({"message": "2FA code sent to email"}, status=200)

@csrf_exempt
@api_view(["POST"])
def verify_2fa(request):
    """
    API endpoint to verify 2FA code sent by email.
    """
    serializer = TwoFASerializer(data=request.data)
    if serializer.is_valid():
        code = serializer.validated_data["code"]

        user_pk = request.session.get("pre_2fa_user")
        session_code = request.session.get("2fa_code")
        code_time = request.session.get("2fa_time")
        attempts = request.session.get("2fa_attempts", 0)

        if not user_pk or not session_code:
            return Response({"error": "No 2FA session found. Please login again."}, status=400)

        # Expire code after 5 minutes
        if code_time and time.time() - code_time > 300:
            for key in ["2fa_code", "pre_2fa_user", "2fa_time", "2fa_attempts"]:
                request.session.pop(key, None)
            return Response({"error": "Code expired. Please login again."}, status=400)

        # Too many attempts
        if attempts >= 5:
            return Response({"error": "Too many attempts. Please login again."}, status=400)

        # Check code
        if session_code and secrets.compare_digest(code, session_code):
            user = User.objects.get(pk=user_pk)
            login(request, user)  # Django session login

            # Clear 2FA session
            for key in ["2fa_code", "pre_2fa_user", "2fa_time", "2fa_attempts"]:
                request.session.pop(key, None)

            # Check profile completeness
            profile = Profile.objects.get(user=user)
            profile_complete = profile.is_complete()

            return Response({
                "message": "Login successful",
                "profile_complete": profile_complete
            }, status=200)
        else:
            request.session["2fa_attempts"] = attempts + 1
            return Response({"error": "Invalid code"}, status=400)

    return Response(serializer.errors, status=400)

@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
def resend_2fa_code(request):
    """
    API to resend a new 2FA code using the email provided in the POST request.
    Limits resends to 3 attempts per session and resets expiry timer.
    """
    email = request.data.get("email")  
    if not email:
        return Response({"error": "Email is required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid email"}, status=400)

    # Use a session key per email to track attempts
    session_key = f"2fa_attempts_{user.pk}"
    attempts = request.session.get(session_key, 0)
    if attempts >= 3:
        return Response({"error": "Maximum resend attempts reached."}, status=400)

    # Generate new secure 6-digit code
    code = str(secrets.randbelow(900000) + 100000)

    # Store code and timestamp in session, using user PK to avoid conflicts
    request.session[f"2fa_code_{user.pk}"] = code
    request.session[f"2fa_time_{user.pk}"] = time.time()
    request.session[session_key] = attempts + 1

    # Send code by email
    send_mail(
        "Your new login code",
        f"Your new 2FA code is: {code}",
        "bazu7642@gmail.com",
        [user.email],
        fail_silently=False,
    )

    return Response({"message": "A new 2FA code has been sent to your email."}, status=200)


@csrf_exempt
@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
def profile_setup(request):
    """
    API endpoint to view or update the user's profile.
    GET: fetch current profile data
    PUT: update profile fields
    """
    profile = Profile.objects.get(user=request.user)

    if request.method == "GET":
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully"}, status=200)
        return Response(serializer.errors, status=400)

@csrf_exempt
@login_required
def home(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)

    return render(request, "accounts/home.html", {
        "user": request.user,
        "profile": profile
    })

@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
def password_reset_request(request):
    """
    API endpoint to request a password reset email.
    """
    serializer = passwordResetSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            user = None

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = request.build_absolute_uri(
                reverse("password_reset_confirm", args=[uid, token])
            )

            send_mail(
                subject="Reset your password",
                message=f"Click here to reset your password: {reset_link}",
                from_email="bazu7642@gmail.com",
                recipient_list=[email],
                fail_silently=False,
            )

        # Always return same response to avoid leaking emails
        return Response(
            {"message": "If an account with that email exists, a reset link has been sent."},
            status=200
        )

    return Response(serializer.errors, status=400)

@csrf_exempt
@api_view(["POST"])
@authentication_classes([BasicAuthentication])
def password_reset_confirm(request, uidb64, token):
    """
    API endpoint to reset password using uidb64 + token from email link
    """
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({"error": "Invalid link"}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({"error": "Invalid or expired token"}, status=400)

    serializer = PasswordResetConfirmSerializer(data=request.data)
    if serializer.is_valid():
        password = serializer.validated_data["new_password"]
        user.set_password(password)
        user.save()
        return Response({"message": "Password reset successfully"}, status=200)

    return Response(serializer.errors, status=400)

@api_view(["GET"])
def password_reset_sent(request):
    return Response({
        "status": "success",
        "message": "Password reset email has been sent."
    })


@api_view(["GET"])
def password_reset_complete(request):
    return Response({
        "status": "success",
        "message": "Password has been reset successfully. You can now login."
    })


@api_view(["GET"])
def password_reset_invalid(request):
    return Response({
        "status": "error",
        "message": "Reset link is invalid or expired."
    }, status=400)

