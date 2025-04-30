import django_filters
from .models import Order, Product, Customer, Produksi, Inventory

class OrderFilter(django_filters.FilterSet):
    class Meta:
        model = Order
        fields = {
            'status': ['exact'],
            'order_date': ['exact', 'gte', 'lte'],
            'customer__name': ['icontains'],
        }

class ProductFilter(django_filters.FilterSet):
    class Meta:
        model = Product
        fields = {
            'name': ['icontains'],
            'category': ['exact'],
            'is_active': ['exact'],
        }

class CustomerFilter(django_filters.FilterSet):
    class Meta:
        model = Customer
        fields = {
            'name': ['icontains'],
            'phone': ['exact'],
            'type': ['exact'],  # Ganti 'is_business' dengan 'type' ✅
            'city': ['exact'],
            'created_at': ['gte', 'lte']
        }

class ProductionFilter(django_filters.FilterSet):
    class Meta:
        model = Produksi
        fields = {
            'tahap': ['exact'],
            'order__order_number': ['exact'],
        }

class InventoryFilter(django_filters.FilterSet):
    class Meta:
        model = Inventory
        fields = {
            'product__name': ['icontains'],
            'location': ['exact'],
            'quantity': ['lt', 'gt'],
        }
