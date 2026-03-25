from django.db import migrations


def normalize_listing_inventory_status(apps, schema_editor):
    Listing = apps.get_model('listings', 'Listing')

    for listing in Listing.objects.all().iterator():
        next_quantity = max(0, listing.quantity or 0)
        if next_quantity == 0:
            next_status = 'SOLD'
        elif listing.status == 'RESERVED' and next_quantity == 1:
            next_status = 'RESERVED'
        else:
            next_status = 'AVAILABLE'

        changed_fields = []
        if listing.quantity != next_quantity:
            listing.quantity = next_quantity
            changed_fields.append('quantity')
        if listing.status != next_status:
            listing.status = next_status
            changed_fields.append('status')

        if changed_fields:
            listing.save(update_fields=changed_fields)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0005_normalize_listing_type_values'),
    ]

    operations = [
        migrations.RunPython(normalize_listing_inventory_status, noop_reverse),
    ]
