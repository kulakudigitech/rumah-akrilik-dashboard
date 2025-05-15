# /root/rumah-akrilik/rumah_akrilik_app/urls.py
from .views import simple_test_view
from django.urls import path, include
from django.conf import settings
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
    TokenBlacklistView,
)
from django.views.generic import TemplateView
from django.middleware.csrf import get_token
from django.http import JsonResponse

# Import views (Pastikan path import ini benar sesuai struktur proyek Anda)
from .views import (
    UserViewSet, GroupViewSet, RoleViewSet, ProductViewSet, RRVisitStatsView,
    ProductCategoryViewSet, ProductImageViewSet, CustomerViewSet,
    CustomerAddressViewSet, OrderViewSet, OrderStatusViewSet,
    ProduksiViewSet, ProductionJobViewSet, ProductionMaterialViewSet,
    SupplierViewSet, MarketingCampaignViewSet, InventoryViewSet, TransactionViewSet,
    RealisasiKunjunganRRViewSet, AbsensiViewSet, DashboardSummaryView,
    HealthCheckView, PingView,
    FileUploadView, UserProfileViewSet,
    MarketingOrderList, RRVisitList, MarketingPerformanceView, SalesDashboardView,
    ProductionStatusView, LowStockAlertView, ProductionScheduleView, InventoryValuationView,
    FileDownloadView, SystemConfigView,
    CustomAuthToken,
    UserMeView, UserRegistrationView,
    test_api, verify_auth,
    DashboardStatsView,
    OrderDailyReportView,
    OrderMonthlyReportView,
    ProductionStageViewSet,
    ProductionTrackingViewSet,
    update_production_stages,
    ProductionTrackingByOrderView,
    check_user_role_access,
    hrd_get_users,
    hrd_get_roles,
    hrd_dashboard_stats,
    hrd_get_user_detail,
    hrd_get_role_detail,
    get_available_roles,
    basic_login_view,
    emergency_login,
    emergency_login_direct,
    SafeCustomAuthToken,
    debug_userprofile,
    repair_userprofile,
    UpdateOrderStatusView, # Pastikan UpdateOrderStatusView sudah diimpor
    get_available_tasks_by_stage, # Pastikan get_available_tasks_by_stage sudah diimpor
    get_my_production_assignments, # Pastikan get_my_production_assignments sudah diimpor
    claim_production_task,
    claim_task_alt,
    marketing_team_data,
    marketing_performance_data,
    marketing_member_performance,
    marketing_campaigns_data,
    marketing_target_realization,
    marketing_plans,
    marketing_plan_detail,
    marketing_dashboard_stats,
    get_marketing_users,
    get_pending_approval_orders,
    approve_order_payment,
    reject_order,
    NotificationViewSet, # Pastikan NotificationViewSet sudah diimpor
    get_user_notifications, # Pastikan get_user_notifications sudah diimpor
    mark_notification_read # Pastikan mark_notification_read sudah diimpor
)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from .debug_api import test_database_connection, test_order_status, test_production_tracking, test_environment
# from .views import production_tracking_views
from .production_tracking import get_available_trackings, claim_task, claim_task_alt, get_my_trackings

# Tambahkan fungsi untuk mendapatkan CSRF token
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """
    Endpoint untuk mendapatkan CSRF token
    """
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

# Initialize router
router = DefaultRouter()

# ======================
# ROUTER REGISTRATIONS (Relative to /api/)
# ======================
# User Management
router.register('users', UserViewSet, basename='user')
router.register('groups', GroupViewSet, basename='group')
router.register('roles', RoleViewSet, basename='role')
# router.register('user-profiles', UserProfileViewSet, basename='userprofile')  # Komentari ini

# Product Management
router.register('products', ProductViewSet, basename='product')
router.register('product-categories', ProductCategoryViewSet, basename='productcategory')
router.register('product-images', ProductImageViewSet, basename='productimage')

# Customer Management
router.register('customers', CustomerViewSet, basename='customer')
router.register('customer-addresses', CustomerAddressViewSet, basename='customeraddress')

# Order Management
router.register('order', OrderViewSet, basename='order')
router.register('order-status', OrderStatusViewSet, basename='orderstatus')

# Production Management
router.register('produksi', ProduksiViewSet, basename='produksi')
router.register('production-jobs', ProductionJobViewSet, basename='productionjob')
router.register('production-materials', ProductionMaterialViewSet, basename='productionmaterial')
router.register('production-stages', ProductionStageViewSet)
router.register('production-tracking', ProductionTrackingViewSet)

# Inventory Management
# router.register('inventory', InventoryViewSet, basename='inventory')  # Komentari ini
# router.register('transactions', TransactionViewSet, basename='transaction')  # Komentari ini
router.register('suppliers', SupplierViewSet, basename='supplier')

