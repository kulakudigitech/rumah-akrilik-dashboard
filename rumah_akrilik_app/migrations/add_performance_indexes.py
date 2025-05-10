from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('rumah_akrilik_app', '0010_merge_20250502_1618'),  # Sesuaikan dengan migrasi terakhir
    ]

    operations = [
        # Tambahkan indeks untuk cepat pencarian
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['order_date'], name='order_date_idx'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['calculated_total'], name='calc_total_idx'),
        ),
        migrations.AddIndex(
            model_name='orderitem',
            index=models.Index(fields=['order'], name='order_item_idx'),
        ),
        # Tambahan indeks untuk ProductionJob
        migrations.AddIndex(
            model_name='productionjob',
            index=models.Index(fields=['status'], name='prod_status_idx'),
        ),
    ]