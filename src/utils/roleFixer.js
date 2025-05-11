import axios from 'axios';

// Tambahkan konstanta untuk API_URL
const API_URL = 'https://rumahakrilik.id/api';

/**
 * Script untuk memperbaiki role user nanang
 */
export const fixNanangRole = async () => {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) return {success: false, message: 'Authentication required'};
    
    const response = await axios.patch(`${API_URL}/users/nanang/`, {
      roles: ['finishing', 'operator mesin', 'packing', 'quality control'],
      role: 'finishing'  // Set role utama
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {success: true, message: 'Role user nanang berhasil diperbarui'};
  } catch (error) {
    console.error('Error fixing user role:', error);
    return {success: false, message: 'Gagal memperbarui role user'};
  }
};

/**
 * Function lebih generik untuk mengatur role user berdasarkan username
 */
export const fixUserRole = async (username, mainRole, roles) => {
  try {
    const token = localStorage.getItem('jwtToken');
    if (!token) return {success: false, message: 'Authentication required'};
    
    // Set di localStorage untuk immediate effect pada UI
    localStorage.setItem('role', mainRole);
    localStorage.setItem('userRoles', JSON.stringify(roles));
    
    // Update di server
    const response = await axios.patch(`${API_URL}/users/${username}/`, {
      roles: roles,
      role: mainRole
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return {success: true, message: `Role user ${username} berhasil diperbarui`};
  } catch (error) {
    console.error(`Error fixing role for ${username}:`, error);
    return {success: false, message: `Gagal memperbarui role user ${username}`};
  }
};