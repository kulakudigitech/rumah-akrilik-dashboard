from rest_framework import serializers
from .models import (
    Order,
    Produksi,
    Absensi,
    Product,
    RealisasiKunjunganRR,
    Role,
    UserProfile
)
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = RoleSerializer(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        
    def validate_base_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Harga dasar harus lebih besar dari 0")
        return value

# Alias untuk kompatibilitas
ProdukSerializer = ProductSerializer

class RealisasiKunjunganRRSerializer(serializers.ModelSerializer):
    rr = UserSerializer(read_only=True)
    customer_detail = serializers.SerializerMethodField()
    produk_detail = ProductSerializer(source='produk', read_only=True)
    
    class Meta:
        model = RealisasiKunjunganRR
        fields = '__all__'
        read_only_fields = ['created_at']
    
    def get_customer_detail(self, obj):
        return {
            'name': obj.customer.name,
            'phone': obj.customer.phone,
            'address': obj.customer.address
        }

class OrderSerializer(serializers.ModelSerializer):
    marketing = UserSerializer(read_only=True)
    produk_detail = ProductSerializer(source='produk', read_only=True)
    
    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = ['nomor_order', 'tanggal_order', 'created_at']
        
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity harus lebih besar dari 0")
        return value

class ProduksiSerializer(serializers.ModelSerializer):
    order_detail = OrderSerializer(source='order', read_only=True)
    penanggung_jawab = UserSerializer(read_only=True)
    
    class Meta:
        model = Produksi
        fields = '__all__'
        read_only_fields = ['mulai']

class AbsensiSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = Absensi
        fields = '__all__'
        read_only_fields = ['tanggal']
        
    def validate(self, data):
        if data.get('check_out') and not data.get('check_in'):
            raise serializers.ValidationError("Check in harus diisi sebelum check out")
        return data
