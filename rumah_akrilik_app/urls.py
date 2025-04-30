# /root/rumah-akrilik/rumah_akrilik_app/urls.py
from .views import simple_test_view
from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView, # Pastikan ini diimport
    TokenBlacklistView,
)
from django.views.generic import TemplateView

# Import views (Pastikan path import ini benar sesuai struktur proyek Anda)
from .views import (
    UserViewSet, GroupViewSet, RoleViewSet, ProductViewSet, RRVisitStatsView,
    ProductCategoryViewSet, ProductImageViewSet, CustomerViewSet,
    CustomerAddressViewSet, OrderViewSet, OrderItemViewSet, OrderStatusViewSet,
    ProduksiViewSet, ProductionJobViewSet, ProductionMaterialViewSet,
    SupplierViewSet, MarketingCampaignViewSet, InventoryViewSet, TransactionViewSet,
    RealisasiKunjunganRRViewSet, AbsensiViewSet, DashboardSummaryView,
    HealthCheckView, PingView, # VerifyTokenView (Mungkin tidak perlu jika pakai TokenVerifyView standar),
    FileUploadView, UserProfileViewSet,
    MarketingOrderList, RRVisitList, MarketingPerformanceView, SalesDashboardView,
    ProductionStatusView, LowStockAlertView, ProductionScheduleView, InventoryValuationView,
    FileDownloadView, SystemConfigView,
    CustomAuthToken, # View login kustom Anda
    UserMeView, UserRegistrationView, # View lain yang mungkin Anda punya
    test_api, verify_auth # Views test Anda
)

# Initialize router
router = DefaultRouter()

# ======================
# ROUTER REGISTRATIONS (Relative to /api/)
# ======================
# User Management
router.register('users', UserViewSet, basename='user')
router.register('groups', GroupViewSet, basename='group')
router.register('roles', RoleViewSet, basename='role')
router.register('user-profiles', UserProfileViewSet, basename='userprofile')
# Product Management
router.register('products', ProductViewSet, basename='product')
router.register('product-categories', ProductCategoryViewSet, basename='productcategory')
router.register('product-images', ProductImageViewSet, basename='productimage')
# Customer Management
router.register('customers', CustomerViewSet, basename='customer')
router.register('customer-addresses', CustomerAddressViewSet, basename='customeraddress')
# Order Management
router.register('order', OrderViewSet, basename='order') # <-- KEMBALIKAN VIEWSET ASLI
router.register('order-items', OrderItemViewSet, basename='orderitem')
router.register('order-status', OrderStatusViewSet, basename='orderstatus')
# Production Management
router.register('produksi', ProduksiViewSet, basename='produksi')
router.register('production-jobs', ProductionJobViewSet, basename='productionjob')
router.register('production-materials', ProductionMaterialViewSet, basename='productionmaterial')
# Inventory Management
router.register('inventory', InventoryViewSet, basename='inventory')
router.register('transactions', TransactionViewSet, basename='transaction')
router.register('suppliers', SupplierViewSet, basename='supplier')
# Marketing
router.register('rr-visits', RealisasiKunjunganRRViewSet, basename='rrvisit')
router.register('marketing-campaigns', MarketingCampaignViewSet, basename='marketingcampaign')
# Attendance
router.register('attendance', AbsensiViewSet, basename='attendance')

# ======================
# URL PATTERNS (Relative to /api/)
# ======================
urlpatterns = [
    # Include URLs from the router
    path('', include(router.urls)),

    path('simple-test/', simple_test_view, name='simple-test'),
    # Authentication API (relative path from /api/)
    # Frontend expects /api/auth/login/ and /api/auth/token/verify/
    path('auth/', include([
        path('login/', CustomAuthToken.as_view(), name='api-login'), # Menggunakan view kustom Anda
        # Jika CustomAuthToken tidak menangani refresh/verify, gunakan standar:
        # path('token/', TokenObtainPairView.as_view(), name='token-obtain-pair'), # Jika login pakai standar JWT
        path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
        path('token/verify/', TokenVerifyView.as_view(), name='token-verify'), # Path yang dicari frontend
        path('token/blacklist/', TokenBlacklistView.as_view(), name='token-blacklist'),
        path('me/', UserMeView.as_view(), name='current-user'),
        path('register/', UserRegistrationView.as_view(), name='user-register'),
        # path('password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')), # Uncomment jika pakai reset password
    ])),

    # Sertakan URL dari api/urls.py (jika masih diperlukan, relative to /api/)
    path('misc/', include('api.urls')), # Contoh: /api/misc/test/

    # Marketing (relative path from /api/)
    path('marketing/orders/', MarketingOrderList.as_view(), name='marketing-orders'),
    path('marketing/performance/', MarketingPerformanceView.as_view(), name='marketing-performance'),
    path('rr/my-visits/', RRVisitList.as_view(), name='rr-my-visits'),
    path('rr/visit-stats/', RRVisitStatsView.as_view(), name='rr-visit-stats'),

    # Production (relative path from /api/)
    path('production/status/<int:pk>/', ProductionStatusView.as_view(), name='production-status'),
    path('production/schedule/', ProductionScheduleView.as_view(), name='production-schedule'),

    # Inventory (relative path from /api/)
    path('inventory/low-stock/', LowStockAlertView.as_view(), name='low-stock'),
    path('inventory/valuation/', InventoryValuationView.as_view(), name='inventory-valuation'),

    # Dashboard (relative path from /api/)
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/sales/', SalesDashboardView.as_view(), name='sales-dashboard'),

    # File Handling (relative path from /api/)
    path('files/upload/', FileUploadView.as_view(), name='file-upload'),
    path('files/download/<uuid:file_id>/', FileDownloadView.as_view(), name='file-download'),

    # System (relative path from /api/)
    path('system/health/', HealthCheckView.as_view(), name='health-check'),
    path('system/ping/', PingView.as_view(), name='ping'),
    path('system/config/', SystemConfigView.as_view(), name='system-config'),

    # Test paths (relative path from /api/)
    path('test/', test_api, name='test_api'),
    path('verify/', verify_auth, name='verify_auth'), # Path ini mungkin bentrok dengan auth/token/verify/

    # Swagger Docs (jika Anda ingin menampilkannya di /api/docs/)
    # path('docs/', TemplateView.as_view(template_name='swagger.html'), name='api-docs'), # Harus disesuaikan
]

# Error handlers (sudah didefinisikan di settings.py)
handler400 = 'rumah_akrilik_app.views.bad_request'
handler403 = 'rumah_akrilik_app.views.permission_denied'
handler404 = 'rumah_akrilik_app.views.page_not_found'
handler500 = 'rumah_akrilik_app.views.server_error'
