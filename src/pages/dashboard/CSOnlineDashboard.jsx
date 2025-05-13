import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faMoneyBillWave, faChartLine, 
  faUserPlus, faCheckCircle, faPhoneAlt
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const CSOnlineDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [leadsToday, setLeadsToday] = useState(0);
  const [closingToday, setClosingToday] = useState(0);
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalClosing: 0,
    closingRate: 0,
    totalOmset: 0
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data when component mounts
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, these would be API calls
        // For now we'll use dummy data
        
        // Fetch campaigns
        setCampaigns([
          { id: 1, name: 'Campaign Instagram Mei 2025' },
          { id: 2, name: 'Promo Website Ramadhan 2025' },
          { id: 3, name: 'Google Ads Q2 2025' }
        ]);
        
        // Fetch leads (will be filtered by campaign later)
        setLeads([
          { id: 1, name: 'PT Maju Jaya', campaign: 1, contact: '08123456789', source: 'Instagram' },
          { id: 2, name: 'Toko Makmur', campaign: 1, contact: '08234567890', source: 'Instagram' },
          { id: 3, name: 'CV Abadi', campaign: 2, contact: '08345678901', source: 'Website' },
          { id: 4, name: 'RS Sehat', campaign: 3, contact: '08456789012', source: 'Google' }
        ]);
        
        // Fetch stats
        setStats({
          totalLeads: 24,
          totalClosing: 8,
          closingRate: 33.33,
          totalOmset: 12500000
        });
        
        // Fetch orders
        setOrders([
          { id: 101, orderNumber: 'ORD-2025-0501', customerName: 'PT Maju Jaya', productName: 'Neon Box', quantity: 2, totalPrice: 4500000, status: 'Processing' },
          { id: 102, orderNumber: 'ORD-2025-0502', customerName: 'Toko Makmur', productName: 'Akrilik Display', quantity: 5, totalPrice: 1750000, status: 'Completed' },
          { id: 103, orderNumber: 'ORD-2025-0503', customerName: 'CV Abadi', productName: 'Plakat Akrilik', quantity: 10, totalPrice: 2500000, status: 'Processing' }
        ]);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Terjadi kesalahan saat mengambil data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter leads by selected campaign
  const filteredLeads = leads.filter(lead => 
    !selectedCampaign || lead.campaign === parseInt(selectedCampaign)
  );

  // Handle campaign selection
  const handleCampaignChange = (e) => {
    setSelectedCampaign(e.target.value);
    setSelectedLeads([]);
  };
  
  // Handle lead selection
  const handleLeadSelection = (selectedOptions) => {
    setSelectedLeads(selectedOptions);
  };
  
  // Handle lead report submission
  const handleSaveLeadReport = () => {
    // In a real implementation, this would be an API call
    alert(`Report tersimpan! ${leadsToday} leads, ${closingToday} closing`);
  };
  
  // Handle WhatsApp click
  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone.replace(/^0/, '62')}`, '_blank');
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge bg="success">Selesai</Badge>;
      case 'processing':
        return <Badge bg="primary">Diproses</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Dibatalkan</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard CS Online</h1>
      <p className="dashboard-subtitle">Manajemen leads dan order online</p>

      <Card className="mb-4">
        <Card.Header>Lead Management</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Pilih Campaign</Form.Label>
              <Form.Select value={selectedCampaign} onChange={handleCampaignChange}>
                <option value="">Semua Campaign</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Pilih Lead yang Akan Ditangani</Form.Label>
              <Form.Select multiple value={selectedLeads} onChange={(e) => {
                const options = [...e.target.selectedOptions];
                const values = options.map(option => option.value);
                setSelectedLeads(values);
              }}>
                {filteredLeads.map(lead => (
                  <option key={lead.id} value={lead.id}>{lead.name} ({lead.source})</option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Tahan tombol Ctrl untuk memilih beberapa lead
              </Form.Text>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lead yang Diambil Hari Ini</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    value={leadsToday}
                    onChange={(e) => setLeadsToday(parseInt(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Closing Lead Hari Ini</Form.Label>
                  <Form.Control 
                    type="number" 
                    min="0" 
                    max={leadsToday}
                    value={closingToday}
                    onChange={(e) => setClosingToday(parseInt(e.target.value) || 0)}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Button variant="primary" onClick={handleSaveLeadReport}>
              Simpan Laporan Lead
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faUsers} />
              </div>
              <div className="stat-details">
                <h3>{stats.totalLeads}</h3>
                <p>Total Lead Diambil</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="stat-details">
                <h3>{stats.totalClosing}</h3>
                <p>Total Closing</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon yellow">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="stat-details">
                <h3>{stats.closingRate}%</h3>
                <p>Closing Rate</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon purple">
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.totalOmset)}</h3>
                <p>Total Omset</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Daftar Order</h5>
            <Button variant="success" href="/form-input-order">+ Order Baru</Button>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Customer</th>
                  <th>Produk</th>
                  <th>Jumlah</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td>{order.productName}</td>
                    <td>{order.quantity}</td>
                    <td>{formatCurrency(order.totalPrice)}</td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <Button variant="info" size="sm" className="me-1" href={`/order/${order.id}`}>
                        Detail
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleWhatsAppClick('081234567890')}>
                        <FontAwesomeIcon icon={faPhoneAlt} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">Tidak ada data orderan</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CSOnlineDashboard;
