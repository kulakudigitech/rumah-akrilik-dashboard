# /root/rumah-akrilik/rumah_akrilik_app/permissions.py
from rest_framework import permissions
from .models import UserProfile # Pastikan UserProfile diimport
import logging

logger = logging.getLogger(__name__)

# Helper function to get user's role name
def get_user_role_name(user):
    """Gets the role name safely."""
    if not user or not user.is_authenticated:
        return None
    try:
        profile = getattr(user, 'profile', None)
        if profile and hasattr(profile, 'role') and profile.role:
            role_name = profile.role.name
            return role_name
        else:
            logger.warning(f"Could not determine role name for user {user}. Profile: {profile}")
            return None
    except UserProfile.DoesNotExist:
        logger.warning(f"UserProfile does not exist for user {user}")
        return None
    except Exception as e:
        logger.error(f"Error getting role name for user {user}: {e}", exc_info=True)
        return None
    return None # Default fallback

# --- Base Role Permission ---
class BaseRolePermission(permissions.BasePermission):
    """Base class to check if user belongs to specific roles."""
    allowed_roles = [] # List of role names allowed

    def has_permission(self, request, view):
        logger.info(f"Checking permission for view {view.__class__.__name__}, user {request.user}, permission class {self.__class__.__name__}")
        if not request.user or not request.user.is_authenticated:
            logger.info("User not authenticated.")
            return False

        role_name = get_user_role_name(request.user)
        logger.info(f"Detected role: {role_name}. Allowed roles for {self.__class__.__name__}: {self.allowed_roles}")

        # !!! BARIS raise Exception SUDAH DIHAPUS !!!

        has_perm = role_name in self.allowed_roles
        logger.info(f"Permission check result for {self.__class__.__name__}: {has_perm}")
        return has_perm # <-- Kembalikan hasil pengecekan

# --- Specific Role Permissions ---
class IsOwner(BaseRolePermission):
    allowed_roles = ['Owner']

class IsGeneralManager(BaseRolePermission):
    allowed_roles = ['General Manager']

class IsManager(BaseRolePermission):
    allowed_roles = [
        'Manager Marketing', 'Manager Produksi', 'Manager Keuangan',
        'General Manager', 'Owner'
    ]

class IsSupervisor(BaseRolePermission):
    allowed_roles = [
        'Supervisor Produksi', 'Supervisor Marketing Offline', 'Supervisor Keuangan',
        'Manager Marketing', 'Manager Produksi', 'Manager Keuangan',
        'General Manager', 'Owner'
    ]

class IsKoordinator(BaseRolePermission):
     allowed_roles = [
        'Koordinator Marketing', 'Koordinator Produksi',
        'Supervisor Produksi', 'Supervisor Marketing Offline', 'Supervisor Keuangan',
        'Manager Marketing', 'Manager Produksi', 'Manager Keuangan',
        'General Manager', 'Owner'
    ]

class IsStaff(BaseRolePermission):
    """ Allows any logged-in staff member (non-customer/reseller roles) """
    excluded_roles = ['Reseller', 'Customer']

    def has_permission(self, request, view):
        logger.info("Checking IsStaff permission.")
        if not request.user or not request.user.is_authenticated:
            logger.info("IsStaff: User not authenticated.")
            return False
        if not request.user.is_staff:
             logger.info("IsStaff: User is_staff=False.")
             return False

        role_name = get_user_role_name(request.user)
        logger.info(f"IsStaff check: Role detected: {role_name}, Excluded roles: {self.excluded_roles}")

        is_allowed = role_name not in self.excluded_roles and role_name is not None

        if not is_allowed:
            logger.info(f"IsStaff check result: False (Role None or excluded)")
            return False
        logger.info(f"IsStaff check result: True")
        return True

# --- Division/Function Specific Permissions ---
class IsAdminKeuangan(BaseRolePermission):
    allowed_roles = [
        'Staff Admin Keuangan', 'Supervisor Keuangan', 'Manager Keuangan',
        'General Manager', 'Owner'
    ]

class IsMarketingUser(BaseRolePermission):
    allowed_roles = [
        'Staff Marketing Online', 'CS Online', 'CS Offline',
        'Retail Representative', 'Koordinator Marketing',
        'Supervisor Marketing Offline', 'Manager Marketing',
        'General Manager', 'Owner'
    ]

class IsRRUser(BaseRolePermission):
    allowed_roles = [
        'Retail Representative',
        'Koordinator Marketing',
        'Supervisor Marketing Offline',
        'Manager Marketing',
        'General Manager', 'Owner'
    ]

class IsProductionUser(BaseRolePermission):
    allowed_roles = [
        'Designer', 'Operator Mesin', 'Finishing', 'Quality Control', 'Packing / Pasang',
        'Koordinator Produksi', 'Supervisor Produksi', 'Manager Produksi',
        'General Manager', 'Owner'
    ]

class IsDesignerUser(BaseRolePermission):
     allowed_roles = ['Designer', 'Koordinator Produksi', 'Supervisor Produksi', 'Manager Produksi', 'General Manager', 'Owner']

class IsOperatorMesinUser(BaseRolePermission):
     allowed_roles = ['Operator Mesin', 'Koordinator Produksi', 'Supervisor Produksi', 'Manager Produksi', 'General Manager', 'Owner']

class IsFinishingUser(BaseRolePermission):
    allowed_roles = ['Finishing', 'Koordinator Produksi', 'Supervisor Produksi', 'Manager Produksi', 'General Manager', 'Owner']

class IsQCUser(BaseRolePermission):
    allowed_roles = ['Quality Control', 'Koordinator Produksi', 'Supervisor Produksi', 'Manager Produksi', 'General Manager', 'Owner']

class IsPackingUser(BaseRolePermission):
    allowed_roles = ['Packing / Pasang', 'Koordinator Produksi', 'Supervisor Produksi', 'Manager Produksi', 'General Manager', 'Owner']

class IsGudangUser(BaseRolePermission):
    allowed_roles = [
        'Staff Gudang',
        'Koordinator Produksi',
        'Supervisor Produksi',
        'Manager Produksi',
        'General Manager', 'Owner'
    ]

class IsInventoryUser(IsGudangUser):
    pass

class IsResellerUser(BaseRolePermission):
     allowed_roles = ['Reseller']
