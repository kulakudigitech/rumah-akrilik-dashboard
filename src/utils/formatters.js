/**
 * Utility functions untuk format data pada dashboard dan komponen lainnya
 */

/**
 * Format angka menjadi format mata uang Rupiah
 * @param {number} amount - Jumlah yang akan diformat
 * @returns {string} - String dalam format mata uang Rupiah
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'Rp 0';
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
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
 * Format tanggal ke format Indonesia
 * @param {string|Date} date - Tanggal yang akan diformat
 * @returns {string} - String tanggal format Indonesia
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
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