# /root/rumah-akrilik/rumah_akrilik_app/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import (
    CustomerAddress, ProductImage, OrderStatus, ProductionMaterial, Supplier,
    MarketingCampaign, Order, Produksi, Absensi, Product, RealisasiKunjunganRR,
    Role, UserProfile, ProductCategory, OrderItem, ProductionJob, Inventory,
    InventoryTransaction, InventoryRequest,
    Transaction, Customer, ProductionStage, ProductionTracking, Notification,
    MarketingPlan, Department, Asset
)
import logging
from decimal import Decimal, InvalidOperation # Import Decimal dan InvalidOperation

logger = logging.getLogger(__name__) # Inisialisasi logger

# ======================
# User Management
# ======================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active']
        extra_kwargs = { 'password': {'write_only': True} }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password: user.set_password(password)
        user.save()
        return user

class RoleSerializer(serializers.ModelSerializer):
    class Meta: model = Role; fields = '__all__'

# Update serializer UserProfileSerializer
class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'roles', 'phone', 'address', 'photo',  # Changed 'avatar' to 'photo' 
            'department', 'tipe_karyawan', 
            'is_active', 'created_at', 'updated_at', 'role_ids',
            'join_date'  # Added this field
        ]
    
    def update(self, instance, validated_data):
        # Handle role_ids separately
        role_ids = validated_data.pop('role_ids', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update roles if provided
        if role_ids is not None:
            instance.roles.clear()
            for role_id in role_ids:
                try:
                    role = Role.objects.get(id=role_id)
                    instance.roles.add(role)
                except Role.DoesNotExist:
                    pass
        
        return instance

# ======================
# Basic Serializers (Add these)
# ======================
class ProductBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'base_price', 'code']  # Adjust fields as needed

class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class CustomerBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email']

class OrderStatusBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderStatus
        fields = ['id', 'name']

# ======================
# Product Management
# ======================
class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta: model = ProductCategory; fields = '__all__'

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta: model = ProductImage; fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField( queryset=ProductCategory.objects.filter(is_active=True), source='category', write_only=True ) # Filter active products
    created_by = UserSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    class Meta: model = Product; fields = '__all__'; read_only_fields = ['created_at', 'updated_at', 'created_by']

# ======================
# Customer Management
# ======================
class CustomerAddressSerializer(serializers.ModelSerializer):
    class Meta: model = CustomerAddress; fields = '__all__'

class CustomerSerializer(serializers.ModelSerializer):
    addresses = CustomerAddressSerializer(many=True, read_only=True)
    class Meta: model = Customer; fields = '__all__'; read_only_fields = ['created_at']

# ======================
# Order Management
# ======================
class OrderStatusSerializer(serializers.ModelSerializer):
    class Meta: model = OrderStatus; fields = '__all__'

# --- Serializer untuk OrderItem ---
# --- PERBAIKAN OrderItemSerializer ---
class OrderItemSerializer(serializers.ModelSerializer):
    # Untuk Read (GET): Tampilkan objek produk dasar
    product = ProductBasicSerializer(read_only=True)
    # Untuk Write (POST/PUT/PATCH): Terima product_id
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source='product', # Map ke field 'product'
        write_only=True,
        label="Product ID"
    )
    # Pastikan field lain sesuai model dan kebutuhan
    nama_produk = serializers.CharField(max_length=255, required=True, allow_blank=False)
    quantity = serializers.IntegerField(min_value=1, required=True)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal('0'), required=True)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0, required=False)
    specifications = serializers.JSONField(required=False, default=dict, allow_null=True)
    notes = serializers.CharField(allow_blank=True, required=False, allow_null=True)
    total_price = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True) # Dari property model

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',      # Tampilkan ini saat GET (read_only=True di atas)
            'product_id',   # Terima ini saat POST/PUT/PATCH (write_only=True)
            'nama_produk',
            'quantity',
            'unit_price',
            'discount',
            'specifications',
            'notes',
            'total_price'
        ]
        read_only_fields = ['id', 'total_price', 'product'] # product read-only karena kita pakai product_id untuk write

    def validate(self, data):
        logger.info(f"[OrderItemSerializer Validate] Data received: {data}")
        # Validasi tambahan jika perlu
        return data
# --- AKHIR PERBAIKAN OrderItemSerializer ---

# --- Serializer untuk ProductionStage ---
class ProductionStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionStage
        fields = '__all__'

# --- Serializer untuk ProductionTracking ---
class ProductionTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionTracking
        fields = '__all__'

