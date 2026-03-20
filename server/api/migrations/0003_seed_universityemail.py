from django.db import migrations


SEED_EMAILS = [
    ('student01@campustrade.edu', 'Student 01', 'Main Campus'),
    ('student02@campustrade.edu', 'Student 02', 'Main Campus'),
    ('student03@campustrade.edu', 'Student 03', 'Main Campus'),
    ('student04@campustrade.edu', 'Student 04', 'Main Campus'),
    ('student05@campustrade.edu', 'Student 05', 'Main Campus'),
    ('student06@campustrade.edu', 'Student 06', 'Main Campus'),
    ('student07@campustrade.edu', 'Student 07', 'Main Campus'),
    ('student08@campustrade.edu', 'Student 08', 'Main Campus'),
    ('student09@campustrade.edu', 'Student 09', 'Main Campus'),
    ('student10@campustrade.edu', 'Student 10', 'Main Campus'),
    ('katu@campustrade.edu', 'Katu', 'Main Campus'),
]


def seed_university_emails(apps, schema_editor):
    UniversityEmail = apps.get_model('api', 'UniversityEmail')
    for email, full_name, campus in SEED_EMAILS:
        UniversityEmail.objects.get_or_create(
            email=email,
            defaults={
                'full_name': full_name,
                'campus': campus,
            },
        )


def unseed_university_emails(apps, schema_editor):
    UniversityEmail = apps.get_model('api', 'UniversityEmail')
    UniversityEmail.objects.filter(email__in=[email for email, _, _ in SEED_EMAILS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_universityemail'),
    ]

    operations = [
        migrations.RunPython(seed_university_emails, unseed_university_emails),
    ]
