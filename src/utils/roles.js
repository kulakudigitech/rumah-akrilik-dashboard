// Definisikan konstanta untuk role dan departemen

// Roles by department
export const ROLES = {
  MARKETING: [
    'cs marketing offline',
    'cs marketing online', 
    'retail representative',
    'koordinator marketing',
    'supervisor marketing',
    'manager marketing'
  ],
  
  PRODUKSI: [
    'designer',
    'operator mesin',
    'finishing',
    'quality control',
    'packing',
    'supervisor produksi',
    'manager produksi'
  ],
  
  KEUANGAN: [
    'admin keuangan',
    'supervisor keuangan',
    'manager keuangan'
  ],
  
  GUDANG: [
    'admin gudang'
  ],
  
  RND: [
    'r&d'
  ],
  
  HRD: [
    'hrd',
    'manager hrd'
  ],
  
  EXECUTIVE: [
    'owner',
    'general manager'
  ]
};

// Status karyawan
export const EMPLOYEE_STATUS = [
  'magang',
  'pkl',
  'staff',
  'freelancer'
];

// Helper functions for role checking
export const normalizeRole = (role) => {
  if (typeof role === 'string') {
    return role.toLowerCase();
  }
  if (role && typeof role === 'object' && role.name) {
    return role.name.toLowerCase();
  }
  return '';
};

export const hasRole = (userRoles, requiredRoles) => {
  if (!Array.isArray(userRoles) || !Array.isArray(requiredRoles)) {
    return false;
  }
  
  // Check for executive roles first - they have access to everything
  if (userRoles.some(role => 
    ROLES.EXECUTIVE.some(execRole => 
      normalizeRole(role).includes(normalizeRole(execRole))
    )
  )) {
    return true;
  }
  
  // Check for specific roles
  return userRoles.some(userRole => 
    requiredRoles.some(reqRole => 
      normalizeRole(userRole).includes(normalizeRole(reqRole))
    )
  );
};

export const getDepartmentFromRole = (role) => {
  const normalizedRole = normalizeRole(role);
  
  if (!normalizedRole) return 'General';
  
  // Check which department contains this role
  if (ROLES.MARKETING.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'Marketing';
  }
  if (ROLES.PRODUKSI.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'Produksi';
  }
  if (ROLES.KEUANGAN.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'Keuangan';
  }
  if (ROLES.GUDANG.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'Gudang';
  }
  if (ROLES.RND.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'R&D';
  }
  if (ROLES.HRD.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'HRD';
  }
  if (ROLES.EXECUTIVE.some(r => normalizedRole.includes(normalizeRole(r)))) {
    return 'Executive';
  }
  
  return 'General';
};

export const getUserRoles = () => {
  try {
    const userRolesStr = localStorage.getItem('userRoles');
    if (!userRolesStr) {
      const mainRole = localStorage.getItem('role');
      return mainRole ? [mainRole] : [];
    }
    
    const parsedRoles = JSON.parse(userRolesStr);
    
    if (Array.isArray(parsedRoles)) {
      return parsedRoles.map(role => {
        if (typeof role === 'string') {
          return role;
        }
        if (role && typeof role === 'object' && role.name) {
          return role.name;
        }
        return '';
      }).filter(Boolean);
    }
    
    // Handle non-array
    if (typeof parsedRoles === 'string') {
      return [parsedRoles];
    }
    if (parsedRoles && typeof parsedRoles === 'object' && parsedRoles.name) {
      return [parsedRoles.name];
    }
    
    const mainRole = localStorage.getItem('role');
    return mainRole ? [mainRole] : [];
  } catch (e) {
    console.error('Error getting user roles:', e);
    const mainRole = localStorage.getItem('role');
    return mainRole ? [mainRole] : [];
  }
};