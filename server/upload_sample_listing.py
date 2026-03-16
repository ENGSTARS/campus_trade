import os
import django
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from listings.models import Listing, Review, Offer
from django.contrib.auth.models import User
from api.models import Profile
from django.core.exceptions import ObjectDoesNotExist

# Path to sample data
SAMPLE_PATH = '../client/sample_listing.json'

try:
    with open(SAMPLE_PATH) as f:
        data = json.load(f)
except Exception as e:
    print(f"Error loading sample data: {e}")
    exit(1)

try:
    seller = User.objects.get(id=data['sellerId'])
except ObjectDoesNotExist:
    print(f"Seller with id {data['sellerId']} does not exist.")
    exit(1)

listing = Listing.objects.create(
    title=data['title'],
    description=data['description'],
    price=data['price'],
    category=data['category'],
    campus=data['campus'],
    condition=data['condition'],
    type=data['type'],
    status=data['status'],
    seller=seller
)

Profile.objects.filter(user=seller).update(bio=data['bio'], contact=data['contact'])

for url in data['images']:
    listing.images.create(image=url)

for r in data['reviews']:
    Review.objects.create(
        listing=listing,
        reviewer_name=r['reviewer_name'],
        rating=r['rating'],
        content=r['comment'],
        created_at=r['created_at']
    )

for o in data['offers']:
    Offer.objects.create(
        listing=listing,
        buyer_id=o['buyer'],
        amount=o['amount'],
        created_at=o['created_at']
    )

print("Sample listing uploaded successfully.")
