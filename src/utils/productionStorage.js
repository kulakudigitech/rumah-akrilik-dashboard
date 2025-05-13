// Add to your utils folder: src/utils/productionStorage.js
export const saveProductionProgress = (orderId, data) => {
  try {
    const savedProgress = JSON.parse(localStorage.getItem('productionProgress') || '{}');
    savedProgress[orderId] = {
      ...data,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem('productionProgress', JSON.stringify(savedProgress));
    return true;
  } catch (error) {
    console.error('Error saving production progress to localStorage:', error);
    return false;
  }
};

export const getProductionProgress = (orderId) => {
  try {
    const savedProgress = JSON.parse(localStorage.getItem('productionProgress') || '{}');
    return savedProgress[orderId] || null;
  } catch (error) {
    console.error('Error reading production progress from localStorage:', error);
    return null;
  }
};

export const syncProductionProgress = async (orderId) => {
  const localProgress = getProductionProgress(orderId);
  if (!localProgress) return false;
  
  try {
    const response = await axios.post(
      `${API_URL}/production-tracking/update/`,
      {
        order_id: orderId,
        responsible_person: localProgress.responsible,
        estimated_completion: localProgress.estimatedCompletion,
        stages: localProgress.stages
      },
      { 
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status >= 200 && response.status < 300) {
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to sync production progress:', error);
    return false;
  }
};