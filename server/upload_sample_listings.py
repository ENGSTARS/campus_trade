import itertools
import json
import os
import random
from decimal import Decimal
from pathlib import Path

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User

from listings.models import Listing, Offer, Review

BASE_DIR = Path(__file__).resolve().parent
SAMPLE_PATH = BASE_DIR.parent / 'client' / 'sample_listings.json'
DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80'

CATALOG = [
    {
        'title': 'Data Structures Textbook',
        'description': 'Clean copy with a few highlights. Useful for coursework and exam prep.',
        'price': Decimal('32.00'),
        'category': 'Books',
        'condition': 'Good',
        'type': 'SECOND_HAND',
    },
    {
        'title': 'Wireless Keyboard and Mouse Set',
        'description': 'Reliable study setup for the library or dorm desk. Batteries included.',
        'price': Decimal('28.00'),
        'category': 'Electronics',
        'condition': 'Like New',
        'type': 'NEW',
    },
    {
        'title': 'Desk Lamp',
        'description': 'Bright adjustable lamp for late-night reading and project work.',
        'price': Decimal('18.00'),
        'category': 'Furniture',
        'condition': 'Good',
        'type': 'NEW',
    },
    {
        'title': 'Campus Hoodie',
        'description': 'Warm hoodie in good condition. Great for early classes and evening study sessions.',
        'price': Decimal('22.00'),
        'category': 'Fashion',
        'condition': 'Good',
        'type': 'SECOND_HAND',
    },
    {
        'title': 'Graphing Calculator',
        'description': 'Fully functional calculator with fresh batteries, ready for math and engineering units.',
        'price': Decimal('55.00'),
        'category': 'Electronics',
        'condition': 'Very Good',
        'type': 'SECOND_HAND',
    },
    {
        'title': 'Mini Rice Cooker',
        'description': 'Compact cooker for dorm cooking. Works well and is easy to clean.',
        'price': Decimal('30.00'),
        'category': 'Appliances',
        'condition': 'Good',
        'type': 'SECOND_HAND',
    },
    {
        'title': 'Office Chair',
        'description': 'Comfortable chair with adjustable height, ideal for coding or revision marathons.',
        'price': Decimal('64.00'),
        'category': 'Furniture',
        'condition': 'Like New',
        'type': 'SECOND_HAND',
    },
    {
        'title': 'Study Notes Bundle',
        'description': 'Organized notes and summaries for multiple units, printed and spiral bound.',
        'price': Decimal('14.00'),
        'category': 'Books',
        'condition': 'New',
        'type': 'NEW',
    },
]


def load_sample_json():
    try:
        with open(SAMPLE_PATH, encoding='utf-8') as handle:
            return json.load(handle)
    except Exception as exc:
        print(f'Error loading sample data: {exc}')
        return []


def normalize_seed_item(item):
    normalized_type = item.get('type', 'SECOND_HAND')
    if normalized_type == 'Sale':
        normalized_type = 'SECOND_HAND'

    condition = item.get('condition', 'Good')
    condition = (
        condition.replace('Used - ', '')
        .replace('Used-', '')
        .strip()
        or 'Good'
    )

    return {
        'title': item['title'],
        'description': item['description'],
        'price': Decimal(str(item['price'])),
        'category': item['category'],
        'condition': condition,
        'type': normalized_type,
    }


def seed_templates():
    templates = [*CATALOG]
    templates.extend(normalize_seed_item(item) for item in load_sample_json())
    return templates


def ensure_listing_media():
    updated = 0
    for listing in Listing.objects.all():
        needs_image = not listing.image_urls
        needs_quantity = listing.quantity <= 0 and listing.status != 'SOLD'
        if needs_image:
            listing.image_urls = [DEFAULT_IMAGE_URL]
        if needs_quantity:
            listing.quantity = 1
        if needs_image or needs_quantity:
            listing.save(update_fields=['image_urls', 'quantity'])
            updated += 1
    return updated


def create_reviews_and_offers(listing, all_users, review_count=1, offer_count=1):
    candidates = [user for user in all_users if user.pk != listing.seller_id]
    if not candidates:
        return

    for index in range(review_count):
        reviewer = candidates[(listing.seller_id + index) % len(candidates)]
        Review.objects.get_or_create(
            listing=listing,
            reviewer=reviewer,
            defaults={
                'rating': random.choice([4, 5]),
                'content': 'Smooth meetup, fair pricing, and the product matched the description.',
            },
        )

    for index in range(offer_count):
        buyer = candidates[(listing.seller_id + index + 1) % len(candidates)]
        Offer.objects.get_or_create(
            listing=listing,
            buyer=buyer,
            amount=max(Decimal('5.00'), listing.price - Decimal(str(random.randint(2, 8)))),
        )


def upload_sample_listings(listings_per_user=3):
    templates = seed_templates()
    all_users = list(User.objects.filter(is_superuser=False).order_by('id'))
    if not all_users:
        print('No regular users found. Please run create_sample_users.py first.')
        return

    template_cycle = itertools.cycle(templates)
    created = 0

    for user in all_users:
        campus = getattr(user.profile, 'campus', '') or 'Main Campus'
        existing_titles = set(Listing.objects.filter(seller=user).values_list('title', flat=True))

        user_created = 0
        while user_created < listings_per_user:
            template = next(template_cycle)
            title = f"{template['title']} - {user.profile.full_name.split(' ')[0]}"
            if title in existing_titles:
                continue

            quantity = random.randint(1, 5)
            listing = Listing.objects.create(
                title=title,
                description=template['description'],
                price=template['price'],
                category=template['category'],
                campus=campus,
                condition=template['condition'],
                type=template['type'],
                status='AVAILABLE',
                quantity=quantity,
                seller=user,
                image_urls=[DEFAULT_IMAGE_URL],
            )
            create_reviews_and_offers(listing, all_users)
            existing_titles.add(title)
            created += 1
            user_created += 1
            print(f'Created listing for {user.email}: {listing.title}')

    updated_existing = ensure_listing_media()
    print(f'Created {created} new listings and refreshed {updated_existing} existing listings.')


if __name__ == '__main__':
    print('Uploading sample listings...')
    upload_sample_listings()
    print('Sample listings uploaded successfully.')
