from rest_framework import serializers
from .models import Listing, Category


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class ListingSerializer(serializers.ModelSerializer):
    seller = serializers.StringRelatedField(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True
    )

    class Meta:
        model = Listing
        fields = [
            "id",
            "seller",
            "title",
            "description",
            "price",
            "category",
            "category_id",
            "condition",
            "status",
           # "photos",
            "created_at",
            "updated_at",
        ]