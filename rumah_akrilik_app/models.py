# /root/rumah-akrilik/rumah_akrilik_app/models.py
from django.db import models
from django.contrib.auth.models import User, AbstractUser
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.conf import settings  # Tambahkan import ini
from decimal import Decimal, InvalidOperation

# ======================
# User Management
# ======================
class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('produksi', 'Produksi'),
        ('marketing', 'Marketing'),
        ('admin_marketing', 'Admin Marketing'),  # Tambahkan role baru
        ('manager_marketing', 'Manager Marketing'),
        ('supervisor_marketing', 'Supervisor Marketing'),
        ('cs_online', 'CS Online'),
        ('cs_offline', 'CS Offline'),
        ('retail', 'Retail Representative'),
        ('general_manager', 'General Manager'),
        ('owner', 'Owner'),
    )
    
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='marketing')
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='customuser_set',  # Tambahkan related_name yang unik
        blank=True,
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='customuser_set',  # Tambahkan related_name yang unik
        blank=True,
        help_text='Specific permissions for this user.'
    )

class Role(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ['name']; verbose_name = 'Role'; verbose_name_plural = 'Roles' # noqa: E701
    def __str__(self): return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    roles = models.ManyToManyField(Role, related_name='users', blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True) # Alamat utama user
    join_date = models.DateField(default=timezone.now)
    photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    TIPE_KARYAWAN_CHOICES = [ ('tetap', 'Karyawan Tetap'), ('freelance', 'Freelance'), ('magang', 'Magang'), ('pkl', 'PKL'), ('trainee','Trainee') ] # noqa: E701
    tipe_karyawan = models.CharField(max_length=20, choices=TIPE_KARYAWAN_CHOICES, default='tetap', blank=False, null=False) # noqa: E701
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ['user__username']; verbose_name = 'User Profile'; verbose_name_plural = 'User Profiles' # noqa: E701
    def __str__(self): # noqa: E701
        try: role_names = ", ".join(role.name for role in self.roles.all())
        except: role_names = "Tanpa Role" # noqa: E722
        user_name = self.user.get_full_name() or self.user.username
        try: tipe_display = self.get_tipe_karyawan_display()
        except AttributeError: tipe_display = "N/A" # noqa: E722
        return f"{self.user.username}'s profile"

    # Property untuk backward compatibility dengan kode yang mengharapkan role langsung
    @property
    def role(self):
        first_role = self.roles.first()
        return first_role if first_role else None
    
    # Juga perbaiki method untuk full_name yang mungkin digunakan
    @property
    def full_name(self):
        return self.user.get_full_name() or self.user.username

# ======================
# Product Management
# ======================
class ProductCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children') # noqa: E701
    image = models.ImageField(upload_to='category_images/', null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: verbose_name_plural = "Product Categories"; ordering = ['name'] # noqa: E701
    def __str__(self): return self.name

class Product(models.Model):
    PRODUCT_TYPES = [ ('standard', 'Standard Product'), ('custom', 'Custom Product'), ('material', 'Raw Material') ] # noqa: E701
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(ProductCategory, on_delete=models.PROTECT, related_name='products') # noqa: E701
    product_type = models.CharField(max_length=20, choices=PRODUCT_TYPES, default='standard') # Tambah default
    base_price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0'))]  # Gunakan Decimal ?
    )
    min_price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)], null=True, blank=True) # noqa: E701
    description = models.TextField(blank=True)
    specifications = models.JSONField(default=dict, blank=True) # Tambah blank=True
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='created_products') # noqa: E701
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ['code']; verbose_name = 'Product'; verbose_name_plural = 'Products' # noqa: E701
    def __str__(self): return f"{self.code} - {self.name}"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    is_primary = models.BooleanField(default=False)
    caption = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-is_primary', 'created_at']; verbose_name = 'Product Image'; verbose_name_plural = 'Product Images' # noqa: E701
    def __str__(self): return f"Image for {self.product.name}"

class DailyOrderCounter(models.Model):
    date = models.DateField(unique=True, default=timezone.now)
    last_sequence = models.PositiveIntegerField(default=0)
    class Meta: verbose_name = "Daily Order Counter"; verbose_name_plural = "Daily Order Counters" # noqa: E701
    def __str__(self): return f"{self.date}: {self.last_sequence}"

