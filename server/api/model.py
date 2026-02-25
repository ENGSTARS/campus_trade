from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth.models import User
from server.listings.models import Category

# Email domain Validator
university_email_validator = RegexValidator(
    regex=r'^[A-Za-z0-9._%+-]+@university\.edu$',
    message='Provide a valid email to proceed.'
)

class StudentRegistry(models.Model):
    user = models.OneToOneField(
        User,on_delete=models.CASCADE, null=True, blank=True, related_name='student_registry'
    )

    student_email = models.EmailField(unique=True, validators=[university_email_validator])
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=100)
    faculty = models.CharField(max_length=100, null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.student_email
    
    

# listing model
class Listing(models.Model):
    CATEGORY_CHOICES = [
        ('Books', 'Books'),
        ('Electronics', 'Electronics'),
    ]

    CONDITION_CHOICES = [
        ('New', 'New'),
        ('Like New', 'Like New'),
        ('Used', 'Used'),
        ('Heavily Used', 'Heavily Used'),
    ]

    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Sold', 'Sold'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='listings')

    title = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    category = models.CharField(max_length=50, choices = CATEGORY_CHOICES)
    condition = models.CharField(max_length=50, choices = CONDITION_CHOICES)
    status = models.CharField(max_length=50, choices = STATUS_CHOICES, default='Available') 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title
    
# listing image model
class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField()

    def __str__(self):
        return f"Image for {self.listing.title}"
    

# listing category model
class ListingCategory(models.Model):        
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name='listing_categories')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='category_listings')

    def __str__(self):
        return f"{self.listing.title} - {self.category.name}"
    