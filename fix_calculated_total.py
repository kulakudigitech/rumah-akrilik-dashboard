import os
import django
import time

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from decimal import Decimal
from rumah_akrilik_app.models import Order, OrderItem

def fix_order_totals():
    orders = Order.objects.all()
    updated_count = 0
    
    print(f"Total orders to process: {orders.count()}")
    
    for order in orders:
        # Hitung total item
        item_total = Decimal('0')
        for item in order.items.all():
            try:
                unit_price = Decimal(str(item.unit_price or 0))
                qty = Decimal(str(item.quantity or 0))
                item_total += unit_price * qty
            except Exception as e:
                print(f"Error calculating item {item.id} total: {e}")
                
        # Tambahkan biaya tambahan
        total = item_total
        if order.biaya_pasang:
            total += order.biaya_pasang
        if order.biaya_survey:
            total += order.biaya_survey
        if order.shipping_cost:
            total += order.shipping_cost
            
        # Update langsung di database untuk bypass method save()
        Order.objects.filter(id=order.id).update(calculated_total=total)
        updated_count += 1
        
        if updated_count % 10 == 0:
            print(f"Updated {updated_count} orders...")
            time.sleep(0.1)  # Berikan sedikit jeda untuk menghindari load server
        
    print(f"Successfully updated calculated_total for {updated_count} orders")

if __name__ == '__main__':
    fix_order_totals()