# ======================
# Customer Management
# ======================
class Customer(models.Model):
    CUSTOMER_TYPES = [ ('individual', 'Individual'), ('business', 'Business'), ('government', 'Government') ] # noqa: E701
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=CUSTOMER_TYPES, default='individual')
    phone = models.CharField(max_length=20) # Buat unique jika perlu
    email = models.EmailField(blank=True, null=True) # Nullable
    address = models.TextField(blank=True) # Alamat utama customer, buat blank=True
    city = models.CharField(max_length=100, blank=True) # Buat blank=True
    postal_code = models.CharField(max_length=10, blank=True) # Buat blank=True
    province = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, default='Indonesia', blank=True)
    # is_business = models.BooleanField(default=False) # Hapus jika sudah ada 'type'
    tax_id = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ['name']; verbose_name = 'Customer'; verbose_name_plural = 'Customers' # noqa: E701
    def __str__(self): return f"{self.name} ({self.phone or 'No HP'})"

class CustomerAddress(models.Model):
    # Model ini bisa dipakai jika 1 customer punya banyak alamat
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='addresses')
    address_type_choices = [('home', 'Home'), ('office', 'Office'), ('warehouse', 'Warehouse'), ('other', 'Other')] # noqa: E701
    address_type = models.CharField(max_length=20, choices=address_type_choices, default='home')
    # Rincian alamat
    street = models.CharField(max_length=255, blank=True) # Nama jalan
    village = models.CharField(max_length=100, blank=True) # Kelurahan/Desa
    district = models.CharField(max_length=100, blank=True) # Kecamatan
    city = models.CharField(max_length=100) # Kota/Kabupaten (Wajib?)
    postal_code = models.CharField(max_length=10, blank=True)
    province = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=50, default='Indonesia', blank=True)
    # Gabungan alamat lengkap jika perlu
    full_address = models.TextField(blank=True) # Bisa diisi otomatis
    is_primary = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: verbose_name = 'Customer Address'; verbose_name_plural = 'Customer Addresses'; ordering = ['customer', '-is_primary'] # noqa: E701
    def save(self, *args, **kwargs): # Contoh auto-fill full_address
        self.full_address = f"{self.street}, {self.village}, {self.district}, {self.city}, {self.province} {self.postal_code}".strip(', ') # noqa: E701
        super().save(*args, **kwargs)
    def __str__(self): return f"{self.customer.name}'s {self.get_address_type_display()} Address"

