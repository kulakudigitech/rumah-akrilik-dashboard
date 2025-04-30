# /root/rumah-akrilik/rumah_akrilik_app/views.py

from rest_framework import viewsets, generics, status, filters
from rest_framework.authentication import TokenAuthentication, SessionAuthentication
from rest_framework.permissions import (
    IsAuthenticated,
    IsAdminUser,
    AllowAny # Untuk view tes atau publik
)
# Impor PermissionDenied untuk error handling
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes as decorator_permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from django.db.models import F
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings # Untuk akses settings

# --- Import Models ---
from .models import (
    CustomerAddress, ProductImage, OrderStatus, ProductionMaterial, Supplier,
    MarketingCampaign, Order, Produksi, Absensi, Product, RealisasiKunjunganRR,
    Role, UserProfile, ProductCategory, OrderItem, ProductionJob, Inventory,
    Transaction, Customer
)

# --- Import Serializers ---
from .serializers import (
    CustomerAddressSerializer, ProductImageSerializer, OrderStatusSerializer,
    ProductionMaterialSerializer, SupplierSerializer, MarketingCampaignSerializer,
    OrderSerializer, ProduksiSerializer, AbsensiSerializer, ProductSerializer,
    RealisasiKunjunganRRSerializer, RoleSerializer, UserProfileSerializer,
    UserSerializer, ProductCategorySerializer, OrderItemSerializer,
    ProductionJobSerializer, InventorySerializer, TransactionSerializer,
    GroupSerializer, CustomerSerializer
)

# --- Import Custom Permissions ---
from .permissions import (
    IsOwner, IsGeneralManager, IsManager, IsSupervisor, IsKoordinator,
    IsStaff, IsAdminKeuangan, IsMarketingUser, IsRRUser, IsProductionUser,
    IsDesignerUser, IsOperatorMesinUser, IsFinishingUser, IsQCUser, IsPackingUser,
    IsGudangUser, IsInventoryUser, IsResellerUser
)

# --- Import Filters ---
from .filters import (
    OrderFilter, ProductFilter, CustomerFilter, ProductionFilter, InventoryFilter
)

# --- Import Pagination ---
from .pagination import CustomPagination

import logging # Import modul logging
logger = logging.getLogger(__name__) # Inisialisasi logger di views
# ======================
# Utility Functions
# ======================
# (Fungsi get_user_role_name ada di permissions.py)

# ======================
# Authentication Views
# ======================
@method_decorator(csrf_exempt, name='dispatch')
class CustomAuthToken(ObtainAuthToken):
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        # ... (kode login tetap sama) ...
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request=request, username=username, password=password)
        if not user:
            return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response({'error': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
        refresh = RefreshToken.for_user(user)
        # Panggil get_user_role_name dari permissions.py
        from .permissions import get_user_role_name
        role_name = get_user_role_name(user)
        profile_complete = hasattr(user, 'profile') and user.profile.role is not None
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'role': role_name,
            'profile_complete': profile_complete,
        })

@api_view(['GET'])
@decorator_permission_classes([IsAuthenticated])
def verify_auth(request):
    from .permissions import get_user_role_name # Import di sini
    role_name = get_user_role_name(request.user)
    return Response({
        "status": "Authenticated",
        "user_id": request.user.id,
        "username": request.user.username,
        "role": role_name
    })

@api_view(['GET'])
@decorator_permission_classes([AllowAny])
@csrf_exempt
def test_api(request):
    return Response({"message": "Test API Rumah Akrilik berhasil!"})

class UserMeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    def get_object(self):
        return self.request.user

class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ======================
# User Management Views
# ======================
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_active=True).order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser] # Hanya Admin Django Superuser
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    pagination_class = CustomPagination

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser] # Hanya Admin Django Superuser

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser] # Hanya Admin Django Superuser

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.select_related('user', 'role').filter(is_active=True)
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated] # Izinkan user terautentikasi melihat
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['role', 'is_active', 'tipe_karyawan']
    search_fields = ['user__username', 'phone', 'address']
    pagination_class = CustomPagination

