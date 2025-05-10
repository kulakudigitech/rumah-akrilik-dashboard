from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('rumah_akrilik_app', '0011_auto_20250502_1200'),  # Update this to your actual latest migration
    ]

    operations = [
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['order_date'], name='order_date_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['calculated_total'], name='order_total_idx'),
        ),
        migrations.AddIndex(
            model_name='orderitem',
            index=models.Index(fields=['order'], name='orderitem_order_idx'),
        ),
    ]