# ======================
# Order Management
# ======================
class OrderStatus(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=20, default='#000000', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        verbose_name = 'Order Status'
        verbose_name_plural = 'Order Statuses'
        ordering = ['name']
    def __str__(self): return self.name

class Order(models.Model):
    PAYMENT_METHODS = [ ('cash', 'Cash'), ('transfer', 'Bank Transfer'), ('credit', 'Credit'), ('partial', 'Partial Payment'), ('cod', 'COD'), ('cod_sebagian', 'COD Sebagian'), ('transfer_sebagian', 'Transfer Sebagian'), ('termin', 'Termin') ] # noqa: E701
    order_number = models.CharField(max_length=20, unique=True, blank=True) # blank=True agar bisa diisi di save()
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders')
    sales_person = models.ForeignKey(User, on_delete=models.PROTECT, related_name='sales_orders', null=True, blank=True) # Allow NULL
    status = models.ForeignKey(OrderStatus, on_delete=models.PROTECT, related_name='orders')
    order_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='transfer') # Tambah default
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Nominal?
    tax = models.DecimalField(max_digits=5, decimal_places=2, default=0) # Persen?
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    terms = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sumber_order = models.CharField(max_length=100, blank=True, null=True)
    biaya_pasang = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    biaya_survey = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    calculated_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0,
        help_text="Total nilai order termasuk biaya tambahan"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Tambahkan field alamat jika ingin menyimpan alamat spesifik per order
    # Jika tidak, alamat bisa diambil dari customer terkait
    alamat_jalan = models.CharField(max_length=255, blank=True, null=True)
    kelurahan = models.CharField(max_length=100, blank=True, null=True)
    kecamatan = models.CharField(max_length=100, blank=True, null=True)
    kota = models.CharField(max_length=100, blank=True, null=True)
    provinsi = models.CharField(max_length=50, blank=True, null=True)
    kode_pos = models.CharField(max_length=10, blank=True, null=True)
    nomor_hp = models.CharField(max_length=20, blank=True, null=True) # No HP kontak untuk order ini

    class Meta: ordering = ['-order_date']; verbose_name = 'Order'; verbose_name_plural = 'Orders' # noqa: E701

    # Logika save() dan property total_amount tetap sama seperti sebelumnya
    def save(self, *args, **kwargs):
        # ... (logika save order, termasuk generate order_number jika kosong) ...
        # Hitung ulang calculated_total HANYA jika tidak di-skip
        skip_total_calculation = kwargs.pop('skip_total_calculation', False)
        if not skip_total_calculation:
             # Pastikan order sudah punya ID sebelum mengakses self.items.all()
             if self.pk:
                 item_total = sum(item.total_price for item in self.items.all())
                 self.calculated_total = (item_total +
                                          (self.biaya_pasang or Decimal(0)) +
                                          (self.biaya_survey or Decimal(0)) +
                                          (self.shipping_cost or Decimal(0)))
             else:
                 # Jika order baru, total dihitung setelah item disimpan (mungkin perlu signal)
                 # Atau set 0 dulu dan hitung nanti
                 self.calculated_total = (self.biaya_pasang or Decimal(0)) + \
                                         (self.biaya_survey or Decimal(0)) + \
                                         (self.shipping_cost or Decimal(0))

        super().save(*args, **kwargs)
        
    @property
    def total_amount(self):
        """Property untuk backward compatibility atau tampilan"""
        return self.calculated_total # Langsung return field yang sudah dihitung

    def __str__(self): return f"Order #{self.order_number} - {self.customer.name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_items')
    nama_produk = models.CharField(max_length=255, blank=False, null=False, help_text="Nama produk saat order ini dibuat", default='') # Wajib diisi
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Asumsi diskon nominal per item
    specifications = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True) # Keterangan spesifik item
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: ordering = ['order', 'created_at']; verbose_name = 'Order Item'; verbose_name_plural = 'Order Items'; db_table = 'rumah_akrilik_app_orderitem' # noqa: E701

    @property
    def total_price(self):
        """Menghitung total harga untuk item ini (harga_satuan - diskon) * kuantitas."""
        # --- PERBAIKAN DIMULAI DISINI ---
        try:
            # Konversi ke Decimal, gunakan 0 jika None atau tidak valid
            unit_price_dec = Decimal(str(self.unit_price)) if self.unit_price is not None else Decimal(0)
            discount_dec = Decimal(str(self.discount)) if self.discount is not None else Decimal(0)
            quantity_dec = Decimal(str(self.quantity)) if self.quantity is not None else Decimal(0)

            # Pastikan quantity tidak nol untuk menghindari pembagian dengan nol jika ada logic lain
            if quantity_dec <= 0:
                return Decimal(0).quantize(Decimal("0.01"))

            # Kalkulasi harga setelah diskon (asumsi diskon nominal)
            price_after_discount = unit_price_dec - discount_dec

            # Hitung total
            total = price_after_discount * quantity_dec

            # Pastikan hasil tidak negatif
            return max(total, Decimal(0)).quantize(Decimal("0.01"))

        except (TypeError, ValueError, InvalidOperation) as e:
            # Log error jika perlu untuk debugging
            print(f"Error calculating total_price for OrderItem {self.pk}: {e}")
            # Jika terjadi error konversi atau kalkulasi, kembalikan 0
            return Decimal(0).quantize(Decimal("0.01"))
        # --- PERBAIKAN SELESAI DISINI ---

    def save(self, *args, **kwargs):
        # Auto-fill nama_produk jika kosong saat save
        if not self.nama_produk and self.product:
            self.nama_produk = self.product.name
        super().save(*args, **kwargs)
        # Update total order setelah item disimpan/diupdate
        if self.order:
             self.order.save() # Ini akan memicu perhitungan ulang calculated_total di Order.save()

    def delete(self, *args, **kwargs):
        order = self.order # Simpan referensi order sebelum dihapus
        super().delete(*args, **kwargs)
        # Update total order setelah item dihapus
        if order:
            order.save()

    def __str__(self): return f"{self.order.order_number} - {self.nama_produk or self.product.name}"

# ======================
# Production Management (Sama seperti sebelumnya)
# ======================
class Supplier(models.Model):
    name = models.CharField(max_length=100, db_index=True); contact_person = models.CharField(max_length=100); email = models.EmailField(db_index=True, blank=True); phone = models.CharField(max_length=20, blank=True); address = models.TextField(blank=True); tax_id = models.CharField(max_length=50, blank=True); bank_account = models.CharField(max_length=50, blank=True); bank_name = models.CharField(max_length=100, blank=True); is_active = models.BooleanField(default=True); created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'Supplier'; verbose_name_plural = 'Suppliers'; ordering = ['name'] # noqa: E701
    def __str__(self): return f"{self.name} ({self.contact_person or ''})"

