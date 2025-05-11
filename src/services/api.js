import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api', // Gunakan URL relatif alih-alih hardcoded IP
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add CSRF token defaults
api.defaults.xsrfCookieName = 'csrftoken';
api.defaults.xsrfHeaderName = 'X-CSRFTOKEN';

// Add token interceptor
api.interceptors.request.use((config) => {
  config.withCredentials = true;
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Generate mock data functions
const generateMockOrders = (count = 10) => {
  return Array.from({ length: count }, (_, i) => {
    const id = i + 1;
    const statusOptions = ['Baru', 'Diproses', 'Produksi', 'Siap Kirim', 'Dikirim', 'Selesai'];
    const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
    
    const items = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, j) => ({
      id: `item-${id}-${j + 1}`,
      nama_produk: `Produk Akrilik ${['Neon Box', 'Signage', 'Trophy', 'Display Stand'][Math.floor(Math.random() * 4)]}`,
      quantity: Math.floor(Math.random() * 5) + 1,
      unit_price: Math.floor(Math.random() * 500000) + 100000,
    }));
    
    const totalItems = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const biaya_pasang = Math.floor(Math.random() * 100000);
    const biaya_survey = Math.floor(Math.random() * 50000);
    
    return {
      id: id,
      order_number: `ORD-${String(id).padStart(3, '0')}`,
      order_date: orderDate.toISOString().split('T')[0],
      customer: {
        name: `Customer ${id}`,
        phone: `0812-3456-${String(id).padStart(4, '0')}`,
        email: `customer${id}@example.com`,
      },
      status: {
        name: randomStatus,
        id: id % 6 + 1,
      },
      items: items,
      biaya_pasang: biaya_pasang,
      biaya_survey: biaya_survey,
      calculated_total: totalItems + biaya_pasang + biaya_survey,
    };
  });
};

// Tambahkan fungsi untuk generate mock production orders
const generateMockProductionOrders = (count = 5) => {
  const mockOrders = generateMockOrders(count);
  
  // Tambahkan informasi produksi untuk setiap order
  return mockOrders.map(order => {
    const productionSteps = {
      design: Math.random() > 0.5,
      cutting: Math.random() > 0.4,
      assembly: Math.random() > 0.6,
      finishing: Math.random() > 0.7,
      qc: Math.random() > 0.8,
      packaging: Math.random() > 0.9
    };
    
    const startDate = new Date(order.order_date);
    startDate.setDate(startDate.getDate() + 2);
    
    const estimatedDays = Math.floor(Math.random() * 7) + 3;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + estimatedDays);
    
    return {
      ...order,
      production: {
        id: order.id,
        steps: productionSteps,
        start_date: startDate.toISOString().split('T')[0],
        estimated_completion: endDate.toISOString().split('T')[0],
        responsible_person: "Production Manager",
        notes: "Proses produksi berjalan normal"
      }
    };
  });
};

// Tambahkan fungsi retry
const withRetry = async (apiCall, retries = 2, delay = 1000, mockData = null, useForceFailure = false) => {
  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (useForceFailure) throw new Error('Forced failure for testing');
      
      // Pada percobaan pertama, gunakan timeout standar
      // Pada percobaan berikutnya, gunakan timeout yang lebih lama
      const timeoutMultiplier = attempt + 1;
      const config = { timeout: 15000 * timeoutMultiplier };
      
      const response = await apiCall(config);
      console.log(`API Response (attempt ${attempt + 1}):`, response.data);
      return response.data;
    } catch (error) {
      lastError = error;
      console.warn(`API attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Increase delay exponentially for each retry
      }
    }
  }
  
  // Semua percobaan gagal, gunakan mock data
  console.error('All API attempts failed:', lastError);
  console.log('Using fallback mock data');
  return typeof mockData === 'function' ? mockData() : mockData;
};

// Metode getOrders yang lebih baik
const getOrders = async (params = {}, useMock = false) => {
  try {
    console.log("API getOrders called with params:", params);
    
    if (useMock) {
      console.log("Using mock data for orders");
      return {
        count: 14,
        next: null,
        previous: null,
        results: generateMockOrders(14)
      };
    }
    
    console.log("Making API request to /orders/ with params:", params);
    const response = await api.get('/orders/', { params });
    console.log("API Response for orders:", response);
    console.log("Response data:", response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    
    if (useMock) {
      console.log("Error occurred, returning mock data");
      return {
        count: 14,
        next: null,
        previous: null,
        results: generateMockOrders(14)
      };
    }
    
    throw error;
  }
};

// Function to update an order's status
const updateOrderStatus = async (orderId, statusId) => {
  try {
    console.log(`Updating order ${orderId} to status ${statusId}`);
    
    // Send status in the nested object format
    const response = await api.patch(`/orders/${orderId}/`, { 
      status: {"id": statusId}
    });
    
    console.log('Update status response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Add this function to api.js
const debug = {
  request: async (method, url, data = null) => {
    try {
      console.log(`Making ${method} request to ${url} with data:`, data);
      
      const token = localStorage.getItem('authToken');
      console.log('Using token:', token);
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      console.log('Using headers:', headers);
      
      let response;
      if (method === 'GET') {
        response = await axios.get(url, { headers });
      } else if (method === 'POST') {
        response = await axios.post(url, data, { headers });
      } else if (method === 'PATCH') {
        response = await axios.patch(url, data, { headers });
      }
      
      console.log('Response:', response);
      return response.data;
    } catch (error) {
      console.error('Debug request failed:', error);
      throw error;
    }
  }
};

// Production stage API methods
export const getProductionStages = async (params = {}) => {
  try {
    const response = await api.get('/production-stages/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching production stages:', error);
    throw error;
  }
};

export const createProductionStage = async (data) => {
  try {
    const response = await api.post('/production-stages/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating production stage:', error);
    throw error;
  }
};

export const updateProductionStage = async (id, data) => {
  try {
    const response = await api.patch(`/production-stages/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating production stage:', error);
    throw error;
  }
};