# --- Serializer untuk Order ---
class OrderSerializer(serializers.ModelSerializer):
    # Gunakan OrderItemSerializer yang sudah diperbaiki
    items = OrderItemSerializer(many=True, required=True)
    # Tampilkan detail relasi saat GET
    sales_person = UserBasicSerializer(read_only=True, allow_null=True)
    customer = CustomerBasicSerializer(read_only=True)
    status = OrderStatusBasicSerializer(read_only=True)
    # Terima ID saat POST/PUT/PATCH
    customer_id = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.filter(is_active=True), source='customer', write_only=True, label="Customer ID")
    status_id = serializers.PrimaryKeyRelatedField(queryset=OrderStatus.objects.filter(is_active=True), source='status', write_only=True, label="Status ID")
    sales_person_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.filter(is_active=True), source='sales_person', write_only=True, allow_null=True, required=False, label="Sales Person ID")

    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, source='calculated_total')
    production_trackings = ProductionTrackingSerializer(many=True, read_only=True) # Ganti nama field jika perlu

    class Meta:
        model = Order
        fields = [
            'id', 'order_number',
            'customer', 'customer_id', # Read & Write ID
            'sales_person', 'sales_person_id', # Read & Write ID
            'status', 'status_id', # Read & Write ID
            'order_date', 'due_date', 'payment_method',
            'discount', 'tax', 'shipping_cost', 'notes', 'terms', 'is_active',
            'sumber_order', 'biaya_pasang', 'biaya_survey', 'calculated_total', 'total', # Sertakan 'total'
            'created_at', 'updated_at', 'items', 'production_trackings', # Ganti nama jika perlu
            # Field alamat (jika ada di model Order)
            'alamat_jalan', 'kelurahan', 'kecamatan', 'kota', 'provinsi', 'kode_pos', 'nomor_hp'
        ]
        read_only_fields = [
            'order_number', 'calculated_total', 'total', 'created_at', 'updated_at',
            'customer', 'status', 'sales_person', 'production_trackings' # Objek read-only
        ]

    def validate_items(self, value):
        logger.info(f">>> LOGGER INFO OrderSerializer validate_items value received: {value}")
        if not isinstance(value, list) or len(value) == 0:
            logger.error(">>> ERROR OrderSerializer validate_items: Value is not a non-empty list.")
            # Pesan error default dari required=True dan many=True biasanya sudah cukup
            # return serializers.ValidationError("Minimal 1 item order diperlukan.")
            pass # Biarkan DRF handling error kalau list kosong/tidak valid type
        # Nested serializer validation happens automatically before this.
        # If item validation fails, errors are attached to the 'items' field.
        logger.info(">>> LOGGER INFO OrderSerializer validate_items finished.")
        return value # Kembalikan value (list of validated item data)

    def validate(self, data):
        """
        Validasi keseluruhan data Order.
        Ini dipanggil setelah validasi field dasar dan validate_items.
        """
        logger.info(f">>> LOGGER INFO OrderSerializer validate data (before super): {data}")

        # Panggil validasi default dari parent class (ini yang mengumpulkan error dari nested serializers)
        try:
            validated_data = super().validate(data)
            logger.info(f">>> LOGGER INFO OrderSerializer validate data (after super): {validated_data}")
        except serializers.ValidationError as e:
             logger.error(f">>> ERROR OrderSerializer validate: Super validation failed: {e.detail}")
             # Raise the exception again so DRF handles it
             raise e


        # Lakukan validasi lain di sini jika perlu (misal: total diskon vs total amount)

        logger.info(">>> LOGGER INFO OrderSerializer validate finished.")
        return validated_data # Kembalikan data jika valid

    def create(self, validated_data):
        logger.info(f">>> LOGGER INFO OrderSerializer create validated_data: {validated_data}")
        items_data = validated_data.pop('items', [])
        logger.info(f">>> LOGGER INFO OrderSerializer create items_data: {items_data}")

        try:
            # Buat objek Order (customer, status, sales_person sudah jadi instance)
            order = Order.objects.create(**validated_data)
            logger.info(f">>> LOGGER INFO OrderSerializer create: Order object created: {order}")

            # Buat objek OrderItem
            for item_data in items_data:
                # 'product' instance sudah ada dari product_id di validasi serializer item
                OrderItem.objects.create(order=order, **item_data)
                logger.info(f">>> LOGGER INFO OrderSerializer create: OrderItem created: {item_data}")

            # Hitung ulang total setelah item dibuat (jika save() item tidak trigger save() order)
            order.save(skip_total_calculation=False)

        except Exception as e:
            logger.error(f">>> ERROR OrderSerializer create: Failed to create Order or OrderItem: {e}", exc_info=True)
            raise serializers.ValidationError(f"Gagal menyimpan order: {e}")

        logger.info(">>> LOGGER INFO OrderSerializer create finished successfully.")
        return order

    def update(self, instance, validated_data):
        logger.info(f">>> LOGGER INFO OrderSerializer update validated_data for instance {instance.id}: {validated_data}")
        items_data = validated_data.pop('items', None) # Ambil data items jika ada
        
        # Handle status update
        if 'status' in validated_data:
            status_data = validated_data.pop('status')
            print(f"Status data received: {status_data}")
            
            # Extract status ID (either from dict or directly)
            status_id = None
            if isinstance(status_data, dict) and 'id' in status_data:
                status_id = status_data['id']
            elif isinstance(status_data, (int, str)):
                status_id = int(status_data) if str(status_data).isdigit() else None
                
            print(f"Status ID extracted: {status_id}")
            
            # Update status if ID is valid
            if status_id is not None:
                from rumah_akrilik_app.models import OrderStatus
                try:
                    status_obj = OrderStatus.objects.get(id=status_id)
                    instance.status = status_obj
                    print(f"Status updated to: {status_obj.name} (ID: {status_obj.id})")
                except OrderStatus.DoesNotExist:
                    print(f"Status with ID {status_id} not found")
        
        # Update remaining fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        print(f"Order saved with status: {instance.status}")
        return instance

