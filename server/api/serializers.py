from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Profile

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False)
    contact = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["email", "password", "confirm_password", "full_name", "contact"]

    def validate(self, data):
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "")
        contact = validated_data.pop("contact", "")
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
            is_active=False
        )

        # Create Profile manually (signals also run)
        profile = Profile.objects.get(user=user)
        profile.full_name = full_name
        profile.contact = contact
        profile.save()

        return user
    
    
class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ["full_name", "profile_picture", "contact"]
        
        
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