class ProductionMaterial(models.Model):
    MATERIAL_TYPES = (('RAW', 'Raw Material'), ('SUPPORT', 'Support Material'), ('PACKAGING', 'Packaging')); UNITS = (('kg', 'Kilogram'), ('g', 'Gram'), ('m', 'Meter'), ('cm', 'Centimeter'), ('pcs', 'Pieces'), ('l', 'Liter'), ('ml', 'Milliliter')) # noqa: E701
    name = models.CharField(max_length=100, db_index=True); type = models.CharField(max_length=10, choices=MATERIAL_TYPES); supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, related_name='materials'); current_stock = models.DecimalField(max_digits=10, decimal_places=2, default=0); unit = models.CharField(max_length=20, choices=UNITS); minimum_stock = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)], default=0); cost_per_unit = models.DecimalField(max_digits=12, decimal_places=2, default=0); notes = models.TextField(blank=True); is_active = models.BooleanField(default=True, db_index=True); created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'Production Material'; verbose_name_plural = 'Production Materials'; ordering = ['name'] # noqa: E701
    def __str__(self): return f"{self.name} ({self.get_type_display()})"

class ProductionJob(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed'), ('quality_check', 'Quality Check'), ('on_hold', 'On Hold')] # noqa: E701
    order_item = models.ForeignKey(OrderItem, on_delete=models.PROTECT, related_name='production_jobs') # noqa: E701
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='production_jobs', null=True, blank=True) # Allow null
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    start_date = models.DateTimeField(null=True, blank=True); end_date = models.DateTimeField(null=True, blank=True) # noqa: E701
    notes = models.TextField(blank=True); created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'Production Job'; verbose_name_plural = 'Production Jobs'; ordering = ['-created_at'] # noqa: E701
    def __str__(self): return f"Job for {self.order_item}"

class Produksi(models.Model):
    TAHAP_CHOICES = [('desain', 'Desain'), ('laser', 'Laser'), ('finishing', 'Finishing'), ('qc', 'Quality Control'), ('packing', 'Packing')] # noqa: E701
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='produksi_records')
    tahap = models.CharField(max_length=20, choices=TAHAP_CHOICES)
    penanggung_jawab = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='produksi_tanggungjawab') # noqa: E701
    mulai = models.DateTimeField(default=timezone.now); selesai = models.DateTimeField(null=True, blank=True) # noqa: E701
    catatan = models.TextField(blank=True); created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'Production'; verbose_name_plural = 'Productions'; ordering = ['order', 'mulai'] # Order by mulai
    def __str__(self): return f"{self.order.order_number} - {self.get_tahap_display()}"

class ProductionStage(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    order = models.PositiveSmallIntegerField(default=0, help_text="Urutan tahap produksi")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Step {self.order})"
    
    class Meta:
        ordering = ['order']
        verbose_name = 'Production Stage'
        verbose_name_plural = 'Production Stages'

class ProductionTracking(models.Model):
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='production_trackings')
    stage = models.ForeignKey('ProductionStage', on_delete=models.PROTECT, related_name='tracking_entries')
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_productions')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Menunggu'),
        ('in_progress', 'Sedang Dikerjakan'),
        ('completed', 'Selesai'),
        ('rejected', 'Ditolak/Revisi')
    ], default='pending')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.order.id} - {self.stage.name} ({self.status})"
    
    class Meta:
        ordering = ['order', 'stage__order']
        unique_together = ['order', 'stage']
        verbose_name = 'Production Tracking'
        verbose_name_plural = 'Production Trackings'

# ======================
# Inventory Management (Sama seperti sebelumnya)
# ======================
class Inventory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='inventory')
    quantity = models.DecimalField(max_digits=12, decimal_places=3, default=0) # Tambah default
    unit = models.CharField(max_length=20, blank=True) # Buat blank=True jika bisa kosong
    location = models.CharField(max_length=100, blank=True) # Buat blank=True
    minimum_stock = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    last_updated = models.DateTimeField(auto_now=True)
    class Meta: verbose_name_plural = "Inventory"; ordering = ['product'] # noqa: E701
    def __str__(self): return f"{self.product.name} - {self.quantity} {self.unit}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [('in', 'Stock In'), ('out', 'Stock Out'), ('adjust', 'Adjustment')]
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='transactions') # noqa: E701
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    reference = models.CharField(max_length=100, blank=True) # Buat blank=True
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='inventory_transactions') # noqa: E701
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: verbose_name = 'Transaction'; verbose_name_plural = 'Transactions'; ordering = ['-created_at'] # noqa: E701
    def __str__(self): return f"{self.get_transaction_type_display()} - {self.product.name}"

