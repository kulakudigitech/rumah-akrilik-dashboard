from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# Define error handlers
handler400 = 'rumah_akrilik_app.views.bad_request'
handler403 = 'rumah_akrilik_app.views.permission_denied'
handler404 = 'rumah_akrilik_app.views.page_not_found'
handler500 = 'rumah_akrilik_app.views.server_error'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('rumah_akrilik_app.urls')),  # Mengarah ke semua endpoint API
]

# Add media and static files configuration
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

print("DEBUG: Memuat urls.py - Project Level")