from django.db.models import Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

from rumah_akrilik_app.models import ProductionTracking, Order
from rumah_akrilik_app.serializers import ProductionTrackingSerializer

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_available_trackings(request):
    """
    Mendapatkan daftar tracking yang tersedia untuk dikerjakan oleh pengguna
    berdasarkan role mereka.
    """
    try:
        # Dapatkan role pengguna
        user = request.user
        user_roles = []
        
        # Coba ambil dari grup pengguna
        for group in user.groups.all():
            user_roles.append(group.name.lower())
        
        # Jika tidak ada grup, gunakan role dari profile jika ada
        if hasattr(user, 'userprofile') and hasattr(user.userprofile, 'roles'):
            for role in user.userprofile.roles.all():
                user_roles.append(role.name.lower())
        
        # Default fallback ke username untuk kasus khusus 'nanang'
        if user.username == 'nanang':
            user_roles = ['finishing', 'operator mesin', 'packing', 'quality control']
        
        logger.info(f"User {user.username} has roles: {user_roles}")
        
        # Mendapatkan tracking yang tersedia berdasarkan role
        # Status 'pending' dan tidak ada assigned_to
        tracking_query = Q(status='pending') & Q(is_active=True)
        
        # Filter berdasarkan role pengguna
        role_conditions = Q()
        
        # Special case for admin/owner
        if any(role in ['admin', 'owner', 'manager'] for role in user_roles):
            # Admin/owner bisa melihat semua tracking
            pass
        else:
            # Untuk peran produksi lainnya, filter berdasarkan stage_name
            for role in user_roles:
                # Mapping untuk stage names
                if role == 'desain' or role == 'designer':
                    role_conditions |= Q(stage_name__icontains='desain')
                elif role == 'operator mesin' or role == 'operator':
                    role_conditions |= Q(stage_name__icontains='operator mesin')
                elif role == 'finishing':
                    role_conditions |= Q(stage_name__icontains='finishing')
                elif role == 'quality control' or role == 'qc':
                    role_conditions |= Q(stage_name__icontains='quality control')
                elif role == 'packing':
                    role_conditions |= Q(stage_name__icontains='packing')
                elif role == 'siap kirim' or role == 'pengiriman':
                    role_conditions |= Q(stage_name__icontains='kirim') | Q(stage_name__icontains='pasang')
            
            if role_conditions:
                tracking_query &= role_conditions
            else:
                # Jika tidak ada role yang cocok, tampilkan data kosong
                return Response([], status=status.HTTP_200_OK)
        
        # Get active orders with status 'Produksi' or 'Baru'
        active_orders = Order.objects.filter(
            Q(status__name='Produksi') | Q(status__name='Baru'),
            is_active=True
        ).values_list('id', flat=True)
        
        # Final query
        trackings = ProductionTracking.objects.filter(
            tracking_query, order__in=active_orders
        ).select_related('order', 'order__customer')
        
        # Buat data respons yang lengkap
        available_tasks = []
        
        for tracking in trackings:
            # Dapatkan semua tracking untuk order ini untuk progress tracking
            all_trackings_for_order = ProductionTracking.objects.filter(order=tracking.order)
            
            # Siapkan informasi stages
            stages = {
                'desain': False,
                'operator_mesin': False, 
                'finishing': False,
                'quality_control': False,
                'packing': False,
                'siap_kirim': False
            }
            
            # Update status stages berdasarkan tracking yang selesai
            for t in all_trackings_for_order:
                if t.status == 'completed':
                    stage_key = t.stage_name.lower().replace(' ', '_').replace('/', '_')
                    if stage_key in stages:
                        stages[stage_key] = True
            
            # Dapatkan item produk pertama dari order
            product_name = 'Produk'
            specifications = {}
            if tracking.order.items.exists():
                first_item = tracking.order.items.first()
                product_name = first_item.nama_produk or (first_item.product.name if first_item.product else 'Produk')
                specifications = first_item.specifications or {}
            
            # Tentukan prioritas
            priority = 'low'
            if tracking.order.notes and 'urgent' in tracking.order.notes.lower():
                priority = 'high'
            else:
                # Hitung berapa banyak tahap yang sudah selesai
                completed_count = sum(1 for t in all_trackings_for_order if t.status == 'completed')
                total_count = all_trackings_for_order.count()
                
                if completed_count > total_count * 0.7:
                    priority = 'high'
                elif completed_count > total_count * 0.3:
                    priority = 'medium'
            
            # Tambahkan task ke response
            available_tasks.append({
                'id': tracking.id,
                'order_id': tracking.order.id,
                'order_number': tracking.order.order_number,
                'customer_name': tracking.order.customer.name if tracking.order.customer else 'Pelanggan Tidak Diketahui',
                'product_name': product_name,
                'stage_name': tracking.stage_name,
                'deadline': tracking.order.due_date.strftime('%Y-%m-%d') if tracking.order.due_date else '',
                'status': 'available',
                'priority': priority,
                'specifications': specifications,
                'notes': tracking.order.notes or '',
                'stages': stages
            })
        
        logger.info(f"Found {len(available_tasks)} available tasks for user {user.username}")
        
        return Response(available_tasks, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error fetching available tasks: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Terjadi kesalahan saat mengambil tugas tersedia', 'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def claim_task(request, tracking_id):
    """
    Mengklaim tracking untuk dikerjakan oleh pengguna.
    """
    try:
        tracking = ProductionTracking.objects.get(id=tracking_id)
        
        # Periksa apakah tracking sudah diklaim
        if tracking.assigned_to:
            return Response(
                {'error': 'Tugas ini sudah diklaim oleh pengguna lain'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update tracking dengan data dari request
        tracking.status = 'in_progress'
        tracking.assigned_to = request.user.username
        tracking.start_time = request.data.get('start_time') or timezone.now()
        
        # Debug info
        logger.info(f"Assigning task {tracking_id} to user {request.user.username}")
        
        tracking.save()
        
        serializer = ProductionTrackingSerializer(tracking)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except ProductionTracking.DoesNotExist:
        return Response(
            {'error': 'Tracking tidak ditemukan'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error claiming task: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Terjadi kesalahan saat mengklaim tugas', 'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_task_alt(request):
    """
    Endpoint alternatif untuk klaim tugas (digunakan sebagai fallback)
    """
    try:
        tracking_id = request.data.get('tracking_id')
        username = request.data.get('username')
        
        if not tracking_id:
            return Response({'error': 'tracking_id diperlukan'}, status=status.HTTP_400_BAD_REQUEST)
            
        tracking = ProductionTracking.objects.get(id=tracking_id)
        
        # Periksa apakah tracking sudah diklaim
        if tracking.assigned_to:
            return Response(
                {'error': 'Tugas ini sudah diklaim oleh pengguna lain'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update tracking dengan data dari request
        tracking.status = 'in_progress'
        tracking.assigned_to = username or request.user.username
        tracking.start_time = timezone.now()
        tracking.save()
        
        serializer = ProductionTrackingSerializer(tracking)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except ProductionTracking.DoesNotExist:
        return Response(
            {'error': 'Tracking tidak ditemukan'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error claiming task (alt): {str(e)}", exc_info=True)
        return Response(
            {'error': 'Terjadi kesalahan saat mengklaim tugas', 'detail': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_trackings(request):
    """
    Mendapatkan daftar tracking yang dikerjakan oleh pengguna saat ini.
    """
    try:
        # Dapatkan username dari user yang login
        username = request.user.username
        
        # Return empty list untuk username yang tidak valid
        if not username or username == 'undefined' or username == 'null':
            return Response([], status=status.HTTP_200_OK)
        
        # Query yang super sederhana - cari berdasarkan assigned_to saja
        trackings = ProductionTracking.objects.filter(assigned_to=username)
        
        # Return list sederhana
        result = []
        for track in trackings:
            item = {
                'id': track.id,
                'status': track.status or 'in_progress',
                'stage_name': track.stage_name or 'Produksi'
            }
            
            # Tambahkan data order jika ada
            if hasattr(track, 'order') and track.order:
                item['order_id'] = track.order.id
                item['order_number'] = getattr(track.order, 'order_number', f'Order-{track.order.id}')
                
                # Ambil customer jika ada
                if hasattr(track.order, 'customer') and track.order.customer:
                    item['customer_name'] = track.order.customer.name
                else:
                    item['customer_name'] = 'Pelanggan'
                    
                # Ambil notes jika ada
                item['notes'] = getattr(track.order, 'notes', '')
                
                # Ambil item produk jika ada
                if hasattr(track.order, 'items') and track.order.items.exists():
                    first_item = track.order.items.first()
                    item['product_name'] = getattr(first_item, 'nama_produk', 'Produk')
                    item['specifications'] = getattr(first_item, 'specifications', {}) or {}
                else:
                    item['product_name'] = 'Produk'
                    item['specifications'] = {}
            else:
                item['order_id'] = 0
                item['order_number'] = f'Order-{track.id}'
                item['customer_name'] = 'Pelanggan'
                item['product_name'] = 'Produk'
                item['notes'] = ''
                item['specifications'] = {}
            
            # Tambahkan tanggal
            if track.start_time:
                item['claimed_date'] = track.start_time.isoformat()
            if track.end_time:
                item['completed_date'] = track.end_time.isoformat()
                
            result.append(item)
            
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        # Log error
        print(f"Error in get_my_trackings: {str(e)}")
        # Return empty list untuk mencegah error di frontend
        return Response([], status=status.HTTP_200_OK)