# ======================
# Marketing (Sama seperti sebelumnya)
# ======================
class MarketingCampaign(models.Model):
    name = models.CharField(max_length=100); description = models.TextField(blank=True); start_date = models.DateField(); end_date = models.DateField(); budget = models.DecimalField(max_digits=12, decimal_places=2, default=0); target_audience = models.TextField(blank=True); is_active = models.BooleanField(default=True); created_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='campaigns'); created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'Marketing Campaign'; verbose_name_plural = 'Marketing Campaigns'; ordering = ['-start_date'] # noqa: E701
    def __str__(self): return self.name

class RealisasiKunjunganRR(models.Model):
    TIPE_KUNJUNGAN = [('rutin', 'Routine Visit'), ('followup', 'Follow Up'), ('complaint', 'Complaint Handling')] # noqa: E701
    rr = models.ForeignKey(User, on_delete=models.PROTECT, related_name='kunjungan_rr')
    tanggal = models.DateField(default=timezone.now)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='kunjungan') # noqa: E701
    tipe_kunjungan = models.CharField(max_length=20, choices=TIPE_KUNJUNGAN)
    produk = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='kunjungan_produk') # Ganti related_name, SET_NULL
    keterangan = models.TextField(blank=True) # Buat blank=True
    foto = models.ImageField(upload_to='kunjungan_rr/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'RR Visit'; verbose_name_plural = 'RR Visits'; ordering = ['-tanggal'] # noqa: E701
    def __str__(self): return f"Visit by {self.rr.username} to {self.customer.name} - {self.tanggal}"

class MarketingPlan(models.Model):
    """Model untuk rencana marketing"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    target_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    responsible_user = models.CharField(max_length=100, blank=True, null=True)
    STATUS_CHOICES = [
        ('planned', 'Direncanakan'),
        ('active', 'Aktif'),
        ('completed', 'Selesai'),
        ('cancelled', 'Dibatalkan')
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planned')
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_plans')
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='updated_plans')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Marketing Plan'
        verbose_name_plural = 'Marketing Plans'

    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"

# ======================
# Attendance (Sama seperti sebelumnya)
# ======================
class Absensi(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    tanggal = models.DateField(default=timezone.now)
    check_in = models.TimeField(null=True, blank=True); check_out = models.TimeField(null=True, blank=True) # noqa: E701
    keterlambatan = models.PositiveIntegerField(default=0, help_text="Dalam menit")
    keterangan = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True); updated_at = models.DateTimeField(auto_now=True) # noqa: E701
    class Meta: verbose_name = 'Attendance'; verbose_name_plural = 'Attendance Records'; unique_together = ['user', 'tanggal']; ordering = ['-tanggal', 'user'] # noqa: E701
    def __str__(self): return f"{self.user.username} - {self.tanggal}"

# ======================
# Notification Management
# ======================
class Notification(models.Model):
    """
    Model untuk menyimpan notifikasi sistem untuk pengguna
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='notifications',
        help_text="User yang menerima notifikasi, jika NULL maka untuk semua user dengan role tertentu"
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(
        max_length=50, 
        choices=[
            ('order_created', 'Order Created'),
            ('order_updated', 'Order Updated'),
            ('order_approved', 'Order Approved'),
            ('payment_received', 'Payment Received'),
            ('production_started', 'Production Started'),
            ('production_update', 'Production Update'),
            ('production_completed', 'Production Completed'),
            ('order_ready', 'Order Ready'),
            ('order_delivered', 'Order Delivered'),
            ('system', 'System Notification'),
            ('marketing', 'Marketing Notification'),
        ],
        default='system'
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    related_id = models.IntegerField(null=True, blank=True, help_text="ID dari entitas terkait (misal: order_id)")
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%d/%m/%Y %H:%M')}"
    
    @property
    def short_message(self):
        """Return shortened message for display in lists"""
        if len(self.message) > 100:
            return f"{self.message[:97]}..."
        return self.message
