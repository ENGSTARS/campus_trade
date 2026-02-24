from django.db import models
from django.contrib.auth.models import User

# Choices for item condition
CONDITION_CHOICES = [
    ('new', 'New'),
    ('like_new', 'Like New'),
    ('used', 'Used'),
    ('free', 'Free'),
]

# Choices for listing status
STATUS_CHOICES = [
    ('available', 'Available'),
    ('reserved', 'Reserved'),
    ('sold', 'Sold'),
]

class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class Listing(models.Model):
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')
    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    condition = models.CharField(max_length=10, choices=CONDITION_CHOICES, default='used')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='available')
    photos = models.ImageField(upload_to='listings/', blank=True, null=True)  # single photo for now
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"
