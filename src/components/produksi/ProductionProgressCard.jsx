// New file: src/components/produksi/ProductionProgressCard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Form, Button, ProgressBar, Badge, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import { toast } from 'react-toastify';

const ProductionProgressCard = ({ orderId, stages = {}, onProgressUpdate, initialResponsible = null, readOnly = false }) => {
  const [responsible, setResponsible] = useState(initialResponsible || '');
  const [saving, setSaving] = useState(false);
  const [estimatedCompletion, setEstimatedCompletion] = useState('');
  const [currentStages, setCurrentStages] = useState({
    desain: false,
    operator_mesin: false, 
    finishing: false,
    quality_control: false,
    packing: false,
    siap_kirim_pasang: false
  });
  const [stageProgress, setStageProgress] = useState({
    desain: 0,
    operator_mesin: 0,
    finishing: 0,
    quality_control: 0,
    packing: 0,
    siap_kirim_pasang: 0
  });
  const [userRoles, setUserRoles] = useState([]);
  
  useEffect(() => {
    // Muat data tahapan dari props
    if (stages && Object.keys(stages).length > 0) {
      setCurrentStages(stages);
    }
    
    // Ambil peran pengguna dari localStorage
    try {
      const username = localStorage.getItem('username');
      const userRolesStr = localStorage.getItem('userRoles');
      
      if (username === 'nanang') {
        setUserRoles(['finishing', 'operator_mesin', 'packing', 'quality_control']);
      } else if (userRolesStr) {
        const parsedRoles = JSON.parse(userRolesStr);
        const normalizedRoles = Array.isArray(parsedRoles) 
          ? parsedRoles.map(role => 
              typeof role === 'string' ? role.toLowerCase().replace(/\s+/g, '_') : ''
            ).filter(Boolean) 
          : [];
        setUserRoles(normalizedRoles);
      } else {
        const mainRole = localStorage.getItem('role');
        setUserRoles(mainRole ? [mainRole.toLowerCase().replace(/\s+/g, '_')] : []);
      }
    } catch (error) {
      console.error('Error loading user roles:', error);
    }
    
    // Load saved progress from localStorage
    try {
      const savedProgress = JSON.parse(localStorage.getItem('productionProgress') || '{}');
      if (savedProgress[orderId]) {
        if (savedProgress[orderId].stageProgress) {
          setStageProgress(savedProgress[orderId].stageProgress);
        }
        if (savedProgress[orderId].responsible) {
          setResponsible(savedProgress[orderId].responsible);
        }
        if (savedProgress[orderId].estimatedCompletion) {
          setEstimatedCompletion(savedProgress[orderId].estimatedCompletion);
        }
      }
    } catch (error) {
      console.error('Error loading saved progress:', error);
    }
  }, [orderId, stages]);
  
  // Calculate progress percentage
  const totalStages = Object.keys(stageProgress).length;
  const totalProgress = Object.values(stageProgress).reduce((sum, value) => sum + value, 0);
  const progressPercentage = totalStages > 0 ? Math.round((totalProgress / (totalStages * 100)) * 100) : 0;
  
  const handleSaveChanges = async () => {
    setSaving(true);
    
    try {
      // Save to localStorage first for immediate feedback
      const savedProgress = JSON.parse(localStorage.getItem('productionProgress') || '{}');
      savedProgress[orderId] = {
        stageProgress,
        responsible,
        estimatedCompletion,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('productionProgress', JSON.stringify(savedProgress));
      
      // Try API endpoints
      const endpoints = [
        `${API_URL}/production-orders/${orderId}/update-progress`,
        `${API_URL}/production-tracking/update/`,
        `${API_URL}/orders/${orderId}/production-status`
      ];
      
      const payload = {
        order_id: orderId,
        responsible_person: responsible,
        estimated_completion: estimatedCompletion,
        stages: currentStages,
        progress: stageProgress
      };
      
      let success = false;
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(
            endpoint,
            payload,
            { 
              headers: { 
                Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.status >= 200 && response.status < 300) {
            success = true;
            break;
          }
        } catch (endpointError) {
          console.warn(`Failed to update using ${endpoint}:`, endpointError);
        }
      }
      
      if (success) {
        toast.success('Progress produksi berhasil diperbarui');
      } else {
        toast.info('Progress disimpan secara lokal (server tidak tersedia)');
      }
      
      if (onProgressUpdate) {
        onProgressUpdate(currentStages, progressPercentage, responsible);
      }
    } catch (error) {
      console.error('Error updating production progress:', error);
      toast.error('Gagal memperbarui progress produksi');
    } finally {
      setSaving(false);
    }
  };
  
  const handleProgressChange = (stage, progress) => {
    // Validate progress (0-100)
    const newProgress = Math.max(0, Math.min(100, progress));
    
    setStageProgress(prev => ({
      ...prev,
      [stage]: newProgress
    }));
    
    // If progress is 100, mark stage as completed
    if (newProgress === 100) {
      setCurrentStages(prev => ({
        ...prev,
        [stage]: true
      }));
    } else if (newProgress < 100 && currentStages[stage] === true) {
      setCurrentStages(prev => ({
        ...prev,
        [stage]: false
      }));
    }
  };
  
  const canEditStage = (stage) => {
    // Admin can edit all stages
    const role = localStorage.getItem('role')?.toLowerCase();
    if (['admin', 'owner', 'manager', 'supervisor'].includes(role)) {
      return true;
    }
    
    // Nanang or users with specific roles can only edit their stages
    const normalizedStage = stage.toLowerCase().replace(/\s+/g, '_');
    return userRoles.includes(normalizedStage);
  };
  
  const getProgressVariant = () => {
    if (progressPercentage === 100) return 'success';
    if (progressPercentage >= 70) return 'info';
    if (progressPercentage >= 30) return 'warning';
    return 'danger';
  };
  
  const renderProgressInput = (stage, stageName) => {
    const isDisabled = readOnly || !canEditStage(stage);
    
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between">
          <Form.Label>{stageName}</Form.Label>
          <span>{stageProgress[stage]}%</span>
        </div>
        <div className="d-flex align-items-center">
          <Form.Range 
            value={stageProgress[stage]} 
            onChange={(e) => handleProgressChange(stage, parseInt(e.target.value))}
            disabled={isDisabled}
            min="0"
            max="100"
            className="me-2 flex-grow-1"
          />
          <span style={{ minWidth: '50px' }}>
            <Badge bg={stageProgress[stage] === 100 ? 'success' : 'secondary'}>
              {stageProgress[stage] === 100 ? 'Selesai' : 'Proses'}
            </Badge>
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <Card className="mb-4">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Progress Produksi</h5>
      </Card.Header>
      <Card.Body>
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div>Progress Keseluruhan: {progressPercentage}%</div>
            <Badge bg={getProgressVariant()}>
              {progressPercentage === 100 ? 'Selesai' : 
               progressPercentage >= 70 ? 'Hampir Selesai' : 
               progressPercentage >= 30 ? 'Dalam Proses' : 'Baru Dimulai'}
            </Badge>
          </div>
          <ProgressBar 
            variant={getProgressVariant()} 
            now={progressPercentage} 
            label={`${progressPercentage}%`} 
          />
        </div>
        
        <div className="row mb-3">
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>Penanggung Jawab:</Form.Label>
              <Form.Control 
                type="text" 
                value={responsible} 
                onChange={(e) => setResponsible(e.target.value)} 
                placeholder="Nama penanggung jawab" 
                disabled={readOnly}
              />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group className="mb-3">
              <Form.Label>Estimasi Selesai:</Form.Label>
              <Form.Control 
                type="date" 
                value={estimatedCompletion} 
                onChange={(e) => setEstimatedCompletion(e.target.value)}
                disabled={readOnly}
              />
            </Form.Group>
          </div>
        </div>
        
        <Row>
          <Col md={6}>
            <h6 className="mb-3">Progress Tahapan:</h6>
            {renderProgressInput('desain', 'Desain')}
            {renderProgressInput('operator_mesin', 'Operator Mesin')}
            {renderProgressInput('finishing', 'Finishing')}
          </Col>
          <Col md={6}>
            <h6 className="mb-3">&nbsp;</h6>
            {renderProgressInput('quality_control', 'Quality Control')}
            {renderProgressInput('packing', 'Packing')}
            {renderProgressInput('siap_kirim_pasang', 'Siap Kirim/Pasang')}
          </Col>
        </Row>
        
        {!readOnly && (
          <Button 
            variant="primary" 
            onClick={handleSaveChanges}
            disabled={saving}
            className="mt-3"
          >
            {saving ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                Menyimpan...
              </>
            ) : 'Simpan Perubahan'}
          </Button>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProductionProgressCard;