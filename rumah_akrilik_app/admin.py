# /root/rumah-akrilik/rumah_akrilik_app/admin.py
# Kode ini didasarkan pada yang Anda kirim, dengan tambahan untuk OrderStatus

from django.contrib import admin
from django.utils.html import format_html
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django import forms
from .models import (
    Department,
    Role,
    UserProfile,
    ProductCategory,
    Product,
    Customer,
    Order,
    OrderItem,
    ProductionJob,
    Inventory, InventoryTransaction, InventoryRequest,
    Transaction,
    Produksi,
    Absensi,
    RealisasiKunjunganRR,
    OrderStatus, # <-- TAMBAHKAN IMPORT OrderStatus
    ProductImage, # <-- Tambahkan import lain yang mungkin digunakan di bawah
    CustomerAddress,
    Supplier,
    ProductionMaterial,
    MarketingCampaign
    # Pastikan semua model yang diregister di bawah sudah diimpor di sini
)

class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'manager', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']

admin.site.register(Department, DepartmentAdmin)

# Common Admin Mixin (Asumsi class ini ada di kode asli Anda)
class BaseAdmin(admin.ModelAdmin):
    list_per_page = 50
    save_on_top = True

# User Management
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'description']

admin.site.register(Role, RoleAdmin)

class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['get_username', 'get_roles', 'phone', 'is_active']
    list_filter = ['is_active', 'roles']
    raw_id_fields = ['user']
    filter_horizontal = ['roles']
    
    def get_username(self, obj):
        return obj.user.username if obj.user else ""
    get_username.short_description = 'Username'
    
    def get_roles(self, obj):
        return ", ".join([role.name for role in obj.roles.all()]) if obj.roles.exists() else ""
    get_roles.short_description = 'Roles'

admin.site.register(UserProfile, UserProfileAdmin)

# Product Management
@admin.register(ProductCategory)
class ProductCategoryAdmin(BaseAdmin):
    list_display = ('name', 'parent', 'product_count')
    search_fields = ('name',)
    list_filter = ('parent',)
    readonly_fields = ()

    def product_count(self, obj):
        # Perlu penyesuaian jika related_name bukan 'product_set'
        # Kita asumsikan model Product punya ForeignKey ke ProductCategory
        # dengan related_name default (product_set) atau 'products'
        try:
             # Coba related_name umum 'products' atau default 'product_set'
             count = obj.products.count() if hasattr(obj, 'products') else obj.product_set.count()
             return count
        except AttributeError:
             return 0 # Handle jika relasi tidak ditemukan
    product_count.short_description = 'Products'