# ======================
# Product Views
# ======================
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category', 'created_by').filter(is_active=True)
    serializer_class = ProductSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'base_price', 'created_at']
    pagination_class = CustomPagination

    # Fungsi get_permissions bisa dikomentari/dihapus sementara jika permission_classes sudah cukup
    # def get_permissions(self):
    #     """Hanya role tertentu yang bisa Create, Update, Destroy."""
    #     if self.action in ['create', 'update', 'partial_update', 'destroy']:
    #         return [permission() for permission in (IsMarketingUser, IsAdminUser, IsOwner, IsGeneralManager)]
    #     return [permission() for permission in self.permission_classes]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.filter(is_active=True)
    serializer_class = ProductCategorySerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['parent']
    search_fields = ['name']

class ProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all()
    serializer_class = ProductImageSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu

# ======================
# Customer Views
# ======================
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = CustomerFilter
    search_fields = ['name', 'phone', 'email', 'city']
    ordering_fields = ['name', 'created_at']
    pagination_class = CustomPagination

class CustomerAddressViewSet(viewsets.ModelViewSet):
    queryset = CustomerAddress.objects.all()
    serializer_class = CustomerAddressSerializer
     # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu

# ======================
# Order Views
# ======================
class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related(
        'customer', 'sales_person', 'status'
    ).prefetch_related(
        'items', 'items__product'
    ).filter(is_active=True).order_by('-order_date')
    serializer_class = OrderSerializer
     # !!! TETAPKAN PERMISSION ISAUTHENTICATED (SEMENTARA get_permissions dinonaktifkan) !!!
    # Pastikan user memiliki salah satu role di IsMarketingUser untuk bisa CREATE order
    # Jika Anda ingin semua user terautentikasi bisa create order, ubah ini menjadi [IsAuthenticated]
    permission_classes = [IsAuthenticated, IsMarketingUser] # Atau sesuaikan dengan role yang boleh create order
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['order_number', 'customer__name', 'notes', 'items__product__name', 'items__product__code', 'items__nama_produk']
    ordering_fields = ['order_date', 'status__name']
    pagination_class = CustomPagination

    # Nonaktifkan get_permissions sementara untuk tes IsAuthenticated
    # def get_permissions(self):
    #     """Atur permission berdasarkan aksi (create, update, destroy, list, retrieve)."""
    #     if self.action == 'create':
    #         return [permission() for permission in (IsMarketingUser, IsAdminUser, IsOwner, IsGeneralManager)]
    #     elif self.action in ['update', 'partial_update']:
    #         return [permission() for permission in (IsMarketingUser, IsAdminKeuangan, IsAdminUser, IsOwner, IsGeneralManager)]
    #     elif self.action == 'destroy':
    #         return [permission() for permission in (IsAdminUser, IsOwner, IsGeneralManager)]
    #     return [permission() for permission in self.permission_classes]

    # --- TAMBAHKAN DEBUG PRINT DI METHOD CREATE INI ---
    def create(self, request, *args, **kwargs):
        # Menggunakan logger.info
        logger.info(f"Data diterima di backend: {request.data}")
        logger.info(f"Received data: {request.data}")
        return super().create(request, *args, **kwargs)
        # Panggil get_serializer untuk membuat instance serializer
        serializer = self.get_serializer(data=request.data)

        # Panggil is_valid() dengan raise_exception=True
        # Ini akan memicu validasi dan jika ada error, akan langsung raise
        # ValidationError yang ditangkap oleh DRF dan dikembalikan sebagai respons 400.
        # Detail error akan ada di response body.
        try:
            serializer.is_valid(raise_exception=True)
            logger.info(f">>> LOGGER INFO OrderViewSet create serializer.is_valid() returned True")
        except Exception as e:
             logger.error(f">>> ERROR OrderViewSet create: serializer.is_valid() failed: {e.detail if hasattr(e, 'detail') else e}", exc_info=True)
             # Re-raise the exception so DRF handles the 400 response
             raise e


        logger.info(f">>> LOGGER INFO OrderViewSet create serializer.validated_data (before perform_create): {serializer.validated_data}")


        # Jika validasi berhasil, panggil perform_create
        self.perform_create(serializer)

        # Siapkan response
        headers = self.get_success_headers(serializer.data)

        logger.info(f">>> LOGGER INFO OrderViewSet create response.data: {serializer.data}")

        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    # def perform_create method sudah ada, pastikan logikanya sesuai kebutuhan (mengisi sales_person jika otomatis)
    # def perform_create(self, serializer):
    #      serializer.save() # Atau serializer.save(sales_person=self.request.user)


    # --- AKHIR TAMBAHAN DEBUG PRINT ---

