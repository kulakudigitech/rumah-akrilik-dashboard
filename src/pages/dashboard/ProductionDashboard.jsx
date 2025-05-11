import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndustry, faClipboardCheck, faClock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL, CURRENCY_OPTIONS } from '../../config/constants';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const ProductionDashboard = () => {
  const [stats, setStats] = useState({
    ongoingOrders: 0,
    pendingOrders: 0,
    completedToday: 0,
    delayedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Anda bisa mengubah endpoint sesuai dengan API yang tersedia
        const response = await axios.get(`${API_URL}/produksi/dashboard-stats`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
          }
        });
        
        setStats(response.data.stats);
        setRecentOrders(response.data.recentOrders);
      } catch (error) {
        console.error('Error fetching production dashboard data:', error);
        // Gunakan data dummy untuk demo
        setStats({
          ongoingOrders: 15,
          pendingOrders: 8,
          completedToday: 3,
          delayedOrders: 2
        });
        setRecentOrders([
          { id: 'INV-20250511-0001', customer: 'Sumbodo Malik', product: 'Plakat Akrilik', stage: 'Finishing', deadline: '2025-05-15', status: 'ongoing' },
          { id: 'INV-20250510-0005', customer: 'Andi Susanto', product: 'Sign Akrilik', stage: 'Cutting', deadline: '2025-05-14', status: 'ongoing' },
          { id: 'INV-20250509-0003', customer: 'Budi Santoso', product: 'Trophy Akrilik', stage: 'Design', deadline: '2025-05-13', status: 'pending' },
          { id: 'INV-20250508-0002', customer: 'Diana Putri', product: 'Stand Akrilik', stage: 'Finishing', deadline: '2025-05-12', status: 'completed' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge bg="success">Selesai</Badge>;
      case 'ongoing':
        return <Badge bg="primary">Proses</Badge>;
      case 'pending':
        return <Badge bg="warning">Menunggu</Badge>;
      case 'delayed':
        return <Badge bg="danger">Terlambat</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Produksi</h1>
      <p className="dashboard-subtitle">Pantau status produksi dan kinerja tim</p>

      <Row className="stat-cards">
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faIndustry} />
              </div>
              <div className="stat-details">
                <h3>{stats.ongoingOrders}</h3>
                <p>Order dalam Proses</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon yellow">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-details">
                <h3>{stats.pendingOrders}</h3>
                <p>Menunggu Proses</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faClipboardCheck} />
              </div>
              <div className="stat-details">
                <h3>{stats.completedToday}</h3>
                <p>Selesai Hari Ini</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon red">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="stat-details">
                <h3>{stats.delayedOrders}</h3>
                <p>Order Terlambat</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header as="h5">Order Terbaru</Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID Order</th>
                    <th>Customer</th>
                    <th>Produk</th>
                    <th>Tahap</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.customer}</td>
                      <td>{order.product}</td>
                      <td>{order.stage}</td>
                      <td>{new Date(order.deadline).toLocaleDateString('id-ID')}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          href={`/produksi/${order.id}`}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" href="/produksi">Lihat Semua Order</Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      {/* Bisa ditambahkan komponen tambahan seperti grafik progres produksi */}
    </div>
  );
};

export default ProductionDashboard;