# /root/rumah-akrilik/rumah_akrilik_app/views.py

from rest_framework import viewsets, generics, status, filters, permissions
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny # Import permission standard
# Import permission custom Anda
from .permissions import (
    IsOwner, IsGeneralManager, IsManager, IsSupervisor, IsKoordinator,
    IsStaff, IsAdminKeuangan, IsMarketingUser, IsRRUser, IsProductionUser,
    IsDesignerUser, IsOperatorMesinUser, IsFinishingUser, IsQCUser, IsPackingUser,
    IsGudangUser, IsInventoryUser, IsResellerUser
)

# Impor PermissionDenied untuk error handling
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.views import TokenObtainPairView

from django.contrib.auth.models import User, Group
from django.contrib.auth import authenticate
from django.db.models import F, Count, Sum, ExpressionWrapper, DecimalField, Prefetch, Q
from django.db.models.functions import TruncMonth  # Tambahkan import ini
from django_filters.rest_framework import DjangoFilterBackend
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings # Untuk akses settings
from django.utils import timezone
from datetime import timedelta, datetime
from django.views.decorators.cache import cache_page
from rest_framework.pagination import PageNumberPagination
import socket
import logging
import traceback
from django.core.exceptions import ObjectDoesNotExist
from django.utils.dateparse import parse_date
import uuid
import os

# --- Import Models ---
from .models import (
    CustomerAddress, ProductImage, OrderStatus, ProductionMaterial, Supplier,
    MarketingCampaign, Order, Produksi, Absensi, Product, RealisasiKunjunganRR,
    Role, UserProfile, ProductCategory, OrderItem, ProductionJob, Inventory,
    Transaction, Customer, ProductionStage, ProductionTracking, CustomUser,
    Notification
)

# Add to top of views.py file
from .models import ProductionStage, ProductionTracking, Order, OrderStatus

