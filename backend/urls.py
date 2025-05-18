# /root/rumah-akrilik/backend/urls.py
"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from rumah_akrilik_app.views import CustomTokenObtainPairView, login_debug_view
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.permissions import AllowAny

schema_view = get_schema_view(
   openapi.Info(
      title="Rumah Akrilik API",
      default_version='v1',
      description="API Documentation for Rumah Akrilik",
   ),
   public=True,
   permission_classes=[AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Arahkan semua request API ke aplikasi rumah_akrilik_app
    # Frontend mengharapkan prefix /api/
    path('api/', include('rumah_akrilik_app.urls')),

    # Auth URLs
    # path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    # path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('api/auth/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('api/auth/debug-login/', login_debug_view, name='debug_login'),

    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Pengaturan untuk file media di mode DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Jika Anda memiliki halaman frontend statis yang disajikan Django (jarang terjadi jika pakai React terpisah)
# urlpatterns += [
#     # Tangkap semua path lain dan arahkan ke view index React (jika ada)
#     re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
# ]
