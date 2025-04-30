# /root/rumah-akrilik/backend/urls.py
"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    # Arahkan semua request API ke aplikasi rumah_akrilik_app
    # Frontend mengharapkan prefix /api/
    path('api/', include('rumah_akrilik_app.urls')),
]

# Pengaturan untuk file media di mode DEBUG
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Jika Anda memiliki halaman frontend statis yang disajikan Django (jarang terjadi jika pakai React terpisah)
# urlpatterns += [
#     # Tangkap semua path lain dan arahkan ke view index React (jika ada)
#     re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
# ]