// Production tracking API methods
export const getProductionTracking = async (params = {}) => {
  try {
    const response = await api.get('/production-tracking/', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching production tracking:', error);
    throw error;
  }
};

export const createProductionTracking = async (data) => {
  try {
    const response = await api.post('/production-tracking/', data);
    return response.data;
  } catch (error) {
    console.error('Error creating production tracking:', error);
    throw error;
  }
};

export const updateProductionTracking = async (id, data) => {
  try {
    const response = await api.patch(`/production-tracking/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating production tracking:', error);
    throw error;
  }
};

// Add this function to your api service file

export const getProductionTrackingStatus = async (orderId) => {
  try {
    const response = await axios.get(`https://rumahakrilik.id/api/production-tracking/${orderId}/`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    // Check if it's a different endpoint structure
    if (error.response && error.response.status === 404) {
      try {
        const fallbackResponse = await axios.get(`https://rumahakrilik.id/api/orders/${orderId}/tracking/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
        return fallbackResponse.data;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
    throw error;
  }
};

export const updateProductionTrackingStatus = async (id, status) => {
  try {
    const response = await api.post(`/production-tracking/${id}/update_status/`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating production tracking status:', error);
    throw error;
  }
};

// Function to get a single order by ID
async function getOrder(id) {
  try {
    const response = await api.get(`/order/${id}/`); // Ganti menjadi /order/ bukan /orders/
    return response.data;
  } catch (error) {
    console.error(`Error fetching order #${id}:`, error);
    throw error;
  }
}

// Function to update an order
async function updateOrder(id, data) {
  try {
    const response = await api.put(`/orders/${id}/`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating order #${id}:`, error);
    throw error;
  }
}

// API methods
export default {
  // Base axios instance for direct use
  axios: api,
  
  // Orders
  getOrders,
  
  getOrderById: (orderId, useMock = false) => {
    return withRetry(
      (config) => api.get(`/orders/${orderId}/`, config),
      2,
      1000,
      generateMockOrders(1)[0],
      useMock
    );
  },
  
  // Order Status
  getOrderStatuses: (useMock = false) => {
    return withRetry(
      (config) => api.get('/order-status/', config),
      2,
      1000,
      [
        { id: 1, name: 'Baru', description: 'Order baru dibuat' },
        { id: 2, name: 'Diproses', description: 'Sedang diproses' },
        { id: 3, name: 'Produksi', description: 'Dalam proses produksi' },
        { id: 4, name: 'Siap Kirim', description: 'Siap untuk dikirim' },
        { id: 5, name: 'Dikirim', description: 'Sedang dalam pengiriman' },
        { id: 6, name: 'Selesai', description: 'Order telah selesai' }
      ],
      useMock
    );
  },
  
  // Dashboard stats
  getDashboardStats: (useMock = false) => {
    return withRetry(
      (config) => api.get('/dashboard/stats/', config),
      2,
      1000,
      {
        order_baru: 5,
        order_proses: 8,
        order_selesai: 12,
        pendapatan_bulan_ini: 15000000,
        monthly_sales: [
          { month: "Jan", amount: 8500000 },
          { month: "Feb", amount: 9200000 },
          { month: "Mar", amount: 11500000 },
          { month: "Apr", amount: 10800000 },
          { month: "May", amount: 12500000 },
          { month: "Jun", amount: 15000000 }
        ],
        top_products: [
          { product_name: "Neon Box", count: 24 },
          { product_name: "Akrilik Stand", count: 18 },
          { product_name: "Trophy Akrilik", count: 15 },
          { product_name: "Name Tag", count: 12 },
          { product_name: "Signage", count: 8 }
        ]
      },
      useMock
    );
  },
  
  // Production Orders
  getProductionOrders: (useMock = false) => {
    return withRetry(
      (config) => api.get('/produksi/', config),
      2,
      1000,
      generateMockProductionOrders(),
      useMock
    );
  },
  
  getProductionOrderDetails: (orderId, useMock = false) => {
    return withRetry(
      (config) => api.get(`/produksi/${orderId}/`, config),
      2,
      1000,
      generateMockProductionOrders(1)[0],
      useMock
    );
  },
  
  updateProductionStatus: (orderId, status, useMock = false) => {
    return withRetry(
      (config) => api.patch(`/produksi/${orderId}/`, { status }, config),
      2,
      1000,
      { success: true, message: "Status produksi berhasil diperbarui" },
      useMock
    );
  },
  
  updateOrderStatus,
  debug,
  getOrder,
  updateOrder
};