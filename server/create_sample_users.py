import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile
from faker import Faker

fake = Faker()
UNIVERSITY_DOMAIN = 'campustrade.edu'

def create_sample_users(num_users=10):
    users = []
    for index in range(num_users):
        local_part = f"{fake.user_name()}{index + 1}".lower()
        email = f"{local_part}@{UNIVERSITY_DOMAIN}"
        username = email
        password = 'password123'
        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            user.profile.full_name = fake.name()
            user.profile.bio = fake.text(max_nb_chars=200)
            user.profile.campus = 'Main Campus'
            user.profile.contact = ''.join(filter(str.isdigit, fake.phone_number()))[:10]
            user.profile.save()
            users.append(user)
            print(f"Successfully created user: {username}")
        except Exception as e:
            print(f"Could not create user {username}: {e}")
    return users

if __name__ == '__main__':
    print("Creating sample users...")
    create_sample_users(15)
    print("Sample users created successfully.")
