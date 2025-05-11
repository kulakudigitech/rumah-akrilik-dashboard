import axios from 'axios';

const BASE_URL = 'https://rumahakrilik.id/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('jwtToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Fetches production order list 
export const fetchProductionOrders = async (filters = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/production-orders/`, {
      headers: getAuthHeaders(),
      params: filters
    });
    return response.data;
  } catch (error) {
    // Log the error
    console.error('Error fetching production orders:', error);
    
    // Try alternative endpoint
    try {
      const altResponse = await axios.get(`${BASE_URL}/orders/?status__name=Produksi`, {
        headers: getAuthHeaders(),
        params: filters
      });
      return altResponse.data;
    } catch (altError) {
      console.error('Alternative endpoint also failed:', altError);
      throw altError;
    }
  }
};

// Fetches a specific production order
export const fetchProductionOrder = async (orderId) => {
  try {
    const response = await axios.get(`${BASE_URL}/order/${orderId}/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching production order ${orderId}:`, error);
    
    try {
      const altResponse = await axios.get(`${BASE_URL}/orders/${orderId}/`, {
        headers: getAuthHeaders()
      });
      return altResponse.data;
    } catch (altError) {
      console.error('Alternative endpoint also failed:', altError);
      throw altError;
    }
  }
};

// Fetches tracking status for an order
export const fetchProductionTracking = async (orderId) => {
  try {
    const response = await axios.get(`${BASE_URL}/production-tracking/${orderId}/`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching tracking for order ${orderId}:`, error);
    
    try {
      const altResponse = await axios.get(`${BASE_URL}/orders/${orderId}/tracking/`, {
        headers: getAuthHeaders()
      });
      return altResponse.data;
    } catch (altError) {
      console.error('Alternative endpoint also failed:', altError);
      throw altError;
    }
  }
};

/**
 * Updates production tracking stages for an order
 * @param {number} orderId - The order ID
 * @param {Object} stages - Object with stage statuses
 * @returns {Promise}
 */
export const updateProductionTracking = async (orderId, stages) => {
  try {
    // Get the current tracking records first
    const orderResponse = await axios.get(`${BASE_URL}/orders/${orderId}/`, {
      headers: getAuthHeaders()
    });
    
    const existingTrackings = orderResponse.data.production_trackings || [];
    const updates = [];
    
    // Check each stage and prepare updates
    if ('desain' in stages) {
      const trackingItem = existingTrackings.find(t => t.stage === 1);
      if (trackingItem) {
        updates.push({
          id: trackingItem.id,
          status: stages.desain ? "completed" : "pending"
        });
      }
    }
    
    if ('operator_mesin' in stages) {
      const trackingItem = existingTrackings.find(t => t.stage === 2);
      if (trackingItem) {
        updates.push({
          id: trackingItem.id,
          status: stages.operator_mesin ? "completed" : "pending"
        });
      }
    }
    
    if ('finishing' in stages) {
      const trackingItem = existingTrackings.find(t => t.stage === 3);
      if (trackingItem) {
        updates.push({
          id: trackingItem.id,
          status: stages.finishing ? "completed" : "pending"
        });
      }
    }
    
    if ('quality_control' in stages) {
      const trackingItem = existingTrackings.find(t => t.stage === 4);
      if (trackingItem) {
        updates.push({
          id: trackingItem.id,
          status: stages.quality_control ? "completed" : "pending"
        });
      }
    }
    
    if ('packing' in stages) {
      const trackingItem = existingTrackings.find(t => t.stage === 5);
      if (trackingItem) {
        updates.push({
          id: trackingItem.id,
          status: stages.packing ? "completed" : "pending"
        });
      }
    }
    
    if ('siap_kirim_pasang' in stages) {
      const trackingItem = existingTrackings.find(t => t.stage === 6);
      if (trackingItem) {
        updates.push({
          id: trackingItem.id,
          status: stages.siap_kirim_pasang ? "completed" : "pending"
        });
      }
    }
    
    // Send each update individually
    const updatePromises = updates.map(update => 
      axios.patch(`${BASE_URL}/production-trackings/${update.id}/`, 
        { status: update.status },
        { headers: getAuthHeaders() }
      )
    );
    
    await Promise.all(updatePromises);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating production tracking:', error);
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
};

export default {
  fetchProductionOrders,
  fetchProductionOrder,
  fetchProductionTracking,
  updateProductionTracking
};