from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Conversation, Message, Notification, Profile, UniversityEmail
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import re

UNIVERSITY_EMAIL_REGEX = re.compile(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]*\.(edu|ac\.[a-z]{2,})$', re.IGNORECASE)

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = self.fields['username']
        self.fields['email'].source = 'username'
        del self.fields['username']

    def validate(self, attrs):
        email = attrs.get('email') or attrs.get('username') or self.initial_data.get('email')
        if email:
            attrs['username'] = email.lower()
        data = super().validate(attrs)
        profile = Profile.objects.get(user=self.user)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'role': 'admin' if self.user.is_superuser else 'student',
            'isStaff': self.user.is_staff,
            'isSuperuser': self.user.is_superuser,
            'fullName': profile.full_name,
            'bio': profile.bio,
            'campus': profile.campus,
            'contact': profile.contact,
            'avatar': profile.profile_picture.url if getattr(profile, 'profile_picture', None) else '',
        }
        return data

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)
    bio = serializers.CharField(write_only=True, required=False)
    campus = serializers.CharField(write_only=True, required=False)
    contact = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["email", "password", "confirm_password", "full_name", "bio", "campus", "contact"]

    def validate(self, data):
        email = data["email"].strip().lower()
        data["email"] = email

        if not UNIVERSITY_EMAIL_REGEX.match(email):
            raise serializers.ValidationError({"email": "Use a valid university email"})
        approved_email = UniversityEmail.objects.filter(email__iexact=email).first()
        if not approved_email:
            raise serializers.ValidationError({"email": "You are not a university student"})
        if approved_email.is_registered or User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "This university email is already registered"})
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        bio = validated_data.pop("bio", "")
        campus = validated_data.pop("campus", "")
        contact = validated_data.pop("contact", "")
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=True
        )

        # Create Profile manually (signals also run)
        profile = Profile.objects.get(user=user)
        profile.full_name = full_name
        profile.bio = bio
        profile.campus = campus
        profile.contact = contact
        profile.save()

        approved_email = UniversityEmail.objects.get(email__iexact=user.email)
        approved_email.linked_user = user
        approved_email.is_registered = True
        if full_name and not approved_email.full_name:
            approved_email.full_name = full_name
        if campus and not approved_email.campus:
            approved_email.campus = campus
        approved_email.save()

        return user
    
    
class ProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(source="profile_picture", required=False)
    class Meta:
        model = Profile
        fields = ["full_name", "bio", "campus", "avatar", "contact"]
        
        
class TwoFASerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6)
    
class passwordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
class PasswordResetConfirmSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data


class NotificationSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    isRead = serializers.BooleanField(source="is_read", read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "title", "body", "isRead", "createdAt"]


class ConversationSerializer(serializers.ModelSerializer):
    updatedAt = serializers.DateTimeField(source="updated_at", read_only=True)
    participantId = serializers.IntegerField(read_only=True)
    name = serializers.CharField(read_only=True)
    unread = serializers.IntegerField(read_only=True)
    lastMessage = serializers.CharField(read_only=True)
    listingId = serializers.IntegerField(source="listing_id", read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "participantId", "name", "unread", "lastMessage", "updatedAt", "listingId"]


class MessageSerializer(serializers.ModelSerializer):
    createdAt = serializers.DateTimeField(source="created_at", read_only=True)
    message = serializers.CharField(source="body", read_only=True)
    fromMe = serializers.BooleanField(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "message", "createdAt", "fromMe"]