class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related('order', 'product').all()
    serializer_class = OrderItemSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['order', 'product']
    pagination_class = CustomPagination

class OrderStatusViewSet(viewsets.ModelViewSet):
    queryset = OrderStatus.objects.filter(is_active=True)
    serializer_class = OrderStatusSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu

# ======================
# Production Views
# ======================
class ProduksiViewSet(viewsets.ModelViewSet):
    queryset = Produksi.objects.select_related('order', 'penanggung_jawab').all().order_by('-mulai')
    serializer_class = ProduksiSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = ProductionFilter
    search_fields = ['order__order_number', 'penanggung_jawab__username', 'catatan']
    ordering_fields = ['mulai', 'selesai', 'tahap']
    pagination_class = CustomPagination

class ProductionJobViewSet(viewsets.ModelViewSet):
    queryset = ProductionJob.objects.select_related('order_item__order', 'assigned_to').all()
    serializer_class = ProductionJobSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'assigned_to', 'order_item__order']
    search_fields = ['order_item__order__order_number', 'notes', 'order_item__nama_produk']
    pagination_class = CustomPagination

# ======================
# Inventory & Supplier Views
# ======================
class ProductionMaterialViewSet(viewsets.ModelViewSet):
    queryset = ProductionMaterial.objects.filter(is_active=True).select_related('supplier')
    serializer_class = ProductionMaterialSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['type', 'supplier']
    search_fields = ['name', 'notes']
    pagination_class = CustomPagination

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        low_stock = request.query_params.get('low_stock', None)
        if low_stock == 'true':
            queryset = queryset.filter(current_stock__lt=F('minimum_stock'))
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        super().perform_destroy(instance)

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(is_active=True).order_by('name')
    serializer_class = SupplierSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'contact_person', 'email']
    pagination_class = CustomPagination

    def perform_destroy(self, instance):
        super().perform_destroy(instance)

class InventoryViewSet(viewsets.ModelViewSet):
    queryset = Inventory.objects.select_related('product').filter(product__is_active=True)
    serializer_class = InventorySerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = InventoryFilter
    search_fields = ['product__name', 'product__code', 'location']
    pagination_class = CustomPagination

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.select_related('product', 'created_by').all().order_by('-created_at')
    serializer_class = TransactionSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['transaction_type', 'product']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
         serializer.save(created_by=self.request.user)

# ======================
# Marketing Views
# ======================
class MarketingCampaignViewSet(viewsets.ModelViewSet):
    queryset = MarketingCampaign.objects.filter(is_active=True)
    serializer_class = MarketingCampaignSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['start_date', 'end_date']
    search_fields = ['name', 'description']
    ordering_fields = ['start_date', 'name']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
         serializer.save(created_by=self.request.user)

class RealisasiKunjunganRRViewSet(viewsets.ModelViewSet):
    serializer_class = RealisasiKunjunganRRSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['customer', 'tipe_kunjungan', 'rr']
    search_fields = ['customer__name', 'keterangan', 'produk__name']
    ordering_fields = ['tanggal', 'created_at']
    pagination_class = CustomPagination

    # get_queryset bisa dikomentari sementara jika permission di atas IsAuthenticated
    # def get_queryset(self):
    #     # ... (logika filter berdasarkan role bisa diskip dulu) ...
    #     return RealisasiKunjunganRR.objects.select_related('rr', 'customer', 'produk').all()

    def perform_create(self, serializer):
         # Sementara izinkan user yg login untuk create
         serializer.save(rr=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

# ======================
# Attendance Views
# ======================
class AbsensiViewSet(viewsets.ModelViewSet):
    serializer_class = AbsensiSerializer
    # !!! UBAH PERMISSION UNTUK TES !!!
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'tanggal']
    ordering_fields = ['tanggal', 'check_in', 'user__username']
    pagination_class = CustomPagination

    # get_queryset bisa dikomentari sementara
    # def get_queryset(self):
    #     # ... (logika filter berdasarkan role bisa diskip dulu) ...
    #     return Absensi.objects.select_related('user').all()

    def perform_create(self, serializer):
        # Sementara izinkan input untuk diri sendiri
        serializer.save(user=self.request.user)

# ======================
# Specialized API Views (Reports, Dashboards etc.) - Placeholder
# ======================
# !!! UBAH PERMISSION UNTUK TES !!!
class MarketingOrderList(generics.ListAPIView):
    queryset = Order.objects.select_related('customer', 'sales_person', 'status').prefetch_related('items').filter(is_active=True).order_by('-order_date')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = OrderFilter
    search_fields = ['order_number', 'customer__name', 'notes']
    ordering_fields = ['order_date', 'status__name']

