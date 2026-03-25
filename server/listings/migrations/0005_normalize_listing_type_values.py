from django.db import migrations, models


def normalize_listing_types(apps, schema_editor):
    Listing = apps.get_model('listings', 'Listing')

    Listing.objects.filter(type__iexact='sale').update(type='SECOND_HAND')
    Listing.objects.filter(type__iexact='rent').update(type='SECOND_HAND')
    Listing.objects.filter(type='').update(type='SECOND_HAND')

    for listing in Listing.objects.exclude(type__in=['NEW', 'SECOND_HAND']).iterator():
        condition = (listing.condition or '').strip().lower()
        listing.type = 'NEW' if condition == 'new' else 'SECOND_HAND'
        listing.save(update_fields=['type'])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0004_listing_quantity'),
    ]

    operations = [
        migrations.RunPython(normalize_listing_types, noop_reverse),
        migrations.AlterField(
            model_name='listing',
            name='type',
            field=models.CharField(
                choices=[('NEW', 'New'), ('SECOND_HAND', 'Second Hand')],
                max_length=50,
            ),
        ),
    ]
