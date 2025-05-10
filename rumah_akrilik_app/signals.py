from django.db.models.signals import post_save
from django.dispatch import receiver
import logging
from .models import Order, OrderStatus, ProductionStage, ProductionTracking

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Order)
def create_production_tracking(sender, instance, created, **kwargs):
    """
    Signal handler to create initial production tracking when order status changes to 'Produksi'
    """
    # Now we know the Produksi status ID is 7
    if instance.status_id == 7:
        # Check if tracking already exists for this order
        existing_tracking = ProductionTracking.objects.filter(order=instance).exists()
        
        if not existing_tracking:
            try:
                logger.info(f"Creating production tracking for order {instance.id}")
                # Get first active stage ordered by 'order' field
                first_stage = ProductionStage.objects.filter(is_active=True).order_by('order').first()
                
                if first_stage:
                    tracking = ProductionTracking.objects.create(
                        order=instance,
                        stage=first_stage,
                        status='pending',
                        notes=f"Auto-created when order status changed to Produksi"
                    )
                    logger.info(f"Created production tracking: {tracking.id}")
                else:
                    logger.error("No active production stages found")
            except Exception as e:
                logger.error(f"Error creating production tracking: {e}")