from django.contrib.auth.models import User
from api.models import Profile

# Create a test user
user, created = User.objects.get_or_create(
    username='testuser',
    email='testuser@example.com',
    defaults={'is_active': True}
)
if created:
    user.set_password('testpassword')
    user.save()
    print('Test user created.')
else:
    print('Test user already exists.')

# Ensure profile exists
profile, _ = Profile.objects.get_or_create(user=user)
profile.full_name = 'Test User'
profile.bio = 'Sample bio for test user.'
profile.campus = 'Main Campus'
profile.contact = '1234567890'
profile.save()
print('Test user profile updated.')
print(f'Test user ID: {user.id}')