@admin.register(Product)
class ProductAdmin(BaseAdmin):
    # Asumsi model Product punya field 'product_type' dan 'stock_quantity'
    list_display = ('code', 'name', 'category', 'base_price', 'is_active') # Hapus product_type jika tidak ada
    list_filter = ('category', 'is_active') # Hapus product_type jika tidak ada
    search_fields = ('code', 'name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    raw_id_fields = ('category', 'created_by') # Pisahkan raw_id_fields

# Customer Management
@admin.register(Customer)
class CustomerAdmin(BaseAdmin):
    list_display = ('name', 'phone', 'email', 'city') # Hapus is_business jika tidak ada
    search_fields = ('name', 'phone', 'email') # Hapus address jika tidak ada field address langsung
    list_filter = ('city',) # Hapus is_business jika tidak ada
    readonly_fields = ('created_at',)

# Order Management
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('total_price_display', 'nama_produk')  # TAMBAHKAN 'nama_produk'
    fields = (
        'product',
        'nama_produk',  # TAMBAHKAN DI SINI
        'quantity',
        'unit_price',
        'discount',
        'total_price_display',
        'specifications',
        'notes'
    )
    raw_id_fields = ('product',)

    @admin.display(description='Total')
    def total_price_display(self, obj):
        # Memanggil property total_price dari model
        return obj.total_price

@admin.register(Order)
class OrderAdmin(BaseAdmin):
    list_display = (
        'order_number',
        'customer_link',
        'order_date',
        'status',
        'payment_method',
        'total_amount_display', # Ganti nama
        'sales_person_link'
    )
    list_filter = ('status', 'payment_method', 'order_date', 'sales_person') # Tambahkan sales_person
    search_fields = ('order_number', 'customer__name', 'customer__phone')
    inlines = [OrderItemInline]
    raw_id_fields = ('customer', 'sales_person', 'status') # Tambahkan status
    readonly_fields = ('created_at', 'updated_at', 'order_number') # Tambahkan order_number

    @admin.display(description='Customer', ordering='customer__name') # Tambahkan ordering
    def customer_link(self, obj):
        if obj.customer:
            return format_html('<a href="/admin/rumah_akrilik_app/customer/{}/change/">{}</a>',
                             obj.customer.id, obj.customer.name)
        return "-"

    @admin.display(description='Sales Person', ordering='sales_person__username') # Tambahkan ordering
    def sales_person_link(self, obj):
        if obj.sales_person:
             # Pastikan user punya first/last name, jika tidak pakai username
             name = obj.sales_person.get_full_name() or obj.sales_person.username
             return format_html('<a href="/admin/auth/user/{}/change/">{}</a>',
                              obj.sales_person.id, name)
        return "-"

    @admin.display(description='Total Amount')
    def total_amount_display(self, obj):
        # Memanggil property total_amount dari model
        return obj.total_amount
    # total_amount.short_description = 'Total Amount' # Tidak perlu jika pakai display

# =====================================================
# === PENDAFTARAN ORDER STATUS YANG HILANG ADA DI SINI ===
# =====================================================
@admin.register(OrderStatus)
class OrderStatusAdmin(BaseAdmin):
    # Asumsi OrderStatus punya field 'name', 'description', 'is_active'
    list_display = ('name', 'description', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)
# =====================================================

# Production Management
@admin.register(ProductionJob)
class ProductionJobAdmin(BaseAdmin):
    # Asumsi ProductionJob punya 'start_date', 'end_date'
    list_display = ('order_item_link', 'status', 'assigned_to_link', 'start_date', 'end_date')
    list_filter = ('status', 'assigned_to')
    search_fields = ('order_item__order__order_number',)
    raw_id_fields = ('order_item', 'assigned_to')
    readonly_fields = ('created_at',) # Asumsi ada created_at

    @admin.display(description='Order Item', ordering='order_item') # Tambahkan ordering
    def order_item_link(self, obj):
        if obj.order_item:
            return format_html('<a href="/admin/rumah_akrilik_app/orderitem/{}/change/">{}</a>',
                             obj.order_item.id, obj.order_item)
        return "-"

    @admin.display(description='Assigned To', ordering='assigned_to__username') # Tambahkan ordering
    def assigned_to_link(self, obj):
         if obj.assigned_to:
             name = obj.assigned_to.get_full_name() or obj.assigned_to.username
             return format_html('<a href="/admin/auth/user/{}/change/">{}</a>',
                              obj.assigned_to.id, name)
         return "-"

# Inventory Management
class InventoryAdminForm(forms.ModelForm):
    class Meta:
        model = Inventory
        fields = '__all__'
        widgets = {
            'category': forms.Select(choices=Inventory.CATEGORY_CHOICES),
        }

@admin.register(Inventory)
class InventoryAdmin(admin.ModelAdmin):
    form = InventoryAdminForm
    list_display = ('name', 'sku', 'category', 'current_stock', 'minimum_stock')
    search_fields = ('name', 'sku', 'category')
    list_filter = ('category',)
    
    # Form field untuk dropdown kategori
    fieldsets = (
        (None, {
            'fields': ('name', 'sku', 'category', 'unit', 'current_stock', 'minimum_stock', 'price', 'location'),
        }),
    )

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'type', 'quantity', 'timestamp', 'handled_by']
    list_filter = ['type', 'timestamp']
    search_fields = ['inventory__name', 'reference', 'notes']
    readonly_fields = ['timestamp']

@admin.register(InventoryRequest)
class InventoryRequestAdmin(admin.ModelAdmin):
    list_display = ['inventory', 'quantity', 'requested_by', 'status', 'request_date']
    list_filter = ['status', 'request_date']
    search_fields = ['inventory__name', 'requested_by']
    readonly_fields = ['request_date', 'approved_date']

@admin.register(Transaction)
class TransactionAdmin(BaseAdmin):
    list_display = ('product_link', 'transaction_type', 'quantity', 'reference', 'created_at')
    list_filter = ('transaction_type', 'product')
    search_fields = ('product__name', 'reference')
    raw_id_fields = ('product', 'created_by')
    readonly_fields = ('created_at',)

    @admin.display(description='Product', ordering='product__name') # Tambahkan ordering
    def product_link(self, obj):
        if obj.product:
             return format_html('<a href="/admin/rumah_akrilik_app/product/{}/change/">{}</a>',
                              obj.product.id, obj.product.name)
        return "-"

