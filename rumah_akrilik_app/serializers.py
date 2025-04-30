# /root/rumah-akrilik/rumah_akrilik_app/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User, Group
from .models import (
    CustomerAddress, ProductImage, OrderStatus, ProductionMaterial, Supplier,
    MarketingCampaign, Order, Produksi, Absensi, Product, RealisasiKunjunganRR,
    Role, UserProfile, ProductCategory, OrderItem, ProductionJob, Inventory,
    Transaction, Customer
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

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField( queryset=Role.objects.all(), source='role', write_only=True, required=False, allow_null=True )
    class Meta: model = UserProfile; fields = '__all__'

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
class OrderItemSerializer(serializers.ModelSerializer):
    # Menggunakan source='product' untuk menulis PrimaryKeyField menjadi instance Model
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True),
        source='product', # Map 'product_id' input ke field 'product' instance
        write_only=True,
        label="Product ID" # Label untuk pesan error lebih jelas
    )
    nama_produk = serializers.CharField(
        max_length=255,
        required=True,
        allow_blank=False,
        allow_null=False, # Pastikan tidak null
        label="Nama Produk (di Order)" # Label lebih jelas
    )
    quantity = serializers.IntegerField(
        min_value=1,
        required=True, # Pastikan quantity required
        label="Quantity" # Label lebih jelas
    )
    unit_price = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=Decimal('0'), # Gunakan Decimal instance untuk min_value
        required=True, # Pastikan harga required
        label="Harga Satuan" # Label lebih jelas
    )
    # discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0) # Uncomment jika dipakai
    specifications = serializers.JSONField(required=False, default=dict, allow_null=True) # Allow null and default dict
    notes = serializers.CharField(allow_blank=True, required=False, allow_null=True) # Allow blank and null

    # Field read-only untuk menampilkan detail produk terkait (opsional)
    # product_detail = ProductSerializer(source='product', read_only=True) # Jika perlu detail produk di response

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_id', # Untuk input (write_only)
            # 'product_detail', # Untuk output (read_only) - opsional
            'nama_produk',
            'quantity',
            'unit_price',
            # 'discount', # Uncomment jika dipakai
            'specifications',
            'notes',
            'total_price' # Property dari model, read-only
        ]
        read_only_fields = ['id', 'total_price'] # total_price adalah @property

    # --- TAMBAHKAN DEBUG VALIDASI DI SINI ---
    def validate(self, data):
        # Ini dijalankan SETELAH validasi field-level default DRF
        # Jadi, jika field required/allow_blank/min_value gagal, error sudah terkumpul
        logger.info(f">>> LOGGER INFO OrderItemSerializer validate data received: {data}")
        # data di sini seharusnya sudah divalidasi field-level dan berisi instance model
        # jika PrimaryKeyRelatedField berhasil.

        # Check if the 'product' instance was successfully resolved by product_id
        product_instance = data.get('product')
        if not product_instance:
             # Jika sampai sini dan product_instance masih None, berarti product_id yang dikirim invalid/tidak aktif
             logger.error(f">>> ERROR OrderItemSerializer validation: Product instance is missing. Input product_id was {self.initial_data.get('product_id')}")
             # DRF PrimaryKeyRelatedField harusnya sudah menangkap ini, tapi ini fallback log

        # Checks on data that survived field-level validation (optional but can help)
        # nama_produk = data.get('nama_produk')
        # if not nama_produk or not str(nama_produk).strip():
        #     logger.error(">>> ERROR OrderItemSerializer validate: nama_produk is effectively empty AFTER field validation.")

        # quantity = data.get('quantity')
        # if quantity is None or quantity < 1:
        #      logger.error(f">>> ERROR OrderItemSerializer validate: Invalid quantity AFTER field validation: {quantity}")

        # unit_price = data.get('unit_price')
        # try:
        #    price_decimal = Decimal(str(unit_price)) # Convert to string first
        #    if price_decimal < 0:
        #        logger.error(f">>> ERROR OrderItemSerializer validate: Invalid unit_price AFTER field validation: {unit_price}")
        # except (InvalidOperation, TypeError, ValueError):
        #    logger.error(f">>> ERROR OrderItemSerializer validate: unit_price not decimal AFTER field validation: {unit_price}")


        logger.info(">>> LOGGER INFO OrderItemSerializer validation finished.")
        return data # Selalu kembalikan data

    # Jika perlu validasi di level representasi (data sebelum masuk serializer), gunakan .to_internal_value
    # def to_internal_value(self, data):
    #     # Log data mentah per item sebelum validasi field
    #     logger.info(f">>> LOGGER INFO OrderItemSerializer to_internal_value data: {data}")
    #     return super().to_internal_value(data)

    # Jika perlu memformat data setelah validasi, gunakan .to_representation
    # def to_representation(self, instance):
    #      representation = super().to_representation(instance)
    #      # Modifikasi representasi jika perlu
    #      return representation

