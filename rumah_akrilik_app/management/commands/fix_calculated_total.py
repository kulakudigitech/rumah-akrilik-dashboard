# Buat file dengan nama fix_calculated_total.py dalam folder management/commands
# filepath: c:\Users\mbote\OneDrive\Desktop\rumah akrilik\Rumah Akrilik\rumah_akrilik_app\management\commands\fix_calculated_total.py

from django.core.management.base import BaseCommand
from rumah_akrilik_app.models import Order, OrderItem
from decimal import Decimal

class Command(BaseCommand):
    help = 'Populasi field calculated_total pada Order yang sudah ada'

    def handle(self, *args, **options):
        # Buat direktori jika belum ada
        import os
        os.makedirs('rumah_akrilik_app/management/commands', exist_ok=True)
        
        orders = Order.objects.all()
        updated_count = 0
        
        for order in orders:
            # Hitung ulang total dari items
            items_total = Decimal('0.0')
            for item in order.items.all():
                if hasattr(item, 'quantity') and hasattr(item, 'unit_price'):
                    try:
                        qty = Decimal(str(item.quantity or 0))
                        price = Decimal(str(item.unit_price or 0))
                        items_total += qty * price
                    except (ValueError, TypeError):
                        self.stdout.write(
                            self.style.WARNING(f"Gagal konversi nilai untuk item {item.id} di order {order.id}")
                        )
            
            # Tambah biaya tambahan
            total = items_total
            if hasattr(order, 'biaya_pasang') and order.biaya_pasang:
                try:
                    total += Decimal(str(order.biaya_pasang))
                except (ValueError, TypeError):
                    pass
            if hasattr(order, 'biaya_survey') and order.biaya_survey:
                try:
                    total += Decimal(str(order.biaya_survey))
                except (ValueError, TypeError):
                    pass
            if hasattr(order, 'shipping_cost') and order.shipping_cost:
                try:
                    total += Decimal(str(order.shipping_cost))
                except (ValueError, TypeError):
                    pass
                
            # Update field calculated_total tanpa memanggil save() yang overridden
            # Gunakan update() langsung pada queryset
            Order.objects.filter(id=order.id).update(calculated_total=total)
            updated_count += 1
            
        self.stdout.write(
            self.style.SUCCESS(f'Berhasil mengupdate calculated_total pada {updated_count} order')
        )