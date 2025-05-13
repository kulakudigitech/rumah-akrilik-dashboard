import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIndustry, faClipboardCheck, faClock, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL, CURRENCY_OPTIONS } from '../../config/constants';
import { formatCurrency } from '../../utils/formatters';
import { getUserProfile } from '../../utils/auth';
import './Dashboard.css';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const ProductionDashboard = () => {
  const [stats, setStats] = useState({
    ongoingOrders: 0,
    pendingOrders: 0,
    completedToday: 0,
    delayedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stageDistribution, setStageDistribution] = useState({
    labels: ['Desain', 'Operator Mesin', 'Finishing', 'Quality Control', 'Packing', 'Siap Kirim'],
    datasets: [{
      data: [12, 19, 8, 5, 2, 3],
      backgroundColor: [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#6f42c1'
      ]
    }]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get production dashboard stats
        let dashboardStats;
        try {
          const statsResponse = await axios.get(`${API_URL}/dashboard/stats/`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
            },
            params: { type: 'production' }
          });
          
          dashboardStats = statsResponse.data;
        } catch (error) {
          console.error('Error fetching dashboard stats:', error);
          dashboardStats = {
            ongoingOrders: 15,
            pendingOrders: 8,
            completedToday: 3,
            delayedOrders: 2
          };
        }
        
        // Get production orders
        let productionOrders;
        try {
          const ordersResponse = await axios.get(`${API_URL}/orders/`, {
            headers: { 
              Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
            },
            params: { 
              status__name: 'Produksi',
              limit: 10, 
              order_by: '-order_date'
            }
          });
          
          productionOrders = ordersResponse.data.results || [];
        } catch (error) {
          console.error('Error fetching orders:', error);
          productionOrders = [
            { id: 'INV-20250511-0001', customer: { name: 'Sumbodo Malik' }, items: [{ nama_produk: 'Plakat Akrilik' }], due_date: '2025-05-15', status: { name: 'Produksi' } }
          ];
        }
        
        // Transform orders for display
        const transformedOrders = productionOrders.map(order => ({
          id: order.order_number || order.id,
          customer: order.customer?.name || 'Unknown',
          product: order.items && order.items.length > 0 ? order.items[0].nama_produk : 'Unknown Product',
          stage: getOrderCurrentStage(order),
          deadline: order.due_date || new Date().toISOString(),
          status: getOrderProductionStatus(order)
        }));
        
        // Set state with fetched data
        setStats(dashboardStats);
        setRecentOrders(transformedOrders);

        // Fetch stage distribution data
        const stageDistributionData = await fetchStageDistribution();

        if (stageDistributionData) {
          setStageDistribution({
            labels: stageDistributionData.labels,
            datasets: [{
              data: stageDistributionData.data,
              backgroundColor: [
                '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#6f42c1'
              ]
            }]
          });
        }
        
      } catch (error) {
        console.error('Error in fetchData:', error);
        // Set fallback data
      } finally {
        setLoading(false);
      }
    };

    // Helper function to determine order's current stage
    const getOrderCurrentStage = (order) => {
      // If the order has production_trackings
      if (order.production_trackings && order.production_trackings.length > 0) {
        // Find the first incomplete stage
        const pendingStage = order.production_trackings.find(t => t.status !== 'completed');
        if (pendingStage) return pendingStage.stage_name;
        
        // If all completed, return the last stage
        return order.production_trackings[order.production_trackings.length - 1].stage_name;
      }
      
      return 'Belum Dimulai';
    };

    // Helper function to determine order's production status
    const getOrderProductionStatus = (order) => {
      if (!order.due_date) return 'ongoing';
      
      const dueDate = new Date(order.due_date);
      const today = new Date();
      
      // Check if the order is past due
      if (dueDate < today) return 'delayed';
      
      // Check if all stages are completed
      if (order.production_trackings && order.production_trackings.length > 0) {
        const allCompleted = order.production_trackings.every(t => t.status === 'completed');
        if (allCompleted) return 'completed';
      }
      
      // If no stages completed yet
      const hasStarted = order.production_trackings && 
                        order.production_trackings.some(t => t.status === 'completed' || t.status === 'in_progress');
      
      return hasStarted ? 'ongoing' : 'pending';
    };

    // Helper function to fetch stage distribution data
    const fetchStageDistribution = async () => {
      try {
        // Try to get the stage distribution data from API
        const stageResponse = await axios.get(`${API_URL}/production-tracking/stats/`, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
          }
        });
        
        if (stageResponse.data && stageResponse.data.distribution) {
          return stageResponse.data.distribution;
        }
        throw new Error('Invalid response format');
      } catch (error) {
        console.warn('Error fetching stage distribution data:', error);
        
        // Filter and count orders by current stage
        const stageCount = {
          'Desain': 0,
          'Operator Mesin': 0,
          'Finishing': 0, 
          'Quality Control': 0,
          'Packing': 0,
          'Siap Kirim': 0
        };
        
        // Use the recent orders data to calculate stage distribution
        recentOrders.forEach(order => {
          const stage = order.stage;
          if (stage && stageCount.hasOwnProperty(stage)) {
            stageCount[stage]++;
          }
        });
        
        return {
          labels: Object.keys(stageCount),
          data: Object.values(stageCount)
        };
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

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header as="h5">Order Prioritas</Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID Order</th>
                    <th>Customer</th>
                    <th>Produk</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Filter orders with approaching deadlines or marked as urgent */}
                  {recentOrders
                    .filter(order => {
                      const deadline = new Date(order.deadline);
                      const today = new Date();
                      const dayDiff = Math.floor((deadline - today) / (1000 * 60 * 60 * 24));
                      return dayDiff <= 3 || order.status === 'delayed';
                    })
                    .map(order => (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>{order.customer}</td>
                        <td>{order.product}</td>
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
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Distribusi Tahapan Produksi</Card.Header>
            <Card.Body className="d-flex justify-content-center">
              <div style={{ width: '300px', height: '300px' }}>
                <Doughnut data={stageDistribution} options={{ maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* Additional charts can be added */}
      </Row>

      <Row className="mt-4">
        <Col md={12}>
          <Card>
            <Card.Header as="h5">Kinerja Tim Produksi</Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nama Staff</th>
                    <th>Tahapan</th>
                    <th>Tugas Selesai (Minggu Ini)</th>
                    <th>Tugas dalam Proses</th>
                    <th>Rata-rata Waktu Penyelesaian</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dummy data - replace with API data */}
                  <tr>
                    <td>Bambang</td>
                    <td>Desain</td>
                    <td>8</td>
                    <td>2</td>
                    <td>1.5 jam</td>
                  </tr>
                  <tr>
                    <td>Joko</td>
                    <td>Operator Mesin</td>
                    <td>12</td>
                    <td>3</td>
                    <td>2.1 jam</td>
                  </tr>
                  <tr>
                    <td>Sinta</td>
                    <td>Finishing</td>
                    <td>7</td>
                    <td>4</td>
                    <td>1.8 jam</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Bisa ditambahkan komponen tambahan seperti grafik progres produksi */}
    </div>
  );
};

export default ProductionDashboard;