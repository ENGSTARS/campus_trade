from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('listings', '0003_report_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='listing',
            name='quantity',
            field=models.PositiveIntegerField(default=1),
        ),
    ]
