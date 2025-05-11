import axios from 'axios';

const api = axios.create({
  baseURL: 'https://rumahakrilik.id/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Jika error karena token tidak valid (401)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Coba refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Tidak ada refresh token, harus login ulang
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        const response = await axios.post('/auth/token/refresh/', { refresh: refreshToken });
        
        if (response.status === 200) {
          localStorage.setItem('jwtToken', response.data.access);
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token gagal, harus login ulang
        console.error('Error saat refresh token:', refreshError);
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

