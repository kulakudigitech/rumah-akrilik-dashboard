import os
import django
import time
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection
from rumah_akrilik_app.models import Order, OrderItem

def fix_orders_in_batches(batch_size=50):
    """Update calculated_total untuk semua order secara batch"""
    
    total_orders = Order.objects.count()
    print(f"Total orders: {total_orders}")
    
    # Proses dalam batch untuk performa lebih baik
    processed = 0
    batch_num = 1
    
    # Loop sampai semua orders diproses
    while processed < total_orders:
        print(f"Processing batch {batch_num}...")
        
        # Ambil batch orders
        batch = Order.objects.all()[processed:processed+batch_size]
        
        # Update setiap order dalam batch
        for order in batch:
            # Hitung total dari items
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT SUM(quantity * unit_price)
                    FROM rumah_akrilik_app_orderitem
                    WHERE order_id = %s
                """, [order.id])
                
                item_total = cursor.fetchone()[0] or 0
            
            # Tambahkan biaya tambahan
            total = Decimal(str(item_total))
            if order.biaya_pasang:
                total += order.biaya_pasang
            if order.biaya_survey:
                total += order.biaya_survey
            if order.shipping_cost:
                total += order.shipping_cost
            
            # Update calculated_total langsung tanpa trigger save method
            Order.objects.filter(id=order.id).update(calculated_total=total)
        
        # Update counters
        processed += len(batch)
        batch_num += 1
        
        print(f"Processed {processed} orders of {total_orders}")
        
        # Jeda singkat antar batch
        if processed < total_orders:
            time.sleep(0.5)
    
    print("All orders have been updated!")

if __name__ == "__main__":
    fix_orders_in_batches()