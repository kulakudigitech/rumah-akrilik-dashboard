/**
 * Utility functions untuk format data pada dashboard dan komponen lainnya
 */

/**
 * Format angka menjadi format mata uang Rupiah
 * @param {number} value - Jumlah yang akan diformat
 * @returns {string} - String dalam format mata uang Rupiah
 */
export const formatCurrency = (value) => {
  // Format to Rupiah
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Format angka dengan pemisah ribuan
 * @param {number} num - Angka yang akan diformat
 * @returns {string} - String dengan pemisah ribuan
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Fungsi untuk memformat tanggal
 * @param {string} dateString - Tanggal yang akan diformat
 * @returns {string} - String tanggal format Indonesia
 */
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

/**
 * Format tanggal dan waktu ke format Indonesia
 * @param {string|Date} dateTime - Tanggal dan waktu yang akan diformat
 * @returns {string} - String tanggal dan waktu format Indonesia
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-';
  
  return new Date(dateTime).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Hitung selisih hari antara dua tanggal
 * @param {string|Date} startDate - Tanggal awal
 * @param {string|Date} endDate - Tanggal akhir (default: tanggal hari ini)
 * @returns {number} - Jumlah hari antara dua tanggal
 */
export const calculateDaysDifference = (startDate, endDate = new Date()) => {
  if (!startDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Hitung selisih dalam milidetik
  const diffTime = Math.abs(end - start);
  // Konversi ke hari
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Memformat angka persentase
 * @param {number} value - Nilai persentase (dalam desimal)
 * @param {number} decimals - Jumlah angka di belakang koma
 * @returns {string} - String persentase dengan tanda %
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Memformat status pesanan menjadi label yang lebih user-friendly
 * @param {string} status - Status pesanan dari database
 * @returns {string} - Label status yang lebih user-friendly
 */
export const formatOrderStatus = (status) => {
  const statusMap = {
    'pending': 'Menunggu',
    'processing': 'Diproses',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
    'on_hold': 'Ditunda',
    'refunded': 'Dikembalikan',
    'paid': 'Dibayar',
    'delivered': 'Dikirim',
    'production': 'Produksi'
  };
  
  return statusMap[status?.toLowerCase()] || status;
};

/**
 * Memotong teks yang terlalu panjang dan menambahkan elipsis
 * @param {string} text - Teks yang akan dipotong
 * @param {number} maxLength - Panjang maksimal teks
 * @returns {string} - Teks yang sudah dipotong dengan elipsis jika diperlukan
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Mendapatkan inisial dari nama
 * @param {string} name - Nama lengkap
 * @returns {string} - Inisial (1-2 karakter)
 */
export const getInitials = (name) => {
  if (!name) return '';
  
  const names = name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
};

/**
 * Fungsi untuk mendapatkan warna badge berdasarkan status
 * @param {string} status - Status
 * @returns {string} - Warna badge
 */
export const getStatusBadgeColor = (status) => {
  if (!status) return 'secondary';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower === 'active' || statusLower === 'aktif') return 'success';
  if (statusLower === 'planned' || statusLower === 'direncanakan') return 'primary';
  if (statusLower === 'completed' || statusLower === 'selesai') return 'info';
  if (statusLower === 'cancelled' || statusLower === 'dibatalkan') return 'danger';
  if (statusLower === 'on-hold' || statusLower === 'tertunda') return 'warning';
  if (statusLower === 'upcoming' || statusLower === 'akan datang') return 'info';
  
  return 'secondary';
};

/**
 * Fungsi untuk mendapatkan label status yang lebih user-friendly
 * @param {string} status - Status
 * @returns {string} - Label status
 */
export const getStatusLabel = (status) => {
  if (!status) return 'Unknown';
  
  const statusMap = {
    'active': 'Aktif',
    'planned': 'Direncanakan',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan',
    'on-hold': 'Tertunda',
    'upcoming': 'Akan Datang'
  };
  
  return statusMap[status.toLowerCase()] || status;
};