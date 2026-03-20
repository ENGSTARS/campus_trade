from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0002_listing_image_urls'),
    ]

    operations = [
        migrations.AddField(
            model_name='report',
            name='status',
            field=models.CharField(
                choices=[('Open', 'Open'), ('Resolved', 'Resolved'), ('Dismissed', 'Dismissed')],
                default='Open',
                max_length=20,
            ),
        ),
    ]
