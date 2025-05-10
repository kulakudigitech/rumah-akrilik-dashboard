# filepath: c:\Users\mbote\OneDrive\Desktop\rumah akrilik\System RA 10 Mei\root_rumah-akrilik\rumah_akrilik_app\debug_api.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.db import connection
from django.db.utils import OperationalError
import traceback
import sys
import os
from django.conf import settings

@api_view(['GET'])
@permission_classes([AllowAny])
def test_database_connection(request):
    """Test connection to the database"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            if result[0] == 1:
                return Response({"status": "success", "message": "Database connection successful"})
            else:
                return Response({"status": "error", "message": "Database connection failed"})
    except OperationalError as e:
        return Response({"status": "error", "message": f"Database error: {str(e)}"})
    except Exception as e:
        return Response({"status": "error", "message": f"Error: {str(e)}", "traceback": traceback.format_exc()})

@api_view(['GET'])
@permission_classes([AllowAny])
def test_order_status(request):
    """Test OrderStatus model"""
    try:
        from .models import OrderStatus
        statuses = OrderStatus.objects.all()
        status_list = [{"id": s.id, "name": s.name, "is_active": s.is_active} for s in statuses]
        return Response({"status": "success", "count": len(status_list), "data": status_list})
    except Exception as e:
        return Response({"status": "error", "message": f"Error: {str(e)}", "traceback": traceback.format_exc()})

@api_view(['GET'])
@permission_classes([AllowAny])
def test_production_tracking(request):
    """Test ProductionTracking model"""
    try:
        from .models import ProductionTracking
        tracking = ProductionTracking.objects.all()[:5]
        tracking_list = [{"id": t.id, "order_id": t.order_id, "stage_id": t.stage_id, "status": t.status} for t in tracking]
        return Response({"status": "success", "count": len(tracking_list), "data": tracking_list})
    except Exception as e:
        return Response({"status": "error", "message": f"Error: {str(e)}", "traceback": traceback.format_exc()})

@api_view(['GET'])
@permission_classes([AllowAny])
def test_environment(request):
    """Test environment configuration"""
    try:
        return Response({
            "status": "success",
            "python_version": sys.version,
            "django_version": settings.DJANGO_VERSION if hasattr(settings, 'DJANGO_VERSION') else "Unknown",
            "base_dir": settings.BASE_DIR,
            "debug_mode": settings.DEBUG,
            "database_engine": settings.DATABASES['default']['ENGINE'],
        })
    except Exception as e:
        return Response({"status": "error", "message": f"Error: {str(e)}", "traceback": traceback.format_exc()})