from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('rumah_akrilik_app', 'XXXX_create_department_table'),  # Replace XXXX with your actual migration number
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='department',
            field=models.ForeignKey('rumah_akrilik_app.Department', on_delete=models.SET_NULL, null=True, blank=True, related_name='users'),
        ),
    ]