# --- Serializer untuk Order List ---
class OrderListSerializer(serializers.ModelSerializer):
    customer = CustomerBasicSerializer(read_only=True) # Tampilkan info dasar
    status = OrderStatusBasicSerializer(read_only=True) # Tampilkan info dasar
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True, source='calculated_total')
    class Meta:
        model = Order
        fields = ['id', 'order_number', 'customer', 'status', 'total', 'order_date', 'created_at'] # Sesuaikan field

# ======================
# Production Management
# ======================
class SupplierSerializer(serializers.ModelSerializer):
    class Meta: model = Supplier; fields = '__all__'; read_only_fields = ['created_at', 'updated_at']

class ProductionMaterialSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    supplier_id = serializers.PrimaryKeyRelatedField( queryset=Supplier.objects.filter(is_active=True), source='supplier', write_only=True, allow_null=True, required=False )
    class Meta: model = ProductionMaterial; fields = '__all__'; read_only_fields = ['created_at', 'updated_at']

class ProductionJobSerializer(serializers.ModelSerializer):
    assigned_to = UserSerializer(read_only=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField( queryset=User.objects.filter(is_active=True), source='assigned_to', write_only=True, allow_null=True, required=False )
    order_item = OrderItemSerializer(read_only=True)
    order_item_id = serializers.PrimaryKeyRelatedField( queryset=OrderItem.objects.all(), source='order_item', write_only=True )
    class Meta: model = ProductionJob; fields = '__all__'; read_only_fields = ['id', 'created_at', 'updated_at', 'order_item', 'assigned_to']

class ProduksiSerializer(serializers.ModelSerializer):
    penanggung_jawab = UserSerializer(read_only=True)
    penanggung_jawab_id = serializers.PrimaryKeyRelatedField( queryset=User.objects.filter(is_active=True), source='penanggung_jawab', write_only=True, allow_null=True, required=False )
    order = OrderSerializer(read_only=True)
    order_id = serializers.PrimaryKeyRelatedField( queryset=Order.objects.all(), source='order', write_only=True )
    class Meta: model = Produksi; fields = [ 'id', 'order', 'order_id', 'tahap', 'penanggung_jawab', 'penanggung_jawab_id', 'mulai', 'selesai', 'catatan', 'created_at', 'updated_at' ]; read_only_fields = ['id', 'created_at', 'updated_at', 'order', 'penanggung_jawab']

class ProductionStageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionStage
        fields = '__all__'

class ProductionTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionTracking
        fields = '__all__'

# ======================
# Marketing
# ======================
class MarketingCampaignSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField( queryset=User.objects.filter(is_active=True), source='created_by', write_only=True )
    class Meta: model = MarketingCampaign; fields = '__all__'; read_only_fields = ['created_at', 'updated_at', 'created_by']

class MarketingPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketingPlan
        fields = [
            'id', 'name', 'description', 'start_date', 'end_date', 
            'target_value', 'status', 'responsible_user', 'notes', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class RealisasiKunjunganRRSerializer(serializers.ModelSerializer):
    rr = UserSerializer(read_only=True)
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField( queryset=Customer.objects.filter(is_active=True), source='customer', write_only=True )
    produk = ProductSerializer(read_only=True)
    produk_id = serializers.PrimaryKeyRelatedField( queryset=Product.objects.filter(is_active=True), source='produk', write_only=True, allow_null=True, required=False )
    class Meta: model = RealisasiKunjunganRR; fields = '__all__'; read_only_fields = ['id', 'created_at', 'updated_at', 'rr', 'customer', 'produk']

# ======================
# Inventory Management
# ======================
class InventorySerializer(serializers.ModelSerializer):
    # Tambahkan field asset_type untuk mendukung frontend
    asset_type = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'name', 'sku', 'category', 'asset_type', 
            'unit', 'current_stock', 'minimum_stock', 'price',
            'location', 'acquisition_date', 'acquisition_value', 
            'current_value', 'condition', 'notes'
        ]
    
    def validate(self, data):
        # Normalisasi kategori
        if 'category' in data and data['category'] == 'asset':
            # Pastikan SKU selalu ada
            if 'sku' not in data or not data['sku']:
                # Generate SKU otomatis untuk aset
                unique_id = timezone.now().strftime('%y%m%d%H%M%S')
                name_part = data.get('name', '').strip()[:3].upper()
                if not name_part:
                    name_part = 'AST'
                data['sku'] = f"ASSET-{name_part}{unique_id}"
            
            # Pastikan asset_type selalu ada
            if 'asset_type' not in data or not data['asset_type']:
                if 'name' in data and any(keyword in data['name'].lower() for 
                                           keyword in ['mobil', 'kendaraan', 'gedung', 'tanah']):
                    data['asset_type'] = 'Kendaraan' if any(k in data['name'].lower() 
                                                            for k in ['mobil', 'kendaraan']) else 'Bangunan'
                else:
                    data['asset_type'] = 'Lainnya'
                        
            # Pastikan acquisition_value dan current_value selalu ada dengan nilai default
            if 'price' in data:
                if 'acquisition_value' not in data or data['acquisition_value'] is None:
                    data['acquisition_value'] = data['price']
                    
                if 'current_value' not in data or data['current_value'] is None:
                    data['current_value'] = data['price']
            
            # Nilai default untuk stock/unit/dll untuk aset
            data['current_stock'] = data.get('current_stock', 1)
            data['minimum_stock'] = data.get('minimum_stock', 0)
            data['unit'] = data.get('unit', 'unit')
                
        return data

class InventoryTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryTransaction
        fields = '__all__'
        read_only_fields = ['timestamp']

class InventoryRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryRequest
        fields = '__all__'
        read_only_fields = ['request_date', 'approved_date']

class TransactionSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField( queryset=Product.objects.filter(is_active=True), source='product', write_only=True )
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField( queryset=User.objects.filter(is_active=True), source='created_by', write_only=True )
    class Meta: model = Transaction; fields = '__all__'; read_only_fields = ['id', 'created_at', 'created_by', 'product']

# ======================
# Attendance
# ======================
class AbsensiSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField( queryset=User.objects.filter(is_active=True), source='user', write_only=True )
    class Meta: model = Absensi; fields = '__all__'; read_only_fields = ['id', 'created_at', 'updated_at', 'user']

# ======================
# Group Serializer
# ======================
class GroupSerializer(serializers.ModelSerializer):
    class Meta: model = Group; fields = ['id', 'name']

# ======================
# Notification Management
# ======================
class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer untuk model Notification
    """
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'read', 'created_at', 'updated_at', 'related_id', 'short_message']
        read_only_fields = ['created_at', 'updated_at', 'short_message']

# ======================
# HRD Department Management
# ======================
class DepartmentSerializer(serializers.ModelSerializer):
    manager_name = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'description', 'manager', 'manager_id', 'manager_name', 
                  'parent_department', 'parent_department_id', 'location', 
                  'is_active', 'created_at', 'updated_at', 'user_count']
        read_only_fields = ['manager_name', 'user_count']
        
    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}".strip() or obj.manager.username
        return None
    
    def get_user_count(self, obj):
        return obj.users.count() if hasattr(obj, 'users') else 0

# ======================
# Asset Management
# ======================
class AssetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = ['id', 'name', 'category', 'acquisition_date', 'acquisition_value', 
                  'current_value', 'location', 'condition', 'notes', 
                  'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']