class RRVisitList(generics.ListAPIView):
    queryset = RealisasiKunjunganRR.objects.all().order_by('-tanggal')
    serializer_class = RealisasiKunjunganRRSerializer
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    pagination_class = CustomPagination
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['customer', 'tipe_kunjungan']
    ordering_fields = ['tanggal']

class RRVisitStatsView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request):
         data = {'message': 'Statistik Kunjungan RR - Belum Diimplementasikan'}
         return Response(data)

class MarketingPerformanceView(APIView):
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    def get(self, request):
        data = {'message': 'Performa Marketing - Belum Diimplementasikan'}
        return Response(data)

class SalesDashboardView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request, format=None):
         data = {"message": "Sales Dashboard - Belum Diimplementasikan"}
         return Response(data)

class ProductionStatusView(generics.RetrieveAPIView):
    queryset = Produksi.objects.all()
    serializer_class = ProduksiSerializer
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    lookup_field = 'pk'

class LowStockAlertView(generics.ListAPIView):
    queryset = ProductionMaterial.objects.filter(is_active=True, current_stock__lt=F('minimum_stock'))
    serializer_class = ProductionMaterialSerializer
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    pagination_class = CustomPagination

class ProductionScheduleView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request):
         data = {'schedule': 'Jadwal Produksi - Belum Diimplementasikan'}
         return Response(data)

class InventoryValuationView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request, format=None):
         data = {"message": "Valuasi Inventory - Belum Diimplementasikan"}
         return Response(data)

# ======================
# File Handling Views - Placeholder
# ======================
class FileUploadView(APIView):
    permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
    def post(self, request, *args, **kwargs):
        # ... (logika upload file tetap sama) ...
        file = request.FILES.get('file')
        if not file: return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 5*1024*1024)
        if file.size > max_size: return Response({"error": f"File terlalu besar (max {max_size//1024//1024}MB)"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "success", "filename": file.name}, status=status.HTTP_201_CREATED)

class FileDownloadView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request, file_id, format=None):
         return Response({"message": f"Download file {file_id} - Belum Diimplementasikan."})

# ======================
# System & Dashboard Views - Placeholder
# ======================
class DashboardSummaryView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request):
         summary_data = {
             "orders_total": Order.objects.count(),
             "customers_total": Customer.objects.count(),
             "products_total": Product.objects.count(),
             "message": "Data summary lain akan ditambahkan."
         }
         return Response(summary_data)

class SystemConfigView(APIView):
     permission_classes = [IsAuthenticated] # Coba pakai izin ini saja dulu
     def get(self, request, format=None):
         data = {
             "app_name": "Rumah Akrilik",
             "version": getattr(settings, 'APP_VERSION', '1.0.0'),
             "maintenance_mode": getattr(settings, 'MAINTENANCE_MODE', False)
         }
         return Response(data)

# ======================
# Health Check Views
# ======================
class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"status": "healthy"})

class PingView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"status": "pong"})

# ======================
# ERROR HANDLERS (Referensi di urls.py atau settings.py)
# ======================
# (Fungsi error handler tetap sama)
def bad_request(request, exception=None): return JsonResponse({"error": "Bad Request", "detail": str(exception), "status_code": 400}, status=400)
def permission_denied(request, exception=None): return JsonResponse({"error": "Permission Denied", "detail": str(exception), "status_code": 403}, status=403)
def page_not_found(request, exception=None): return JsonResponse({"error": "Not Found", "status_code": 404}, status=404)
def server_error(request): return JsonResponse({"error": "Internal Server Error", "status_code": 500}, status=500)

# ===== VIEW TES SEDERHANA =====
@api_view(['GET'])
@decorator_permission_classes([AllowAny])
def simple_test_view(request):
    print(">>> Simple Test View Accessed! <<<")
    return JsonResponse({"message": "Simple test view Rumah Akrilik OK!"}, status=200)

# ===== VIEWSET TES MINIMAL (jika masih dipakai) =====
class MinimalOrderTestViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    def list(self, request):
        print(">>> MinimalOrderTestViewSet Accessed! <<<")
        return Response({"message": "Minimal Order Test ViewSet OK!"})
