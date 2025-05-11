import React, { useState, useEffect } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';

const ProductionStagesTracker = ({ orderId, onStatusChange }) => {
  const [stages, setStages] = useState({
    design: { completed: false, id: 1 },
    operator: { completed: false, id: 2 },
    finishing: { completed: false, id: 3 },
    quality: { completed: false, id: 4 },
    packing: { completed: false, id: 5 },
    shipping: { completed: false, id: 6 }
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStages();
  }, [orderId]);

  const fetchStages = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`https://rumahakrilik.id/api/production-tracking/${orderId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Fetched tracking data:', response.data);
      
      // Map response to our state structure
      const trackingData = response.data;
      const updatedStages = { ...stages };
      
      // Handle different response formats
      if (Array.isArray(trackingData)) {
        // Format with array of stage objects
        trackingData.forEach(stage => {
          if (stage.name === 'design' || stage.stage === 'design') 
            updatedStages.design = { completed: stage.completed || false, id: 1 };
          else if (stage.name === 'operator_mesin' || stage.stage === 'operator_mesin') 
            updatedStages.operator = { completed: stage.completed || false, id: 2 };
          else if (stage.name === 'finishing' || stage.stage === 'finishing') 
            updatedStages.finishing = { completed: stage.completed || false, id: 3 };
          else if (stage.name === 'quality_control' || stage.stage === 'quality_control') 
            updatedStages.quality = { completed: stage.completed || false, id: 4 };
          else if (stage.name === 'packing' || stage.stage === 'packing') 
            updatedStages.packing = { completed: stage.completed || false, id: 5 };
          else if (stage.name === 'siap_kirim_pasang' || stage.stage === 'siap_kirim_pasang') 
            updatedStages.shipping = { completed: stage.completed || false, id: 6 };
        });
      } else if (typeof trackingData === 'object') {
        // Format with object containing stage properties
        updatedStages.design = { completed: trackingData.design || false, id: 1 };
        updatedStages.operator = { completed: trackingData.operator_mesin || false, id: 2 };
        updatedStages.finishing = { completed: trackingData.finishing || false, id: 3 };
        updatedStages.quality = { completed: trackingData.quality_control || false, id: 4 };
        updatedStages.packing = { completed: trackingData.packing || false, id: 5 };
        updatedStages.shipping = { completed: trackingData.siap_kirim_pasang || false, id: 6 };
      }
      
      setStages(updatedStages);
      
      if (onStatusChange) {
        onStatusChange(updatedStages);
      }
    } catch (err) {
      console.error('Error fetching stages:', err);
      setError('Gagal memuat data status produksi');
      
      // Try alternative endpoint as fallback
      try {
        const altResponse = await axios.get(`https://rumahakrilik.id/api/orders/${orderId}/tracking/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Fetched tracking data from alternative endpoint:', altResponse.data);
        // Process this data similarly...
        // (Implementation would be similar to above)
        
      } catch (altErr) {
        console.error('Alternative endpoint also failed:', altErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStageChange = (stageName, checked) => {
    setStages(prev => ({
      ...prev,
      [stageName]: {
        ...prev[stageName],
        completed: checked
      }
    }));
  };

  const saveChanges = async () => {
    try {
      setUpdating(true);
      
      // Format for the API
      const stageUpdates = {
        design: stages.design.completed,
        operator_mesin: stages.operator.completed,
        finishing: stages.finishing.completed,
        quality_control: stages.quality.completed,
        packing: stages.packing.completed,
        siap_kirim_pasang: stages.shipping.completed
      };
      
      console.log('Sending stage updates:', stageUpdates);
      
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
      
      console.log('Update response:', response.data);
      toast.success('Status produksi berhasil diperbarui!');
      
      // Reload the data to ensure we have the latest state
      await fetchStages();
      
    } catch (err) {
      console.error('Error updating stages:', err);
      toast.error('Gagal menyimpan perubahan status produksi');
      
      // Try alternative endpoint
      try {
        const stageUpdates = [
          { id: 1, name: 'design', completed: stages.design.completed },
          { id: 2, name: 'operator_mesin', completed: stages.operator.completed },
          { id: 3, name: 'finishing', completed: stages.finishing.completed },
          { id: 4, name: 'quality_control', completed: stages.quality.completed },
          { id: 5, name: 'packing', completed: stages.packing.completed },
          { id: 6, name: 'siap_kirim_pasang', completed: stages.shipping.completed }
        ];
        
        const altResponse = await axios.put(
          `https://rumahakrilik.id/api/orders/${orderId}/tracking/`,
          { stages: stageUpdates },
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Alternative update response:', altResponse.data);
        toast.success('Status produksi berhasil diperbarui! (metode alternatif)');
        
        // Reload data
        await fetchStages();
        
      } catch (altErr) {
        console.error('Alternative update failed:', altErr);
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-3">
      <Spinner animation="border" size="sm" /> Memuat status produksi...
    </div>;
  }

  if (error) {
    return <Alert variant="warning">{error}</Alert>;
  }

  return (
    <div className="tracking-stages-container">
      <h6 className="mb-3">Status Tahapan</h6>
      
      <Form>
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="stage-design"
            label="Desain"
            checked={stages.design.completed}
            onChange={(e) => handleStageChange('design', e.target.checked)}
            className={stages.design.completed ? "text-success" : ""}
          />
        </div>
        
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="stage-operator"
            label="Operator Mesin"
            checked={stages.operator.completed}
            onChange={(e) => handleStageChange('operator', e.target.checked)}
            className={stages.operator.completed ? "text-success" : ""}
          />
        </div>
        
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="stage-finishing"
            label="Finishing"
            checked={stages.finishing.completed}
            onChange={(e) => handleStageChange('finishing', e.target.checked)}
            className={stages.finishing.completed ? "text-success" : ""}
          />
        </div>
        
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="stage-quality"
            label="Quality Control"
            checked={stages.quality.completed}
            onChange={(e) => handleStageChange('quality', e.target.checked)}
            className={stages.quality.completed ? "text-success" : ""}
          />
        </div>
        
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="stage-packing"
            label="Packing"
            checked={stages.packing.completed}
            onChange={(e) => handleStageChange('packing', e.target.checked)}
            className={stages.packing.completed ? "text-success" : ""}
          />
        </div>
        
        <div className="mb-3">
          <Form.Check 
            type="checkbox"
            id="stage-shipping"
            label="Siap Kirim/Pasang"
            checked={stages.shipping.completed}
            onChange={(e) => handleStageChange('shipping', e.target.checked)}
            className={stages.shipping.completed ? "text-success" : ""}
          />
        </div>
        
        <Button 
          variant="primary"
          onClick={saveChanges}
          disabled={updating}
          className="mt-2"
        >
          {updating ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Menyimpan...
            </>
          ) : (
            'Simpan Perubahan'
          )}
        </Button>
      </Form>
    </div>
  );
};

export default ProductionStagesTracker;