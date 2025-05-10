import os
import django
import time
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# Import models setelah setup django
from rumah_akrilik_app.models import Order

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
        if hasattr(order, 'biaya_pasang') and order.biaya_pasang:
            try:
                total += Decimal(str(order.biaya_pasang))
            except (ValueError, TypeError) as e:
                print(f"Error adding biaya_pasang for order {order.id}: {e}")
                
        if hasattr(order, 'biaya_survey') and order.biaya_survey:
            try:
                total += Decimal(str(order.biaya_survey))
            except (ValueError, TypeError) as e:
                print(f"Error adding biaya_survey for order {order.id}: {e}")
                
        if hasattr(order, 'shipping_cost') and order.shipping_cost:
            try:
                total += Decimal(str(order.shipping_cost))
            except (ValueError, TypeError) as e:
                print(f"Error adding shipping_cost for order {order.id}: {e}")
                
        # Update langsung di database untuk bypass method save()
        Order.objects.filter(id=order.id).update(calculated_total=total)
        updated_count += 1
        
        if updated_count % 10 == 0:
            print(f"Updated {updated_count} orders...")
            time.sleep(0.1)  # Berikan sedikit jeda untuk menghindari load server
        
    print(f"Successfully updated calculated_total for {updated_count} orders")

if __name__ == '__main__':
    fix_order_totals()