# --- Akhir Serializer untuk OrderItem ---


# --- Serializer untuk Order ---
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=True) # Bisa tulis nested items
    # sales_person, customer, status dibaca (read_only=True)
    sales_person = UserSerializer(read_only=True); customer = CustomerSerializer(read_only=True); status = OrderStatusSerializer(read_only=True)

    # customer_id, status_id, sales_person_id untuk ditulis (write_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.filter(is_active=True),
        source='customer', # Map input customer_id ke field customer instance
        write_only=True,
        allow_null=False,
        label="Customer ID" # Label lebih jelas
    )
    status_id = serializers.PrimaryKeyRelatedField(
        queryset=OrderStatus.objects.filter(is_active=True),
        source='status', # Map input status_id ke field status instance
        write_only=True,
        allow_null=False,
        label="Status ID" # Label lebih jelas
    )
    sales_person_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(is_active=True),
        source='sales_person', # Map input sales_person_id ke field sales_person instance
        write_only=True,
        allow_null=True, # Allow null jika '-- TANPA MARKETING --' dipilih
        required=False, # Tidak wajib diisi
        label="Sales Person ID" # Label lebih jelas
    )

    class Meta:
        model = Order
        fields = [
            'id', 'order_number',
            'customer', 'customer_id', # Input customer_id, Output customer object
            'sales_person', 'sales_person_id', # Input sales_person_id, Output sales_person object
            'status', 'status_id', # Input status_id, Output status object
            'order_date', 'due_date', 'payment_method', 'discount', 'tax', 'shipping_cost', 'notes', 'terms',
            'is_active', 'sumber_order', 'biaya_pasang', 'biaya_survey', 'total_amount', 'items', 'created_at', 'updated_at'
        ]
        # read_only_fields didefinisikan ulang agar tidak menimpa field yang dibutuhkan untuk write_only
        read_only_fields = [ 'id', 'order_number', 'total_amount', 'created_at', 'updated_at', 'customer', 'sales_person', 'status' ]

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

        # validated_data sekarang hanya berisi data untuk model Order itu sendiri
        # Customer, Status, Sales Person instance sudah di pop dan ada di validated_data
        # karena source='...' di PrimaryKeyRelatedField

        try:
            # Buat objek Order
            order = Order.objects.create(**validated_data)
            logger.info(f">>> LOGGER INFO OrderSerializer create: Order object created: {order}")

            # Buat objek OrderItem dari items_data
            for item_data in items_data:
                # item_data sudah berisi instance Product karena source='product' di OrderItemSerializer
                OrderItem.objects.create(order=order, **item_data)
                logger.info(f">>> LOGGER INFO OrderSerializer create: OrderItem created: {item_data}")

        except Exception as e:
            logger.error(f">>> ERROR OrderSerializer create: Failed to create Order or OrderItem: {e}", exc_info=True)
            # Re-raise exception to signal failure to the viewset
            raise serializers.ValidationError(f"Gagal menyimpan order: {e}")


        logger.info(">>> LOGGER INFO OrderSerializer create finished successfully.")
        return order

    def update(self, instance, validated_data):
        logger.info(f">>> LOGGER INFO OrderSerializer update validated_data: {validated_data}")
        items_data = validated_data.pop('items', None)
        logger.info(f">>> LOGGER INFO OrderSerializer update items_data: {items_data}")

        # Update field pada instance Order
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        logger.info(f">>> LOGGER INFO OrderSerializer update: Order instance updated: {instance}")


        if items_data is not None:
            # Hapus item lama dan buat baru jika items_data disediakan
            try:
                instance.items.all().delete()
                logger.info(f">>> LOGGER INFO OrderSerializer update: Deleted existing OrderItems for Order {instance.id}")

                for item_data in items_data:
                    OrderItem.objects.create(order=instance, **item_data)
                    logger.info(f">>> LOGGER INFO OrderSerializer update: OrderItem created: {item_data}")

            except Exception as e:
                logger.error(f">>> ERROR OrderSerializer update: Failed to update OrderItems: {e}", exc_info=True)
                # Re-raise exception
                raise serializers.ValidationError(f"Gagal update item order: {e}")

        logger.info(">>> LOGGER INFO OrderSerializer update finished successfully.")
        return instance

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

# ======================
# Marketing
# ======================
class MarketingCampaignSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField( queryset=User.objects.filter(is_active=True), source='created_by', write_only=True )
    class Meta: model = MarketingCampaign; fields = '__all__'; read_only_fields = ['created_at', 'updated_at', 'created_by']

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
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField( queryset=Product.objects.filter(is_active=True), source='product', write_only=True )
    class Meta: model = Inventory; fields = '__all__'

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
