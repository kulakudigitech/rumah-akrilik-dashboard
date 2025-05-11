import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Fungsi untuk memastikan role dalam format yang konsisten
const normalizeRole = (role) => {
  if (typeof role === 'string') {
    return role.toLowerCase();
  } else if (role && typeof role === 'object' && role.name) {
    return role.name.toLowerCase();
  } 
  return ''; // Return empty string for invalid roles
};

// Fungsi untuk mendapatkan role dari localStorage dengan format yang konsisten
const getNormalizedUserRoles = () => {
  try {
    const userRolesString = localStorage.getItem('userRoles');
    if (!userRolesString) return [];
    
    const userRoles = JSON.parse(userRolesString);
    if (!Array.isArray(userRoles)) return [];
    
    return userRoles.map(role => normalizeRole(role)).filter(role => role); // Filter empty roles
  } catch (error) {
    console.error('Error parsing user roles:', error);
    return []; // Return empty array on error
  }
};

// Fungsi untuk menentukan dashboard berdasarkan role
const determineUserDashboard = (userRoles = []) => {
  // Normalize roles first
  const normalizedRoles = Array.isArray(userRoles) 
    ? userRoles.map(role => normalizeRole(role)).filter(role => role)
    : [];
  
  // Cek peran spesifik departemen untuk menentukan dashboard
  if (normalizedRoles.some(role => role.includes('gudang'))) {
    return '/dashboard/gudang';
  }
  
  if (normalizedRoles.some(role => role.includes('hrd'))) {
    return '/dashboard/hrd';
  }
  
  if (normalizedRoles.some(role => role.includes('marketing'))) {
    return '/dashboard/marketing';
  }
  
  if (normalizedRoles.some(role => role.includes('keuangan'))) {
    return '/dashboard/keuangan';
  }
  
  if (normalizedRoles.some(role => role.includes('rnd') || role.includes('research'))) {
    return '/dashboard/rnd';
  }
  
  // Cek role produksi
  if (normalizedRoles.some(role => 
    ['designer', 'operator mesin', 'finishing', 'quality control', 'packing', 
     'staff finishing', 'staff packing', 'produksi'].some(prodRole => role.includes(prodRole))
  )) {
    return '/produksi/dashboard';
  }
  
  // Default untuk admin/owner
  if (normalizedRoles.includes('admin') || normalizedRoles.includes('owner')) {
    return '/dashboard';
  }
  
  // Fallback ke dashboard umum
  return '/dashboard';
};

const RoleBasedRoute = ({ element, allowedRoles }) => {
  const location = useLocation();
  
  // Ambil dan normalize role dari localStorage
  const normalizedUserRoles = getNormalizedUserRoles();
  
  // Lowercase allowedRoles for consistency
  const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
  
  // Cek apakah user memiliki role yang diizinkan
  const hasPermission = normalizedUserRoles.some(role => 
    normalizedAllowedRoles.includes(role)
  );
  
  // Tentukan ke mana user diarahkan jika tidak punya akses
  const redirectTo = determineUserDashboard(normalizedUserRoles);
  
  if (!hasPermission) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  return element;
};

export default RoleBasedRoute;