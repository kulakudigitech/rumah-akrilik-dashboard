/**
 * Konfigurasi konstanta aplikasi Rumah Akrilik
 */

// API URL - sesuaikan dengan environment
export const API_URL = 'https://rumahakrilik.id/api';

// App name
export const APP_NAME = 'Rumah Akrilik Dashboard';

// Default pagination settings
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;

// Dashboard refresh interval (in milliseconds)
export const DASHBOARD_REFRESH_INTERVAL = 300000; // 5 minutes

// Upload file size limit (in bytes)
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

// Date format options
export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm';

// Currency formatting options
export const CURRENCY_OPTIONS = {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  PRODUCTION: 'produksi',
  MARKETING: 'marketing',
  FINANCE: 'keuangan',
  WAREHOUSE: 'gudang',
  HRD: 'hrd',
  RND: 'rnd'
};

// Status colors for badges
export const STATUS_COLORS = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  cancelled: 'danger',
  paid: 'success',
  unpaid: 'danger',
  partial: 'warning'
};

// Default error messages
export const ERROR_MESSAGES = {
  DEFAULT: 'Terjadi kesalahan. Silakan coba lagi nanti.',
  NETWORK: 'Koneksi internet terputus. Periksa koneksi anda.',
  UNAUTHORIZED: 'Sesi anda telah berakhir. Silakan login kembali.',
  FORBIDDEN: 'Anda tidak memiliki izin untuk mengakses fitur ini.',
  NOT_FOUND: 'Data tidak ditemukan.'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'jwtToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  ROLE: 'role',
  USER_ROLES: 'userRoles'
};

// Production stages
export const PRODUCTION_STAGES = [
  { id: 1, name: 'Desain', key: 'desain' },
  { id: 2, name: 'Operator Mesin', key: 'operator_mesin' },
  { id: 3, name: 'Finishing', key: 'finishing' },
  { id: 4, name: 'Quality Control', key: 'quality_control' },
  { id: 5, name: 'Packing', key: 'packing' },
  { id: 6, name: 'Siap Kirim/Pasang', key: 'siap_kirim_pasang' }
];