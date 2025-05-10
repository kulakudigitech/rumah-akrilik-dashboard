from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('rumah_akrilik_app', '0001_initial'),  # Sesuaikan dengan migrasi sebelumnya
    ]

    operations = [
        # Kita ganti operasi rename field dengan operasi dummy
        # karena field 'total_amount' sudah tidak ada
        migrations.RunPython(
            code=lambda apps, schema_editor: None,  # No-op forward
            reverse_code=lambda apps, schema_editor: None  # No-op backward
        )
    ]