# Marketing
# router.register('rr-visits', RealisasiKunjunganRRViewSet, basename='rrvisit')  # Komentari ini
router.register('marketing-campaigns', MarketingCampaignViewSet, basename='marketingcampaign')

# Attendance
# router.register('attendance', AbsensiViewSet, basename='attendance')  # Komentari ini

# Notifications
router.register('notifications', NotificationViewSet, basename='notification')


# ======================
# URL PATTERNS (Relative to /api/)
# ======================
urlpatterns = [
    # Include URLs from the router
    path('', include(router.urls)),

    # Sederhanakan endpoint auth
    path('auth/', include([
        path('login/', CustomAuthToken.as_view(), name='api-login'),
        path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
        path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
        # Simpan endpoint emergency untuk berjaga-jaga
        path('emergency-login/', emergency_login_direct, name='emergency-login'),
    ])),

    # Marketing (relative path from /api/)
    path('marketing/orders/', MarketingOrderList.as_view(), name='marketing-orders'),
    path('marketing/performance/', MarketingPerformanceView.as_view(), name='marketing-performance'),
    path('rr/my-visits/', RRVisitList.as_view(), name='rr-my-visits'),
    path('rr/visit-stats/', RRVisitStatsView.as_view(), name='rr-visit-stats'),
    path('marketing/performance/', marketing_performance_data, name='marketing_performance_data'),
    path('marketing/campaigns/', marketing_campaigns_data, name='marketing_campaigns_data'),

    # Production (relative path from /api/)
    path('production/status/<int:pk>/', ProductionStatusView.as_view(), name='production-status'),
    path('production/schedule/', ProductionScheduleView.as_view(), name='production-schedule'),
    
    # === URL BARU DAN YANG DISESUAIKAN UNTUK PRODUCTION TRACKING & ORDERS ===
    # Path 'production-tracking/update/' sudah ada, pastikan `update_production_stages` terimpor dengan benar.
    # Jika belum ada atau ingin dikelompokkan:
    path('production-tracking/update/', update_production_stages, name='update_production_stages_explicit'), # Name diubah sedikit jika yang lama tetap, atau hapus yang duplikat
    path('production-tracking/by-order/<int:order_id>/', ProductionTrackingByOrderView.as_view(), name='production-tracking-by-order'),
    path('production-tracking/<int:tracking_id>/claim/', claim_production_task, name='claim_production_task'),
    path('production-tracking/by-stage/', get_available_tasks_by_stage, name='get-available-tasks-by-stage'),
    path('production-tracking/my-assignments/', get_my_production_assignments, name='get-my-production-assignments'),
    
    # Path 'production-stages/' untuk list (jika router.register belum mencukupi atau nama spesifik diperlukan)
    # Perhatikan: router.register('production-stages', ProductionStageViewSet) sudah ada di atas.
    # Path ini akan spesifik untuk 'get: list' dan mungkin berguna jika ingin nama URL yang berbeda dari router.
    path('production-stages/list/', ProductionStageViewSet.as_view({'get': 'list'}), name='production-stages-list'), # Mengubah path sedikit agar tidak sama persis dengan root dari router

    # Path untuk OrderViewSet dengan prefix 'orders/' (berbeda dari 'order/' yang diregister router)
    path('orders/', OrderViewSet.as_view({'get': 'list', 'post': 'create'}), name='api-order-list'),
    path('orders/<int:pk>/', OrderViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='api-order-detail'),
    path('orders/<int:order_id>/update-status/', UpdateOrderStatusView.as_view(), name='update-order-status'),
    # =======================================================================

    # Inventory (relative path from /api/)
    path('inventory/low-stock/', LowStockAlertView.as_view(), name='low-stock'),
    path('inventory/valuation/', InventoryValuationView.as_view(), name='inventory-valuation'),

    # Dashboard (relative path from /api/)
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/sales/', SalesDashboardView.as_view(), name='sales-dashboard'),
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard-stats'),
    # path('dashboard/', Dashboard.as_view(), name='dashboard'),

    # File Handling (relative path from /api/)
    path('files/upload/', FileUploadView.as_view(), name='file-upload'),
    path('files/download/<uuid:file_id>/', FileDownloadView.as_view(), name='file-download'),

    # System (relative path from /api/)
    path('system/health/', HealthCheckView.as_view(), name='health-check'),
    path('system/ping/', PingView.as_view(), name='ping'),
    path('system/config/', SystemConfigView.as_view(), name='system-config'),
    path('system/debug-userprofile/', debug_userprofile, name='debug-userprofile'),
    path('system/repair-userprofile/', repair_userprofile, name='repair-userprofile'),

    # Test paths (relative path from /api/)
    path('test/', test_api, name='test_api'),
    path('verify/', verify_auth, name='verify_auth'),

    # Swagger Docs (jika Anda ingin menampilkannya di /api/docs/)
    # path('docs/', TemplateView.as_view(template_name='swagger.html'), name='api-docs'),

    # Add this line for daily order report
    path('order/report/daily/', OrderDailyReportView.as_view(), name='order-daily-report'),

    # Add this line for monthly order report
    path('order/report/monthly/', OrderMonthlyReportView.as_view(), name='order-monthly-report'),

    # Add this line for debug order create
    path('debug/order/', OrderViewSet.as_view({'post': 'create'}), name='debug-order-create'),

    # Add health check endpoint
    path('health/', simple_test_view, name='api-health'),

    # debug api
    path('debug/db/', test_database_connection, name='test-database'),
    path('debug/order-status/', test_order_status, name='test-order-status'),
    path('debug/production-tracking/', test_production_tracking, name='test-production-tracking'),
    path('debug/environment/', test_environment, name='test-environment'),

    # User role endpoints
    path('user/check-role/<str:role_name>/', check_user_role_access, name='check-user-role'),
    path('roles/available/', get_available_roles, name='get-available-roles'),
    path('hrd/users/', hrd_get_users, name='hrd_get_users'),
    path('hrd/roles/', hrd_get_roles, name='hrd_get_roles'),
    path('hrd/dashboard/', hrd_dashboard_stats, name='hrd_dashboard_stats'),
    path('hrd/users/<int:user_id>/', hrd_get_user_detail, name='hrd_get_user_detail'),
    path('hrd/roles/<int:role_id>/', hrd_get_role_detail, name='hrd_get_role_detail'),

    # Tambahkan di urlpatterns
    path('debug/update-order-status/<int:order_id>/', UpdateOrderStatusView.as_view(), name='debug-update-order-status'),

    # Production Tracking URLs
    path('production-trackings/available/', get_available_trackings, name='available_trackings'),
    path('production-trackings/<int:tracking_id>/', claim_task, name='claim_task'),
    path('production-tracking/claim/', claim_task_alt, name='claim_task_alt'),
    path('production-trackings/my-tasks/', get_my_trackings, name='my_trackings'),  # URL baru

    # Tambahkan path alternatif untuk my-tasks (setelah path yang sudah ada)
    path('production-trackings/my-tasks/', get_my_trackings, name='my_trackings'),  
    path('production-tracking/my-tasks/', get_my_trackings, name='my_trackings_alt'),  # Alternatif URL

    # Include API URLs
    # path('api/', include('rumah_akrilik_app.api.urls')),

    # Tambahkan di urls.py
    path('marketing-team-data/', marketing_team_data, name='marketing_team_data'),
    path('marketing-campaigns-data/', marketing_campaigns_data, name='marketing_campaigns_data'),
    path('marketing/member/<int:user_id>/performance/', marketing_member_performance, name='marketing_member_performance'),
    path('marketing/performance-data/', marketing_performance_data, name='marketing-performance-data'),
    path('marketing/target-realization/', marketing_target_realization, name='marketing-target-realization'),
    path('marketing/plans/', marketing_plans, name='marketing-plans'),
    path('marketing/plans/<int:pk>/', marketing_plan_detail, name='marketing-plan-detail'),
    path('marketing/dashboard-stats/', marketing_dashboard_stats, name='marketing-dashboard-stats'),

    # Marketing routes yang diedit
    path('users/marketing/', get_marketing_users, name='marketing_users'),
    path('marketing/member-performance/<int:user_id>/', marketing_member_performance, name='marketing_member_performance'),
    path('marketing/campaigns/', marketing_campaigns_data, name='marketing_campaigns_alt'),

    # Tambahkan URL pattern
    path('orders/pending-approval/', get_pending_approval_orders, name='get_pending_approval_orders'),
    path('orders/approve-payment/', approve_order_payment, name='approve_order_payment'),
    path('orders/<int:order_id>/reject/', reject_order, name='reject_order'),

    # Notifications
    path('notifications/user/', get_user_notifications, name='user-notifications'),
    path('notifications/<int:notification_id>/read/', mark_notification_read, name='mark-notification-read'),

    # Add simple test endpoint
    path('test-simple/', simple_test_view, name='simple-test'),
]

# Error handlers (sudah didefinisikan di settings.py atau di root urls.py)
# handler400 = 'rumah_akrilik_app.views.bad_request'
# handler403 = 'rumah_akrilik_app.views.permission_denied'
# handler404 = 'rumah_akrilik_app.views.page_not_found'
# handler500 = 'rumah_akrilik_app.views.server_error'