import ProductionDatabase from './productionDatabase';
import ApiStatusChecker from './apiStatusChecker';

/**
 * Fungsi helper untuk mendapatkan data order dengan berbagai fallback
 */
export const getOrderData = async (orderId) => {
  // Coba dapatkan dari API terlebih dahulu
  try {
    // Cek status API
    const apiAvailable = await ApiStatusChecker.isApiAvailable();
    
    if (apiAvailable) {
      const endpoints = [
        `https://rumahakrilik.id/api/orders/${orderId}/`,
        `https://rumahakrilik.id/api/order/${orderId}/`,
        `https://rumahakrilik.id/api/production-orders/${orderId}/`
      ];
      
      const token = localStorage.getItem('jwtToken');
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying to fetch order data from ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`Successfully fetched order ${orderId} from API`);
            
            // Simpan di database lokal untuk penggunaan offline
            ProductionDatabase.saveOrder(orderId, data);
            
            return {
              data,
              source: 'api',
              isDummy: false
            };
          }
        } catch (endpointError) {
          console.warn(`Failed to fetch from ${endpoint}:`, endpointError.message);
        }
      }
    }
    
    // API tidak tersedia atau semua endpoint gagal, coba ambil dari database lokal
    console.log('API unavailable or endpoints failed, checking local database');
    const localOrder = ProductionDatabase.getOrder(orderId, false);
    
    if (localOrder) {
      console.log(`Found order ${orderId} in local database`);
      return {
        data: localOrder,
        source: 'local',
        isDummy: !!localOrder.isDummyData
      };
    }
    
    // Tidak ada di lokal, generate dummy data
    console.log(`Order ${orderId} not found in API or local database, generating dummy data`);
    const dummyOrder = ProductionDatabase.generateMockOrder(orderId);
    ProductionDatabase.saveOrder(orderId, dummyOrder);
    
    return {
      data: dummyOrder,
      source: 'dummy',
      isDummy: true
    };
    
  } catch (error) {
    console.error(`Error fetching order ${orderId}:`, error);
    
    // Fallback ke lokal
    const localOrder = ProductionDatabase.getOrder(orderId, true);
    
    return {
      data: localOrder,
      source: localOrder.isDummyData ? 'dummy' : 'local',
      isDummy: !!localOrder.isDummyData,
      error
    };
  }
};

/**
 * Format order data ke standar format untuk display
 */
export const formatOrderForDisplay = (orderData) => {
  if (!orderData) return null;
  
  // Mendapatkan produk pertama atau fallback
  const firstItem = orderData.items && orderData.items.length > 0
    ? orderData.items[0]
    : { nama_produk: 'Unknown Product', specifications: {} };
  
  // Format tanggal
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };
  
  // Hitung progress dari tracking
  const calculateProgress = () => {
    if (!orderData.production_trackings || !Array.isArray(orderData.production_trackings)) {
      return 0;
    }
    
    const totalStages = orderData.production_trackings.length;
    if (totalStages === 0) return 0;
    
    const completedStages = orderData.production_trackings.filter(
      track => track.status === 'completed'
    ).length;
    
    return Math.round((completedStages / totalStages) * 100);
  };
  
  return {
    id: orderData.id || 'unknown',
    orderId: orderData.id || orderData.order_id || 'unknown',
    orderNumber: orderData.order_number || `Order-${orderData.id}`,
    customerName: orderData.customer?.name || 'Unknown Customer',
    productName: firstItem.nama_produk,
    specifications: firstItem.specifications || {},
    notes: orderData.notes || firstItem.notes || '',
    orderDate: formatDate(orderData.order_date),
    dueDate: formatDate(orderData.due_date),
    status: orderData.status?.name || 'Produksi',
    progress: calculateProgress(),
    trackings: orderData.production_trackings || [],
    total: orderData.total || 0,
    isDummy: !!orderData.isDummyData
  };
};