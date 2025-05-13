import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductionStagesTracker from '../../components/produksi/ProductionStagesTracker';
import ProductionProgressCard from '../../components/produksi/ProductionProgressCard';

const DetailProduksi = ({ readOnly = false }) => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressUpdated, setProgressUpdated] = useState(false);
  const [productionStages, setProductionStages] = useState({});
  const [stageProgress, setStageProgress] = useState({});
  
  const [userRoles, setUserRoles] = useState([]);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const username = localStorage.getItem('username');
    setUsername(username);
    
    let roles = [];
    if (username === 'nanang') {
      roles = ['finishing', 'operator_mesin', 'packing', 'quality_control'];
      localStorage.setItem('userRoles', JSON.stringify(roles));
    } else {
      try {
        const userRolesStr = localStorage.getItem('userRoles');
        if (userRolesStr) {
          roles = JSON.parse(userRolesStr);
          if (!Array.isArray(roles)) {
            roles = [localStorage.getItem('role') || ''];
          }
        } else {
          roles = [localStorage.getItem('role') || ''];
        }
      } catch (e) {
        console.error('Error parsing user roles:', e);
        roles = [localStorage.getItem('role') || ''];
      }
    }
    
    setUserRoles(roles.map(r => r.toLowerCase().replace(/\s+/g, '_')));
  }, []);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('jwtToken');
        
        const endpoints = [
          `https://rumahakrilik.id/api/orders/${orderId}/`,
          `https://rumahakrilik.id/api/order/${orderId}/`,
          `https://rumahakrilik.id/api/production-orders/${orderId}/`
        ];
        
        let orderData = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Mencoba endpoint: ${endpoint}`);
            const response = await axios.get(endpoint, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.data) {
              orderData = response.data;
              console.log(`Berhasil mendapatkan data dari ${endpoint}`);
              break;
            }
          } catch (endpointError) {
            console.warn(`Endpoint ${endpoint} gagal:`, endpointError.message);
          }
        }
        
        if (orderData) {
          let stages = {};
          let progress = {};
          
          if (orderData.production_trackings && Array.isArray(orderData.production_trackings)) {
            const trackings = orderData.production_trackings;
            
            trackings.forEach(tracking => {
              if (tracking.stage_name) {
                const stageName = tracking.stage_name.toLowerCase().replace(/\s+/g, '_');
                stages[stageName] = tracking.status === 'completed';
                progress[stageName] = tracking.status === 'completed' ? 100 : 
                                      tracking.status === 'in_progress' ? 50 : 0;
              }
            });
          } else {
            stages = {
              desain: false,
              operator_mesin: false,
              finishing: false,
              quality_control: false,
              packing: false,
              siap_kirim_pasang: false
            };
            progress = {
              desain: 0,
              operator_mesin: 0,
              finishing: 0,
              quality_control: 0,
              packing: 0,
              siap_kirim_pasang: 0
            };
          }
          
          try {
            const savedProgress = JSON.parse(localStorage.getItem('productionProgress') || '{}');
            if (savedProgress[orderId] && savedProgress[orderId].stageProgress) {
              progress = {
                ...progress,
                ...savedProgress[orderId].stageProgress
              };
              
              Object.keys(progress).forEach(stage => {
                if (progress[stage] === 100) {
                  stages[stage] = true;
                }
              });
            }
          } catch (err) {
            console.warn('Error loading stored progress:', err);
          }
          
          setOrderData(orderData);
          setProductionStages(stages);
          setStageProgress(progress);
          
          const progressValues = Object.values(progress);
          const totalProgress = progressValues.reduce((sum, val) => sum + val, 0);
          const overallProgress = progressValues.length > 0 ? 
            Math.round(totalProgress / (progressValues.length * 100) * 100) : 0;
          
          setProgress(overallProgress);
        } else {
          console.log('Semua endpoint gagal, menggunakan data dummy');
          const dummyData = {
            id: orderId,
            order_number: `Order-${orderId}`,
            customer: { name: 'Pelanggan' },
            status: { name: 'Produksi' },
            items: [{ nama_produk: 'Produk', specifications: {} }],
            notes: 'Data dummy - API tidak menemukan order'
          };
          
          setOrderData(dummyData);
          
          const defaultStages = {
            desain: false,
            operator_mesin: false,
            finishing: false,
            quality_control: false,
            packing: false,
            siap_kirim_pasang: false
          };
          
          const defaultProgress = {
            desain: 0,
            operator_mesin: 0,
            finishing: 0,
            quality_control: 0,
            packing: 0,
            siap_kirim_pasang: 0
          };
          
          setProductionStages(defaultStages);
          setStageProgress(defaultProgress);
        }
      } catch (err) {
        console.error('Error fetching order data:', err);
        setError('Gagal memuat data order. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderData();
  }, [orderId]);

  const handleStagesUpdate = (stages) => {
    if (readOnly) {
      return;
    }
    
    const completedCount = Object.values(stages).filter(stage => stage.completed).length;
    const totalStages = Object.values(stages).length;
    const progressPercentage = (completedCount / totalStages) * 100;
    setProgress(progressPercentage);
    
    const updatedStages = {};
    Object.entries(stages).forEach(([key, value]) => {
      updatedStages[key.toLowerCase().replace(/\s+/g, '_')] = value.completed;
    });
    setProductionStages(updatedStages);
  };

  const handleProgressUpdate = (stages, percentage, responsible) => {
    setProgressUpdated(true);
    setProgress(percentage);
    setProductionStages(stages);
    
    if (responsible) {
      setOrderData(prev => ({
        ...prev,
        responsible_person: responsible
      }));
    }
  };
  
  const canEditStage = (stage) => {
    const role = localStorage.getItem('role')?.toLowerCase();
    if (['admin', 'owner', 'manager', 'supervisor', 'spv'].includes(role)) {
      return true;
    }
    
    return userRoles.includes(stage);
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" /> <p>Memuat data...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-primary" onClick={() => navigate('/produksi/daftar-order')}>
            Kembali ke Daftar Order
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate('/produksi/daftar-order')}
      >
        ← Kembali ke Daftar Produksi
      </Button>
      
      <Card>
        <Card.Header as="h5">
          Detail Produksi: Order #{orderData?.order_number || orderId}
          {username === 'nanang' && (
            <Badge className="ms-3" bg="info">Pengguna: Tim Produksi</Badge>
          )}
        </Card.Header>
        
        <Card.Body>
          <h6>Informasi Order</h6>
          <Row className="mb-4">
            <Col md={6}>
              <p><strong>Customer:</strong> {orderData?.customer?.name || 'N/A'}</p>
              <p><strong>Order Date:</strong> {orderData?.order_date || 'N/A'}</p>
              <p><strong>Status:</strong> {orderData?.status?.name || 'N/A'}</p>
            </Col>
            <Col md={6}>
              <p><strong>Total:</strong> Rp {orderData?.total?.toLocaleString() || '0'}</p>
              <p><strong>Notes:</strong> {orderData?.notes || '-'}</p>
            </Col>
          </Row>
          
          <h6>Progress Produksi</h6>
          <div className="progress mb-4">
            <div 
              className="progress-bar bg-success" 
              role="progressbar" 
              style={{ width: `${progress}%` }} 
              aria-valuenow={progress} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {Math.round(progress)}%
            </div>
          </div>
          
          <ProductionProgressCard 
            orderId={orderId} 
            stages={productionStages}
            onProgressUpdate={handleProgressUpdate}
            initialResponsible={orderData.responsible_person}
            readOnly={readOnly}
          />
          
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-3 p-2 bg-light border rounded">
              <small>
                <strong>Username:</strong> {username}<br/>
                <strong>Roles:</strong> {userRoles.join(', ')}<br/>
                <strong>Can Edit:</strong> {Object.keys(productionStages)
                  .filter(stage => canEditStage(stage))
                  .join(', ')}
              </small>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DetailProduksi;