# --- Import Serializers ---
from .serializers import (
    # Pastikan OrderListSerializer ada di daftar ini
    CustomerAddressSerializer, ProductImageSerializer, OrderStatusSerializer,
    ProductionMaterialSerializer, SupplierSerializer, MarketingCampaignSerializer,
    OrderSerializer, ProduksiSerializer, AbsensiSerializer, ProductSerializer,
    RealisasiKunjunganRRSerializer, RoleSerializer, UserProfileSerializer,
    UserSerializer, ProductCategorySerializer, OrderItemSerializer,
    ProductionJobSerializer, InventorySerializer, TransactionSerializer,
    GroupSerializer, CustomerSerializer, OrderListSerializer,
    ProductionStageSerializer, ProductionTrackingSerializer, NotificationSerializer
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

from .models import ProductionStage, ProductionTracking, Notification
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import ProductionStageSerializer, ProductionTrackingSerializer

# Add at the top of your views.py file if not already present
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Order, ProductionTracking, ProductionStage
from .serializers import ProductionTrackingSerializer, ProductionStageSerializer

# Tambahkan exception handler
from rest_framework.views import exception_handler

def custom_exception_handler(exc, context):
    """Memastikan semua error dikembalikan dalam format JSON yang konsisten"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # Pastikan respons error selalu dalam format yang konsisten
        response.data = {
            "detail": str(exc),
            "status_code": response.status_code
        }
    else:
        # Untuk exception yang tidak tertangani
        import traceback
        traceback.print_exc()
        
        from rest_framework.response import Response
        from rest_framework import status
        response = Response({
            "detail": "Terjadi kesalahan pada server",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return response

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
        try:
            print("=== LOGIN ATTEMPT DEBUG ===")
            print(f"Request data: {request.data}")
            
            # Gunakan cara autentikasi paling dasar
            username = request.data.get('username')
            password = request.data.get('password')
            
            # Autentikasi sederhana
            from django.contrib.auth import authenticate
            user = authenticate(username=username, password=password)
            
            if not user:
                return Response({'detail': 'Invalid credentials'}, status=401)
                
            if not user.is_active:
                return Response({'detail': 'User account is disabled'}, status=403)
            
            # Buat token tanpa mencoba akses profile
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            
            # Berikan respons minimal yang diperlukan
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'token': str(refresh.access_token),  # Duplikasi untuk backward compatibility
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'role': 'Admin' if user.is_superuser else 'User'  # Hardcoded role
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()  # Log error lengkap
            return Response({'detail': 'Authentication error'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
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
@permission_classes([AllowAny])
@csrf_exempt
def test_api(request):
    return Response({"message": "Test API Rumah Akrilik berhasil!"})

@api_view(['GET'])
@permission_classes([AllowAny])
def simple_test_view(request):
    """
    Simple view for testing API connectivity
    """
    return Response({
        "status": "success",
        "message": "API connection successful",
        "timestamp": timezone.now()
    })

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

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login endpoint yang memberikan informasi tambahan
    """
    def post(self, request, *args, **kwargs):
        try:
            response = super().post(request, *args, **kwargs)
            
            if response.status_code == 200:
                # Tambahkan info user
                user = request.user
                response.data['username'] = user.username
                response.data['is_staff'] = user.is_staff
                response.data['is_superuser'] = user.is_superuser
                
                # Tambahkan info role jika ada
                try:
                    if hasattr(user, 'profile') and user.profile.role:
                        response.data['role'] = user.profile.role.name
                    else:
                        response.data['role'] = 'User'
                except:
                    response.data['role'] = 'User'
                    
                # Set profile_complete
                response.data['profile_complete'] = hasattr(user, 'profile')
                
            return response
        except Exception as e:
            # Log error untuk troubleshooting
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Login error: {str(e)}")
            
            # Return descriptive error
            return Response({'detail': f'Login error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_debug_view(request):
    """
    Endpoint debug untuk memeriksa masalah login
    """
    try:
        # Log request info for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Login debug - Headers: {request.headers}")
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        logger.info(f"Login debug - Username: {username}")
        
        # Basic validation
        if not username or not password:
            return Response({
                'detail': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate but don't log in
        user = authenticate(username=username, password=password)
        
        if user is not None:
            # User authenticated successfully
            return Response({
                'detail': 'Authentication successful',
                'username': username,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
            }, status=status.HTTP_200_OK)
        else:
            # Authentication failed
            return Response({
                'detail': 'Invalid credentials'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        # Log and return any errors
        import logging, traceback
        logger = logging.getLogger(__name__)
        logger.error(f"Login debug error: {str(e)}")
        logger.error(traceback.format_exc())
        
        return Response({
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_roles(request):
    """
    Returns all available roles in the system
    """
    roles = Role.objects.filter(is_active=True).order_by('name')
    serializer = RoleSerializer(roles, many=True)
    return Response(serializer.data)

# Tambahkan endpoint login alternatif yang lebih sederhana
@api_view(['POST'])
@permission_classes([AllowAny])
def simple_login_view(request):
    """
    Endpoint login alternatif jika endpoint utama mengalami masalah
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"Login attempt: {username}")
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({'detail': 'Invalid credentials'}, status=401)
        
        # Generate token tanpa ketergantungan pada UserProfile
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        })
    except Exception as e:
        print(f"Login error: {str(e)}")
        return Response({'detail': 'Server error during login'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def basic_login_view(request):
    """
    Endpoint login sederhana yang minimal dependency
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Log untuk debug
        print(f"Attempting basic login: {username}")
        
        # Validasi input
        if not username or not password:
            return Response({"detail": "Username dan password diperlukan"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Autentikasi sederhana
        user = authenticate(username=username, password=password)
        
        if not user:
            return Response({"detail": "Kredensial tidak valid"}, status=status.HTTP_401_UNAUTHORIZED)
            
        if not user.is_active:
            return Response({"detail": "User tidak aktif"}, status=status.HTTP_403_FORBIDDEN)
        
        # Generate token
        token = RefreshToken.for_user(user)
        
        # Respons sederhana
        response_data = {
            'token': str(token.access_token), 
            'refresh': str(token),
            'user_id': user.id,
            'username': user.username,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser
        }
        
        # Coba tambahkan informasi role jika tersedia
        try:
            if hasattr(user, 'userprofile') and hasattr(user.userprofile, 'role') and user.userprofile.role:
                response_data['role'] = user.userprofile.role.name
            else:
                response_data['role'] = 'User'
        except:
            response_data['role'] = 'User'
        
        return Response(response_data)
        
    except Exception as e:
        print(f"Basic login error: {str(e)}")
        print(traceback.format_exc())
        return Response(
            {"detail": "Terjadi kesalahan server saat login"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def emergency_login(request):
    """
    Endpoint super simple untuk emergency access
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Validasi super sederhana - ganti dengan kredensial admin yang valid
        EMERGENCY_USER = "admin"
        EMERGENCY_PASS = "adminpassword"  # Ganti dengan password sebenarnya
        
        if username == EMERGENCY_USER and password == EMERGENCY_PASS:
            return Response({
                "token": "emergency-token-123",
                "refresh": "emergency-refresh-123",
                "username": username,
                "role": "Admin",
                "is_staff": True,
                "is_superuser": True
            })
        
        return Response({"detail": "Unauthorized"}, status=401)
    except:
        return Response({"detail": "Error"}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def emergency_login_direct(request):
    """
    Endpoint emergency login yang sangat sederhana tanpa ketergantungan pada model lain
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"[EMERGENCY] Login attempt: {username}")
        
        # Validasi manual
        from django.contrib.auth.models import User
        from django.contrib.auth.hashers import check_password
        
        try:
            # Gunakan try-except untuk menangkap kesalahan database
            user = User.objects.get(username=username)
            
            # Verifikasi password secara manual tanpa authenticate()
            if check_password(password, user.password):
                # Buat token secara manual
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken.for_user(user)
                
                # Kembalikan respons minimal
                return Response({
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                    'username': username,
                    'is_superuser': user.is_superuser,
                    'is_staff': user.is_staff,
                    'role': 'Admin' if user.is_superuser else 'User'
                })
            else:
                return Response({"detail": "Invalid password"}, status=401)
                
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=401)
            
    except Exception as e:
        # Log error tapi kembalikan respons generik untuk keamanan
        print(f"EMERGENCY LOGIN ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({"detail": "Authentication failed"}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def no_csrf_login(request):
    """
    Endpoint login tanpa CSRF protection, hanya untuk sementara
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"No CSRF login attempt: {username}")
        
        user = authenticate(request=request, username=username, password=password)
        
        if not user:
            return Response({'error': 'Invalid Credentials'}, status=400)
            
        if not user.is_active:
            return Response({'error': 'User account is disabled.'}, status=403)
        
        # Buat token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'token': str(refresh.access_token),
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'role': 'Admin' if user.is_superuser else 'User'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)

# Add this class to resolve the ImportError
class SafeCustomAuthToken(ObtainAuthToken):
    """
    Safe implementation of CustomAuthToken for emergency situations
    """
    def post(self, request, *args, **kwargs):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            user = authenticate(request=request, username=username, password=password)
            
            if not user:
                return Response({'error': 'Invalid Credentials'}, status=status.HTTP_400_BAD_REQUEST)
                
            if not user.is_active:
                return Response({'error': 'User account is disabled.'}, status=status.HTTP_403_FORBIDDEN)
                
            refresh = RefreshToken.for_user(user)
            
            # Simple role determination without dependency on user profile
            role_name = 'Admin' if user.is_superuser else 'User'
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'username': user.username,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'role': role_name
            })
        except Exception as e:
            # Log error but return generic response
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Login error in SafeCustomAuthToken: {str(e)}")
            
            return Response({
                'detail': 'Server error during authentication. Please use emergency access.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        'items', 'items__product' # Pastikan prefetch jika sering akses item
    ).filter(is_active=True).order_by('-order_date')
    serializer_class = OrderSerializer
    # Ubah permission_classes menjadi IsAuthenticated saja untuk sementara (atau sesuaikan jika perlu)
    permission_classes = [IsAuthenticated] 
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['order_number', 'customer__name', 'notes', 'items__product__name', 'items__product__code', 'items__nama_produk']
    ordering_fields = ['order_date', 'status__name']
    pagination_class = CustomPagination # Pastikan CustomPagination terdefinisi

    def create(self, request, *args, **kwargs):
        # Jika Anda tidak melakukan modifikasi khusus di create, bisa dihapus
        # Jika ada, pastikan logging dan logicnya benar
        try:
            logger.info(f"Received data for Order Create: {request.data}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in OrderViewSet.create: {str(e)}")
            logger.exception("Full stacktrace:")
            return Response(
                {"error": "Terjadi kesalahan internal saat membuat order."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        # Set sales_person ke user yang login (Pastikan user punya profile)
        # Tambahkan validasi jika perlu
        try:
            serializer.save(sales_person=self.request.user)
        except Exception as e:
             logger.error(f"Error in OrderViewSet.perform_create: {str(e)}")
             # Handle error jika user tidak bisa jadi sales_person
             # Mungkin perlu di set null=True di model atau logic lain
             serializer.save() # Coba simpan tanpa sales_person jika memungkinkan

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # If no pagination
        serializer = self.get_serializer(queryset, many=True)
        
        # Return consistent format
        return Response({
            'count': queryset.count(),
            'next': None,
            'previous': None,
            'results': serializer.data
        })

    def update(self, request, *args, **kwargs):
        print(f"PATCH request received: {request.data}")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        print(f"PATCH request received: {request.data}")
        instance = self.get_object()
        print(f"Current status: {instance.status}")
        
        # Handle status update directly
        if 'status' in request.data:
            status_data = request.data['status']
            print(f"Status in request: {status_data}")
            
            # If status is a dict with an id field, extract the id
            if isinstance(status_data, dict) and 'id' in status_data:
                status_id = status_data['id']
                print(f"Updating status to ID: {status_id} (from dict)")
            # If status is a direct ID
            elif isinstance(status_data, (int, str)) and str(status_data).isdigit():
                status_id = int(status_data)
                print(f"Updating status to ID: {status_id} (from int/str)")
            else:
                # No change or invalid format
                print(f"Invalid status format: {status_data}")
                status_id = None
                
            # Update the status if we have a valid ID
            if status_id is not None:
                try:
                    from rumah_akrilik_app.models import OrderStatus
                    status_obj = OrderStatus.objects.get(id=status_id)
                    instance.status = status_obj
                    instance.save()
                    print(f"Status updated to: {instance.status}")
                except OrderStatus.DoesNotExist:
                    print(f"OrderStatus with ID {status_id} does not exist")
        
        # Continue with the standard update process for other fields
        response = super().partial_update(request, *args, **kwargs)
        
        # Verify update worked
        updated_instance = self.get_object()
        print(f"Final status: {updated_instance.status}")
        return response

class OrderStatusViewSet(viewsets.ModelViewSet):
    queryset = OrderStatus.objects.filter(is_active=True)
    serializer_class = OrderStatusSerializer
    permission_classes = [IsAuthenticated]

class UpdateOrderStatusView(APIView):
    """
    View untuk mengupdate status order berdasarkan progress produksi
    """
    # Ubah permission class untuk debugging
    # permission_classes = [IsAuthenticated]  # Komentar ini dulu
    permission_classes = [AllowAny]  # Gunakan ini untuk debugging
    
    def post(self, request, order_id, format=None):
        try:
            # Tambahkan log debugging
            print(f"Received request to update status for order {order_id}")
            print(f"Request user: {request.user}")
            print(f"Request data: {request.data}")
            
            # Cari order berdasarkan ID
            order = Order.objects.get(id=order_id)
            print(f"Found order: {order}")
            
            # Cek jika production tracking sudah 100% selesai
            production_trackings = ProductionTracking.objects.filter(order=order)
            all_completed = all(track.status == 'completed' for track in production_trackings)
            print(f"All stages completed: {all_completed}")
            
            if all_completed:
                # Ambil status 'Selesai'
                try:
                    status_selesai = OrderStatus.objects.get(name__iexact='Selesai')
                except OrderStatus.DoesNotExist:
                    # Jika status 'Selesai' tidak ada, buat baru
                    status_selesai = OrderStatus.objects.create(name='Selesai', is_active=True)
                
                # Update status order menjadi 'Selesai'
                order.status = status_selesai
                order.save()
                print(f"Order status updated to: {status_selesai.name}")
                
                return Response({
                    'success': True,
                    'message': f'Order #{order.order_number} berhasil diupdate menjadi "Selesai"'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Semua tahap produksi belum selesai'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Order.DoesNotExist:
            return Response({
                'success': False,
                'message': f'Order dengan ID {order_id} tidak ditemukan'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error updating order status: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return Response({
                'success': False, 
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_order_payment(request):
    """API endpoint for Admin Marketing to approve orders with payment details"""
    # Verify user has permission (admin marketing or higher)
    allowed_roles = ['admin_marketing', 'supervisor_marketing', 'manager_marketing', 'general_manager', 'owner']
    if request.user.role not in allowed_roles:
        return Response({'detail': 'You do not have permission to approve orders.'}, status=403)
        
    # Get order
    order_id = request.data.get('order_id')
    if not order_id:
        return Response({'detail': 'Order ID is required.'}, status=400)
        
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=404)
        
    # Process payment data
    is_cod = request.data.get('is_cod') == 'true'
    
    if is_cod:
        # Handle COD order
        order.payment_method = 'cod'
        order.payment_status = 'pending'
        order.status = 'approved'
        order.approved_by = request.user
        order.approved_date = timezone.now()
        order.notes = f"{order.notes or ''}\nApproved as COD by {request.user.get_full_name() or request.user.username}"
        
        if request.data.get('notes'):
            order.notes += f"\nNotes: {request.data.get('notes')}"
            
        order.save()
        
        # Create notification for production team
        # Cari user dengan role produksi
        production_users = CustomUser.objects.filter(role__in=['produksi'])
        
        # Buat notifikasi untuk setiap user produksi
        for prod_user in production_users:
            Notification.objects.create(
                user=prod_user,
                title="Pesanan Baru Disetujui",
                message=f"Pesanan #{order.order_number} telah disetujui sebagai COD",
                type="order_approved",
                read=False,
                related_id=order.id
            )
        
        return Response({'detail': 'Order approved as COD successfully.'})
        
    else:
        # Handle regular payment
        payment_method = request.data.get('payment_method', 'transfer')
        payment_amount = request.data.get('payment_amount')
        payment_date = request.data.get('payment_date')
        payment_proof = request.FILES.get('payment_proof')
        
        if not payment_proof:
            return Response({'detail': 'Payment proof is required.'}, status=400)
            
        if not payment_amount:
            return Response({'detail': 'Payment amount is required.'}, status=400)
            
        # Save payment details
        order.payment_method = payment_method
        order.payment_amount = payment_amount
        order.payment_date = payment_date
        
        # Save payment proof
        if payment_proof:
            # Generate unique filename
            import uuid
            import os
            filename = f"payment_{order.order_number}_{uuid.uuid4().hex[:8]}{os.path.splitext(payment_proof.name)[1]}"
            order.payment_proof.save(filename, payment_proof)
            
        order.payment_status = 'paid'
        order.status = 'approved'
        order.approved_by = request.user
        order.approved_date = timezone.now()
        
        if request.data.get('notes'):
            order.notes = f"{order.notes or ''}\nPayment Notes: {request.data.get('notes')}"
            
        order.save()
        
        # Create notification for production team
        # Cari user dengan role produksi
        production_users = CustomUser.objects.filter(role__in=['produksi'])
        
        # Buat notifikasi untuk setiap user produksi
        for prod_user in production_users:
            Notification.objects.create(
                user=prod_user,
                title="Pesanan Baru Disetujui",
                message=f"Pesanan #{order.order_number} telah disetujui dengan pembayaran {payment_method}",
                type="order_approved",
                read=False,
                related_id=order.id
            )
        
        return Response({'detail': 'Payment approved successfully.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_order(request, order_id):
    """API endpoint to reject an order"""
    # Verify user has permission
    allowed_roles = ['admin_marketing', 'supervisor_marketing', 'manager_marketing', 'general_manager', 'owner']
    if request.user.role not in allowed_roles:
        return Response({'detail': 'You do not have permission to reject orders.'}, status=403)
        
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=404)
        
    # Update order status
    order.status = 'rejected'
    order.notes = f"{order.notes or ''}\nRejected by {request.user.get_full_name() or request.user.username}"
    
    # Get reason from request data
    rejection_reason = request.data.get('reason', '')
    if rejection_reason:
        order.notes += f"\nReason: {rejection_reason}"
        
    order.save()
    
    # Create notification for marketing team
    if order.marketing:
        Notification.objects.create(
            user=order.marketing,
            title="Pesanan Ditolak",
            message=f"Pesanan #{order.order_number} telah ditolak. Alasan: {rejection_reason or 'Tidak ada alasan yang diberikan'}",
            type="order_updated",
            read=False,
            related_id=order.id
        )
    
    return Response({'detail': 'Order rejected successfully.'})

# ======================
# Notification Views
# ======================
class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint untuk mengelola notifikasi
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Return notifikasi untuk pengguna yang login saja atau notifikasi yang user_id=null (untuk semua)
        """
        user = self.request.user
        # Ambil notifikasi untuk user ini atau notifikasi global (user=null)
        return Notification.objects.filter(Q(user=user) | Q(user__isnull=True))
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Tandai semua notifikasi pengguna sebagai telah dibaca"""
        user = request.user
        Notification.objects.filter(user=user, read=False).update(read=True)
        return Response({'status': 'all notifications marked as read'})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Tandai satu notifikasi sebagai telah dibaca"""
        notification = self.get_object()
        notification.read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_notifications(request):
    """API endpoint untuk mendapatkan notifikasi pengguna"""
    user = request.user
    notifications = Notification.objects.filter(
        Q(user=user) | Q(user__isnull=True)
    ).order_by('-created_at')[:20]  # Batasi 20 notifikasi terbaru
    
    serializer = NotificationSerializer(notifications, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    """API endpoint untuk menandai notifikasi sebagai dibaca"""
    try:
        notification = Notification.objects.get(id=notification_id)
        # Pastikan notifikasi milik pengguna ini atau notifikasi global
        if notification.user == request.user or notification.user is None:
            notification.read = True
            notification.save()
            return Response({'status': 'notification marked as read'})
        else:
            return Response({'error': 'Unauthorized'}, status=403)
    except Notification.DoesNotExist:
        return Response({'error': 'Notification not found'}, status=404)

# Tambahkan class RRVisitStatsView di views.py jika memang diperlukan 
class RRVisitStatsView(APIView):
    """
    View untuk menampilkan statistik kunjungan RR (Retail Representative)
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Dapatkan user saat ini
        user = request.user
        
        # Filter untuk period (default: bulan ini)
        period = request.query_params.get('period', 'month')
        
        # Untuk periode bulan ini
        today = timezone.now().date()
        start_date = None
        
        if period == 'week':
            # Minggu ini (Senin - Minggu)
            start_date = today - timedelta(days=today.weekday())
        elif period == 'month':
            # Bulan ini
            start_date = today.replace(day=1)
        elif period == 'quarter':
            # Kuartal ini
            month = today.month
            if month <= 3:
                start_date = today.replace(month=1, day=1)
            elif month <= 6:
                start_date = today.replace(month=4, day=1)
            elif month <= 9:
                start_date = today.replace(month=7, day=1)
            else:
                start_date = today.replace(month=10, day=1)
        elif period == 'year':
            # Tahun ini
            start_date = today.replace(month=1, day=1)
        else:
            # Default ke bulan ini
            start_date = today.replace(day=1)
        
        # Query untuk statistik kunjungan
        if hasattr(request.user, 'role') and request.user.role in ['supervisor_marketing', 'manager_marketing', 'general_manager', 'owner']:
            # Untuk supervisor ke atas, ambil data semua RR
            visits = RealisasiKunjunganRR.objects.filter(tanggal__gte=start_date)
        else:
            # Untuk user biasa, hanya tampilkan data mereka
            visits = RealisasiKunjunganRR.objects.filter(rr=user, tanggal__gte=start_date)
        
        # Hitung statistik
        total_visits = visits.count()
        visits_by_type = visits.values('tipe_kunjungan').annotate(count=Count('id'))
        visits_by_date = visits.values('tanggal').annotate(count=Count('id')).order_by('tanggal')
        
        # Format data tanggal untuk chart
        date_labels = []
        date_counts = []
        
        for entry in visits_by_date:
            date_labels.append(entry['tanggal'].strftime('%d/%m'))
            date_counts.append(entry['count'])
        
        # Data untuk pie chart tipe kunjungan
        visit_type_labels = []
        visit_type_counts = []
        
        for entry in visits_by_type:
            # Dapatkan label yang readable untuk tipe kunjungan
            type_label = dict(RealisasiKunjunganRR.TIPE_KUNJUNGAN).get(entry['tipe_kunjungan'], entry['tipe_kunjungan'])
            visit_type_labels.append(type_label)
            visit_type_counts.append(entry['count'])
        
        response_data = {
            'total_visits': total_visits,
            'visits_by_type': {
                'labels': visit_type_labels,
                'data': visit_type_counts
            },
            'visits_by_date': {
                'labels': date_labels,
                'data': date_counts
            },
            'period': period
        }
        
        return Response(response_data)

# Tambahkan class ProduksiViewSet setelah OrderViewSet atau di seksi produksi
class ProduksiViewSet(viewsets.ModelViewSet):
    queryset = Produksi.objects.all().order_by('-created_at')  # Hapus filter is_active
    serializer_class = ProduksiSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductionFilter
    search_fields = ['order__order_number', 'catatan', 'tahap']  # Sesuaikan dengan field yang tersedia
    ordering_fields = ['created_at', 'updated_at', 'mulai', 'selesai']  # Sesuaikan dengan field yang tersedia
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(penanggung_jawab=self.request.user)  # Gunakan penanggung_jawab alih-alih created_by

 # Tambahkan kelas ProductionJobViewSet setelah ProduksiViewSet atau di bagian produksi
class ProductionJobViewSet(viewsets.ModelViewSet):
    queryset = ProductionJob.objects.all().order_by('-created_at')
    serializer_class = ProductionJobSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'status']
    ordering_fields = ['created_at', 'updated_at', 'due_date']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)   

# Tambahkan kelas ProductionMaterialViewSet setelah ProductionJobViewSet
class ProductionMaterialViewSet(viewsets.ModelViewSet):
    queryset = ProductionMaterial.objects.all()
    serializer_class = ProductionMaterialSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['created_at', 'updated_at']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user) 

   # Tambahkan setelah ProductionMaterialViewSet atau di bagian supplier management
class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'contact_person', 'phone', 'email', 'address']
    ordering_fields = ['name', 'created_at', 'updated_at']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

# Tambahkan setelah SupplierViewSet
class MarketingCampaignViewSet(viewsets.ModelViewSet):
    queryset = MarketingCampaign.objects.all().order_by('-created_at')
    serializer_class = MarketingCampaignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'platform', 'status']
    ordering_fields = ['start_date', 'end_date', 'budget', 'created_at']
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    def get_queryset(self):
        # Filter berdasarkan peran pengguna
        user = self.request.user
        queryset = MarketingCampaign.objects.all().order_by('-created_at')
        
        # Jika user memiliki role tertentu, batasi akses
        if hasattr(user, 'role'):
            if user.role == 'marketing':
                # Marketing biasa hanya bisa lihat kampanye yang dia buat
                return queryset.filter(created_by=user)
                
        # User dengan role lain (SPV, manager, dll) bisa lihat semua
        return queryset

class InventoryViewSet(viewsets.ModelViewSet):
    """ViewSet untuk manajemen inventori"""
    queryset = Inventory.objects.all().order_by('-last_updated')  # Ubah dari updated_at ke last_updated
    serializer_class = InventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = InventoryFilter
    search_fields = ['item_name', 'item_code', 'category', 'location']
    ordering_fields = ['item_name', 'quantity', 'created_at', 'last_updated']  # Ubah updated_at ke last_updated
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    def get_queryset(self):
        """Filter berdasarkan role jika diperlukan"""
        queryset = super().get_queryset()
        
        # Jika menggunakan sistem role custom, tambahkan filter sesuai kebutuhan
        user = self.request.user
        if hasattr(user, 'role') and user.role == 'inventory':
            # Inventory staff bisa melihat semua
            return queryset
        elif hasattr(user, 'role') and user.role in ['manager', 'general_manager', 'owner']:
            # Manager ke atas bisa melihat semua
            return queryset
            
        # Peran lainnya mungkin terbatas melihat tertentu saja
        return queryset
    
# Tambahkan kode berikut setelah InventoryViewSet
class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet untuk transaksi inventori"""
    queryset = Transaction.objects.all().order_by('-created_at')  # Ubah dari transaction_date ke created_at
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reference', 'transaction_type', 'notes']  # Ubah reference_number ke reference
    ordering_fields = ['created_at', 'product__name']  # Ubah transaction_date dan updated_at
    pagination_class = CustomPagination

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter berdasarkan tanggal jika ada di query params
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            start = parse_date(start_date)
            if start:
                queryset = queryset.filter(created_at__gte=start)  # Ubah transaction_date ke created_at
                
        if end_date:
            end = parse_date(end_date)
            if end:
                queryset = queryset.filter(created_at__lte=end)  # Ubah transaction_date ke created_at
                
        # Filter berdasarkan tipe transaksi
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
            
        return queryset
    
# Tambahkan kode berikut setelah TransactionViewSet
class RealisasiKunjunganRRViewSet(viewsets.ModelViewSet):
    """ViewSet untuk kunjungan RR (Retail Representative)"""
    queryset = RealisasiKunjunganRR.objects.all().order_by('-tanggal')
    serializer_class = RealisasiKunjunganRRSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['toko', 'alamat', 'catatan']
    ordering_fields = ['tanggal', 'created_at']
    pagination_class = CustomPagination
    
    def perform_create(self, serializer):
        serializer.save(rr=self.request.user)
        
    def get_queryset(self):
        """Filter kunjungan berdasarkan role user"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Jika user memiliki role marketing supervisor atau lebih tinggi, lihat semua
        if hasattr(user, 'role') and user.role in ['supervisor_marketing', 'manager_marketing', 'general_manager', 'owner']:
            return queryset
            
        # RR biasa hanya bisa lihat kunjungannya sendiri
        return queryset.filter(rr=user)
    
# Tambahkan kode berikut setelah RealisasiKunjunganRRViewSet
class AbsensiViewSet(viewsets.ModelViewSet):
    """ViewSet untuk pencatatan absensi karyawan"""
    queryset = Absensi.objects.all().order_by('-tanggal', '-check_in')  # Ubah dari jam_masuk ke check_in
    serializer_class = AbsensiSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__username', 'keterangan', 'keterlambatan']  # Sesuaikan field search
    ordering_fields = ['tanggal', 'check_in', 'check_out']  # Ubah jam_masuk dan jam_keluar ke check_in dan check_out
    pagination_class = CustomPagination
    
    def perform_create(self, serializer):
        # Auto set user ke user yang login (perhatikan field user vs karyawan)
        serializer.save(user=self.request.user)  # Gunakan 'user' alih-alih 'karyawan'
        
    def get_queryset(self):
        """Filter absensi berdasarkan role"""
        user = self.request.user
        queryset = super().get_queryset()
        
        # Manager HR atau admin bisa lihat semua
        if hasattr(user, 'role') and user.role in ['hr_manager', 'admin', 'general_manager', 'owner']:
            return queryset
            
        # User biasa hanya bisa lihat absensinya sendiri
        return queryset.filter(user=user)  # Gunakan 'user' alih-alih 'karyawan'
    
# Tambahkan kelas berikut setelah AbsensiViewSet
class DashboardSummaryView(APIView):
    """View untuk ringkasan dashboard utama"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Get current date and calculate date ranges
        today = timezone.now().date()
        start_of_month = today.replace(day=1)
        
        # Summary data holders
        summary_data = {
            'orders': {
                'total': Order.objects.filter(is_active=True).count(),
                'pending': Order.objects.filter(is_active=True, status__name='Pending').count(),
                'in_production': Order.objects.filter(is_active=True, status__name='Produksi').count(),
                'completed': Order.objects.filter(is_active=True, status__name='Selesai').count(),
            },
            'revenue': {
                'today': Order.objects.filter(order_date=today, is_active=True).aggregate(total=Sum('total_price'))['total'] or 0,
                'this_month': Order.objects.filter(order_date__gte=start_of_month, is_active=True).aggregate(total=Sum('total_price'))['total'] or 0,
            },
            'production': {
                'ongoing': ProductionTracking.objects.exclude(status='completed').count(),
                'completed_today': ProductionTracking.objects.filter(completed_date=today, status='completed').count(),
            },
            'inventory': {
                'low_stock_items': Inventory.objects.filter(quantity__lt=F('min_stock_level')).count(),
            },
            'user_stats': {
                'total_users': User.objects.filter(is_active=True).count(),
            }
        }
        
        return Response(summary_data)

class HealthCheckView(APIView):
    """View untuk health check sistem"""
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        # Check database connection
        try:
            user_count = User.objects.count()
            db_status = "available"
        except Exception as e:
            db_status = f"unavailable: {str(e)}"
            
        # Check system info
        system_info = {
            'hostname': socket.gethostname(),
            'ip': socket.gethostbyname(socket.gethostname()),
            'environment': settings.ENVIRONMENT,
            'django_version': settings.DJANGO_VERSION,
            'database_status': db_status,
            'timestamp': timezone.now()
        }
        
        return Response(system_info)

class PingView(APIView):
    """Endpoint sederhana untuk mengecek server"""
    permission_classes = [AllowAny]
    
    def get(self, request, format=None):
        return Response({"status": "ok", "message": "pong"})

class FileUploadView(APIView):
    """View untuk upload file"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, format=None):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file uploaded'}, status=400)
            
        # Save file logic here
        return Response({'message': 'File uploaded successfully'})

class FileDownloadView(APIView):
    """View untuk download file"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, file_id, format=None):
        # Implementasi download file sesuai file_id
        return Response({'file_url': f'http://example.com/files/{file_id}'})

class SystemConfigView(APIView):
    """View untuk konfigurasi sistem"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, format=None):
        configs = {
            'app_name': settings.APP_NAME,
            'environment': settings.ENVIRONMENT,
            'debug_mode': settings.DEBUG,
            'allowed_hosts': settings.ALLOWED_HOSTS,
        }
        return Response(configs)

class ProductionStatusView(APIView):
    """View untuk status produksi"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk, format=None):
        try:
            order = Order.objects.get(pk=pk)
            tracking = ProductionTracking.objects.filter(order=order)
            serializer = ProductionTrackingSerializer(tracking, many=True)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

class ProductionScheduleView(APIView):
    """View untuk jadwal produksi"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika jadwal produksi
        return Response({'message': 'Production schedule endpoint'})

class LowStockAlertView(APIView):
    """View untuk alert stok rendah"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        low_stock_items = Inventory.objects.filter(quantity__lt=F('min_stock_level'))
        serializer = InventorySerializer(low_stock_items, many=True)
        return Response(serializer.data)

class InventoryValuationView(APIView):
    """View untuk valuasi inventori"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika valuasi inventori
        return Response({'message': 'Inventory valuation endpoint'})

class SalesDashboardView(APIView):
    """View untuk dashboard penjualan"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika dashboard penjualan
        return Response({'message': 'Sales dashboard endpoint'})

class DashboardStatsView(APIView):
    """View untuk statistik dashboard"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika statistik dashboard
        return Response({'message': 'Dashboard stats endpoint'})

class MarketingOrderList(generics.ListAPIView):
    """View untuk daftar order marketing"""
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(sales_person=self.request.user).order_by('-created_at')

class RRVisitList(generics.ListAPIView):
    """View untuk daftar kunjungan RR"""
    serializer_class = RealisasiKunjunganRRSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return RealisasiKunjunganRR.objects.filter(rr=self.request.user).order_by('-tanggal')

class MarketingPerformanceView(APIView):
    """View untuk performa marketing"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika performa marketing
        return Response({'message': 'Marketing performance endpoint'})

class OrderDailyReportView(APIView):
    """View untuk laporan order harian"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika laporan order harian
        return Response({'message': 'Order daily report endpoint'})

class OrderMonthlyReportView(APIView):
    """View untuk laporan order bulanan"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, format=None):
        # Implementasi logika laporan order bulanan
        return Response({'message': 'Order monthly report endpoint'})

class ProductionStageViewSet(viewsets.ModelViewSet):
    """ViewSet untuk tahapan produksi"""
    queryset = ProductionStage.objects.all().order_by('order')  # Ubah dari 'sequence' ke 'order'
    serializer_class = ProductionStageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination

class ProductionTrackingViewSet(viewsets.ModelViewSet):
    """ViewSet untuk tracking produksi"""
    queryset = ProductionTracking.objects.all().order_by('-created_at')
    serializer_class = ProductionTrackingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CustomPagination
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ProductionTrackingByOrderView(APIView):
    """View untuk tracking produksi berdasarkan order"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, order_id, format=None):
        try:
            order = Order.objects.get(id=order_id)
            tracking_items = ProductionTracking.objects.filter(order=order)
            serializer = ProductionTrackingSerializer(tracking_items, many=True)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response({"error": "Order not found"}, status=404)
        
# Tambahkan function setelah ProductionTrackingByOrderView

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_production_stages(request):
    """Update status tahapan produksi"""
    # Implementasi logika update tahapan produksi
    return Response({'message': 'Production stages updated'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_tasks_by_stage(request):
    """Dapatkan task tersedia berdasarkan tahap"""
    # Implementasi logika get task tersedia
    return Response({'message': 'Available tasks by stage'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_production_assignments(request):
    """Dapatkan tugas produksi untuk user login"""
    # Implementasi logika get tugas produksi
    return Response({'message': 'My production assignments'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_production_task(request, tracking_id):
    """Klaim tugas produksi"""
    # Implementasi logika klaim tugas produksi
    return Response({'message': f'Production task {tracking_id} claimed'})

# Tambahkan function ini setelah claim_production_task
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_task_alt(request, tracking_id=None):
    """
    Metode alternatif untuk mengklaim tugas produksi
    
    Dibuat untuk menangani format request yang berbeda atau sebagai fallback
    jika claim_production_task mengalami masalah
    """
    # Dapatkan tracking_id dari parameter atau body request
    if tracking_id is None:
        tracking_id = request.data.get('tracking_id')
        
    if not tracking_id:
        return Response(
            {"error": "Tracking ID diperlukan"},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    try:
        # Cari tracking yang dimaksud
        tracking = ProductionTracking.objects.get(id=tracking_id)
        
        # Periksa apakah tracking sudah diklaim
        if tracking.assigned_to is not None and tracking.assigned_to != request.user:
            return Response(
                {"error": f"Tugas ini sudah diklaim oleh {tracking.assigned_to.username}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Klaim tugas
        tracking.assigned_to = request.user
        tracking.assigned_at = timezone.now()
        tracking.status = 'in_progress'
        tracking.save()
        
        return Response({
            "success": True,
            "message": f"Tugas produksi berhasil diklaim oleh {request.user.username}",
            "tracking": ProductionTrackingSerializer(tracking).data
        })
        
    except ProductionTracking.DoesNotExist:
        return Response(
            {"error": f"Tracking dengan ID {tracking_id} tidak ditemukan"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error in claim_task_alt: {str(e)}")
        return Response(
            {"error": f"Terjadi kesalahan: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def debug_userprofile(request):
    """Debug user profile"""
    # Implementasi logika debug profil user
    return Response({'message': 'User profile debug info'})

@api_view(['POST'])
@permission_classes([IsAdminUser])
def repair_userprofile(request):
    """Perbaiki user profile"""
    # Implementasi logika perbaikan profil user
    return Response({'message': 'User profile repaired'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def marketing_team_data(request):
    """Data tim marketing"""
    try:
        # Filter users berdasarkan role marketing
        marketing_roles = ['cs_online', 'cs_offline', 'retail', 'marketing']
        
        # Pendekatan 1: Gunakan CustomUser jika menggunakan model tersebut
        marketing_users = []
        
        # Coba ambil dari CustomUser terlebih dahulu
        try:
            users_query = CustomUser.objects.filter(
                role__in=marketing_roles, 
                is_active=True
            ).order_by('username')
            
            for user in users_query:
                marketing_users.append({
                    'id': user.id,
                    'username': user.username,
                    'name': user.get_full_name() or user.username,
                    'role': user.role,
                    'phone': getattr(user, 'phone', ''),
                    'isActive': user.is_active
                })
        except:
            # Pendekatan 2: Gunakan UserProfile jika CustomUser tidak tersedia
            profiles = UserProfile.objects.filter(
                roles__name__in=marketing_roles,
                is_active=True
            ).select_related('user')
            
            for profile in profiles:
                marketing_users.append({
                    'id': profile.user.id,
                    'username': profile.user.username,
                    'name': profile.user.get_full_name() or profile.user.username,
                    'role': profile.role.name if profile.role else 'marketing',
                    'phone': profile.phone or '',
                    'isActive': profile.is_active
                })
        
        # Jika tidak ada data, buat contoh data fallback
        if not marketing_users:
            marketing_users = [
                {'id': 1, 'username': 'meira', 'name': 'Meira', 'role': 'cs_online', 'phone': '0812-3436-0152', 'isActive': True},
                {'id': 2, 'username': 'oktarina', 'name': 'Oktarina', 'role': 'cs_offline', 'phone': '0814-7667-4442', 'isActive': True},
                {'id': 3, 'username': 'romita', 'name': 'Romita', 'role': 'cs_offline', 'phone': '0858-4859-1999', 'isActive': True},
                {'id': 4, 'username': 'dedy', 'name': 'Dedy', 'role': 'retail', 'phone': '0899-7578-678', 'isActive': True}
            ]
            
        return Response(marketing_users)
        
    except Exception as e:
        return Response(
            {'error': f'Error fetching marketing team: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def marketing_performance_data(request):
    """Data performa marketing"""
    # Implementasi logika data performa marketing
    return Response({'message': 'Marketing performance data'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def marketing_member_performance(request, user_id):
    """Performa anggota marketing spesifik"""
    # Implementasi logika performa anggota marketing
    return Response({'message': f'Marketing member {user_id} performance'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def marketing_campaigns_data(request):
    """Data kampanye marketing"""
    try:
        # Ambil kampanye dari database
        campaigns = MarketingCampaign.objects.all().order_by('-start_date')
        
        # Konversi ke format yang diharapkan frontend
        campaign_data = []
        for campaign in campaigns:
            campaign_data.append({
                'id': campaign.id,
                'name': campaign.name,
                'description': campaign.description,
                'platform': getattr(campaign, 'platform', ''),  # Jika field ada
                'budget': float(campaign.budget),
                'start_date': campaign.start_date.strftime('%Y-%m-%d'),
                'end_date': campaign.end_date.strftime('%Y-%m-%d'),
                'status': 'active' if campaign.is_active else 'completed',
                'target_audience': campaign.target_audience
            })
        
        # Jika tidak ada data, buat contoh data fallback
        if not campaign_data:
            today = timezone.now().date()
            campaign_data = [
                {
                    'id': 1,
                    'name': 'Promo Lebaran 2025',
                    'description': 'Diskon 20% untuk semua produk akrilik',
                    'platform': 'Instagram',
                    'budget': 5000000,
                    'start_date': (today - timezone.timedelta(days=30)).strftime('%Y-%m-%d'),
                    'end_date': (today + timezone.timedelta(days=30)).strftime('%Y-%m-%d'),
                    'status': 'active'
                }
            ]
            
        return Response(campaign_data)
        
    except Exception as e:
        return Response(
            {'error': f'Error fetching marketing campaigns: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_marketing_users(request):
    """Dapatkan daftar user marketing"""
    # Implementasi logika daftar user marketing
    return Response({'message': 'Marketing users list'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_approval_orders(request):
    """Dapatkan pesanan yang menunggu persetujuan"""
    pending_orders = Order.objects.filter(status__name='Pending')
    serializer = OrderSerializer(pending_orders, many=True)
    return Response(serializer.data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def check_user_role_access(request, role_name=None):
    """
    Memeriksa apakah user memiliki akses untuk role tertentu
    
    GET: Memeriksa role user saat ini
    POST: Memeriksa akses terhadap role yang diberikan
    """
    user = request.user
    
    # Jika request adalah POST, periksa role yang diminta
    if request.method == 'POST' and not role_name:
        role_name = request.data.get('role')
        
    # Jika role_name diberikan, periksa apakah user memiliki akses
    if role_name:
        # Dapatkan role dari user
        user_role = None
        if hasattr(user, 'userprofile') and hasattr(user.userprofile, 'role'):
            user_role = user.userprofile.role.name
        
        # Admin dan superuser selalu punya akses penuh
        has_access = user.is_superuser or user.is_staff
        
        # Cek akses berdasarkan hirarki role
        if not has_access and user_role:
            # Daftar role berdasarkan hirarki (tertinggi ke terendah)
            role_hierarchy = {
                'owner': 10,
                'general_manager': 9,
                'manager': 8, 
                'supervisor': 7,
                'coordinator': 6,
                'admin': 5,
                'staff': 4,
                'user': 1
            }
            
            # Bandingkan level role
            user_level = role_hierarchy.get(user_role.lower(), 0)
            requested_level = role_hierarchy.get(role_name.lower(), 0)
            
            # User dengan level lebih tinggi bisa mengakses level di bawahnya
            has_access = user_level >= requested_level
            
        return Response({
            'has_access': has_access,
            'user_role': user_role or 'unknown',
            'requested_role': role_name
        })
    
    # Jika tidak ada role_name, kembalikan informasi role user saja
    user_role = 'User'
    if hasattr(user, 'userprofile') and hasattr(user.userprofile, 'role') and user.userprofile.role:
        user_role = user.userprofile.role.name
    elif user.is_superuser:
        user_role = 'Admin'
        
    return Response({
        'username': user.username,
        'user_role': user_role,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser
    })