# Original Models (Indonesian)
@admin.register(Produksi)
class ProduksiAdmin(BaseAdmin):
    list_display = ('order_link', 'tahap', 'penanggung_jawab_link', 'mulai', 'selesai')
    list_filter = ('tahap', 'penanggung_jawab')
    search_fields = ('order__order_number',)
    raw_id_fields = ('order', 'penanggung_jawab')
    readonly_fields = ('mulai',) # Kenapa mulai readonly?

    @admin.display(description='Order', ordering='order__order_number') # Tambahkan ordering
    def order_link(self, obj):
        if obj.order:
             return format_html('<a href="/admin/rumah_akrilik_app/order/{}/change/">{}</a>',
                              obj.order.id, obj.order.order_number)
        return "-"

    @admin.display(description='Penanggung Jawab', ordering='penanggung_jawab__username') # Tambahkan ordering
    def penanggung_jawab_link(self, obj):
        if obj.penanggung_jawab:
            name = obj.penanggung_jawab.get_full_name() or obj.penanggung_jawab.username
            return format_html('<a href="/admin/auth/user/{}/change/">{}</a>',
                             obj.penanggung_jawab.id, name)
        return "-"
    # penanggung_jawab_link.short_description = 'Penanggung Jawab' # Tidak perlu

@admin.register(Absensi)
class AbsensiAdmin(BaseAdmin):
    # PERBAIKAN: Hapus 'status' dari list_display dan list_filter jika tidak ada fieldnya
    # Asumsi field yang ada: user, tanggal, check_in, check_out
    list_display = ('user_link', 'tanggal', 'check_in', 'check_out') # Hapus 'status'
    list_filter = ('tanggal', 'user') # Hapus 'status'
    search_fields = ('user__username', 'user__first_name', 'user__last_name')
    date_hierarchy = 'tanggal'
    raw_id_fields = ('user',)

    @admin.display(description='User', ordering='user__username')
    def user_link(self, obj):
        if obj.user:
             name = obj.user.get_full_name() or obj.user.username
             return format_html('<a href="/admin/auth/user/{}/change/">{}</a>', obj.user.id, name)
        return "-"
    # user_link.short_description = 'User' # Tidak perlu

# RR Visit Admin
@admin.register(RealisasiKunjunganRR)
class RealisasiKunjunganRRAdmin(BaseAdmin):
    # PERBAIKAN: Hapus 'is_approved' jika fieldnya tidak ada di model
    # Asumsi field yang ada: rr, tanggal, customer, tipe_kunjungan, produk
    list_display = ('rr_link', 'tanggal', 'customer_link', 'tipe_kunjungan', 'produk_link') # Hapus 'is_approved'
    list_filter = ('tipe_kunjungan', 'rr') # Hapus 'is_approved'
    search_fields = ('customer__name', 'rr__username')
    raw_id_fields = ('rr', 'customer', 'produk') # Tambah raw_id

    @admin.display(description='Produk', ordering='produk__name')
    def produk_link(self, obj):
        if obj.produk:
            return format_html('<a href="/admin/rumah_akrilik_app/product/{}/change/">{}</a>', obj.produk.id, obj.produk.name)
        return "-"

    @admin.display(description='RR', ordering='rr__username')
    def rr_link(self, obj):
         if obj.rr:
             name = obj.rr.get_full_name() or obj.rr.username
             return format_html('<a href="/admin/auth/user/{}/change/">{}</a>', obj.rr.id, name)
         return "-"

    @admin.display(description='Customer', ordering='customer__name')
    def customer_link(self, obj):
         if obj.customer:
             return format_html('<a href="/admin/rumah_akrilik_app/customer/{}/change/">{}</a>', obj.customer.id, obj.customer.name)
         return "-"


# Pastikan semua model terkait order sudah terdaftar
admin.site.register(ProductImage)
admin.site.register(CustomerAddress)
admin.site.register(Supplier)
admin.site.register(ProductionMaterial)
admin.site.register(MarketingCampaign)

# Admin Site Configuration
admin.site.site_header = "Rumah Akrilik Administration"
admin.site.site_title = "Rumah Akrilik Admin Portal"
admin.site.index_title = "Welcome to Rumah Akrilik Admin"

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def emergency_login_direct(request):
    """
    Endpoint login darurat yang sangat minimal
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Emergency login attempt: {username}")
        
        # Autentikasi langsung tanpa middleware
        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({'error': 'Invalid Credentials'}, status=400)
        
        # Buat token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        
        # Response minimal
        return Response({
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'role': 'Admin' if user.is_superuser else 'User'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)
