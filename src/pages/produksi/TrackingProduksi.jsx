// Add this function to update production status properly

const updateProductionStatus = async (orderId, stageUpdates) => {
  try {
    setUpdating(true);
    
    // Log what we're sending to help debug
    console.log('Updating production stages:', stageUpdates);
    
    const response = await axios.post(
      `https://rumahakrilik.id/api/production-stages/update/`,
      {
        order_id: orderId,
        stages: stageUpdates
      },
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Important: Check the response format
    console.log('Update response:', response.data);
    
    // Reload the production tracking data
    await fetchProductionTracking(orderId);
    
    toast.success('Status produksi berhasil diperbarui!');
    return true;
  } catch (error) {
    console.error('Error updating production status:', error);
    console.error('Error response:', error.response?.data);
    
    // Try fallback method if the first fails
    try {
      const fallbackResponse = await axios.put(
        `https://rumahakrilik.id/api/orders/${orderId}/update-status/`,
        {
          stages: stageUpdates
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Fallback update response:', fallbackResponse.data);
      toast.success('Status produksi berhasil diperbarui (metode alternatif)!');
      await fetchProductionTracking(orderId);
      return true;
    } catch (fallbackError) {
      console.error('Fallback update also failed:', fallbackError);
      toast.error('Gagal memperbarui status produksi. Silakan coba lagi.');
      return false;
    }
  } finally {
    setUpdating(false);
  }
};