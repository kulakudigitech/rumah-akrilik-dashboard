from rumah_akrilik_app.models import ProductionStage

stages = [
    {'name': 'Desain', 'order': 1, 'description': 'Pembuatan dan finalisasi desain'},
    {'name': 'Operator Mesin', 'order': 2, 'description': 'Proses pemotongan dan pengerjaan mesin'},
    {'name': 'Finishing', 'order': 3, 'description': 'Proses finishing dan perakitan'},
    {'name': 'Quality Control', 'order': 4, 'description': 'Pemeriksaan kualitas produk'},
    {'name': 'Packing', 'order': 5, 'description': 'Pengemasan produk untuk pengiriman'},
    {'name': 'Siap Kirim/Pasang', 'order': 6, 'description': 'Produk siap untuk dikirim atau dipasang'}
]

for stage_data in stages:
    obj, created = ProductionStage.objects.get_or_create(
        name=stage_data['name'],
        defaults={
            'order': stage_data['order'],
            'description': stage_data.get('description', ''),
            'is_active': True
        }
    )
    print(f"{'Created' if created else 'Already exists'}: {obj.name}")

print("Production stages created successfully!")