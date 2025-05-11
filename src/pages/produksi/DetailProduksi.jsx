import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import ProductionStagesTracker from '../../components/produksi/ProductionStagesTracker';

const DetailProduksi = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from primary endpoint
      let response;
      try {
        response = await axios.get(`https://rumahakrilik.id/api/order/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (primaryErr) {
        // If first endpoint fails, try alternative
        response = await axios.get(`https://rumahakrilik.id/api/orders/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      console.log('Order data:', response.data);
      setOrderData(response.data);
      
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError('Gagal memuat data order. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  const handleStagesUpdate = (stages) => {
    // Calculate progress based on completed stages
    const completedCount = Object.values(stages).filter(stage => stage.completed).length;
    const totalStages = Object.values(stages).length;
    const progressPercentage = (completedCount / totalStages) * 100;
    setProgress(progressPercentage);
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
          
          <Row>
            <Col md={6} className="mb-4">
              <p><strong>Responsible Person:</strong> {orderData?.responsible_person || 'Belum Ditugaskan'}</p>
              <p><strong>Start Date:</strong> {orderData?.start_date || orderData?.order_date || 'N/A'}</p>
              <p><strong>Estimated Completion:</strong> {orderData?.estimated_completion || 'Belum ditentukan'}</p>
            </Col>
            
            <Col md={6}>
              <ProductionStagesTracker 
                orderId={orderId} 
                onStatusChange={handleStagesUpdate}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DetailProduksi;