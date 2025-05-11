import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faShoppingCart, faUsers, faMoneyBillWave, faChartLine, 
    faUserPlus, faMapMarkerAlt, faBullhorn
  } from '@fortawesome/free-solid-svg-icons';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const MarketingDashboard = () => {
  // States
  const [stats, setStats] = useState({
    totalSales: 0,
    newCustomers: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    targetAchievement: 0
  });
  const [salesData, setSalesData] = useState({});
  const [channelData, setChannelData] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Set dummy data
        setStats({
          totalSales: 28500000,
          newCustomers: 15,
          averageOrderValue: 950000,
          conversionRate: 3.5,
          targetAchievement: 78
        });
        
        // Sales trend data
        setSalesData({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: 'Penjualan 2025',
              data: [15000000, 18000000, 22000000, 25000000, 28500000],
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Target 2025',
              data: [15000000, 20000000, 25000000, 30000000, 35000000],
              borderColor: '#dc3545',
              borderDash: [5, 5],
              backgroundColor: 'transparent',
              fill: false
            }
          ]
        });
        
        // Channel distribution
        setChannelData({
          labels: ['Online', 'Offline', 'Referral', 'Marketplace'],
          datasets: [
            {
              data: [45, 30, 15, 10],
              backgroundColor: [
                '#007bff', '#28a745', '#ffc107', '#dc3545'
              ],
              hoverOffset: 4
            }
          ]
        });
        
        // Top products
        setTopProducts([
          { id: 1, name: 'Neon Box Premium', sales: 12, revenue: 12000000, growth: 15 },
          { id: 2, name: 'Plakat Akrilik', sales: 25, revenue: 7500000, growth: 8 },
          { id: 3, name: 'Sign Akrilik LED', sales: 10, revenue: 5000000, growth: 12 },
          { id: 4, name: 'Label Name Akrilik', sales: 45, revenue: 3600000, growth: -5 },
          { id: 5, name: 'Standing Display A3', sales: 8, revenue: 2400000, growth: 20 }
        ]);
        
        // Recent customers
        setRecentCustomers([
          { id: 1, name: 'PT Global Tekno', date: '2025-05-10', source: 'Website', value: 2500000 },
          { id: 2, name: 'Cafe Kopi Senja', date: '2025-05-09', source: 'Instagram', value: 1200000 },
          { id: 3, name: 'Dr. Andi Pratama', date: '2025-05-08', source: 'Referral', value: 850000 },
          { id: 4, name: 'Toko Buku Cemerlang', date: '2025-05-07', source: 'Exhibition', value: 1800000 },
          { id: 5, name: 'Apotek Sehat', date: '2025-05-06', source: 'Google', value: 1500000 }
        ]);
        
      } catch (error) {
        console.error('Error fetching marketing data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Get badge for growth
  const getGrowthBadge = (growth) => {
    if (growth > 0) {
      return <Badge bg="success">+{growth}%</Badge>;
    } else if (growth < 0) {
      return <Badge bg="danger">{growth}%</Badge>;
    }
    return <Badge bg="secondary">0%</Badge>;
  };

  // Get badge for source
  const getSourceBadge = (source) => {
    switch(source.toLowerCase()) {
      case 'website':
        return <Badge bg="primary">Website</Badge>;
      case 'instagram':
      case 'facebook':
      case 'tiktok':
        return <Badge bg="info">Social Media</Badge>;
      case 'google':
        return <Badge bg="success">Google</Badge>;
      case 'referral':
        return <Badge bg="warning">Referral</Badge>;
      case 'exhibition':
        return <Badge bg="secondary">Exhibition</Badge>;
      default:
        return <Badge bg="light">{source}</Badge>;
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Marketing</h1>
      <p className="dashboard-subtitle">Analisis penjualan dan efektifitas pemasaran</p>

      <Row className="stat-cards">
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.totalSales)}</h3>
                <p>Total Penjualan</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faUserPlus} />
              </div>
              <div className="stat-details">
                <h3>{stats.newCustomers}</h3>
                <p>Customer Baru</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon yellow">
                <FontAwesomeIcon icon={faShoppingCart} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.averageOrderValue)}</h3>
                <p>Rata-rata Order</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon purple">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="stat-details">
                <h3>{stats.targetAchievement}%</h3>
                <p>Target Bulanan</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faChartLine} className="me-2" />
                  Trend Penjualan
                </h5>
                <Form.Select style={{ width: 'auto' }}>
                  <option>5 Bulan Terakhir</option>
                  <option>Tahun Ini</option>
                  <option>12 Bulan Terakhir</option>
                </Form.Select>
              </div>
            </Card.Header>
            <Card.Body>
              <Line 
                data={salesData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value);
                        }
                      }
                    }
                  }
                }}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faBullhorn} className="me-2" />
                Channel Penjualan
              </h5>
            </Card.Header>
            <Card.Body>
              <Doughnut 
                data={channelData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
                height={230}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col lg={7}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faUsers} className="me-2" />
                Customer Baru Terbaru
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Tanggal</th>
                    <th>Sumber</th>
                    <th>Nilai</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCustomers.map(customer => (
                    <tr key={customer.id}>
                      <td>{customer.name}</td>
                      <td>{new Date(customer.date).toLocaleDateString('id-ID')}</td>
                      <td>{getSourceBadge(customer.source)}</td>
                      <td>{formatCurrency(customer.value)}</td>
                      <td>
                        <Button variant="outline-primary" size="sm">Detail</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" href="/customers">Lihat Semua Customer</Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col lg={5}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="me-2" />
                Top Produk (Bulan Ini)
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Unit</th>
                    <th>Pendapatan</th>
                    <th>Pertumbuhan</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.map(product => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.sales}</td>
                      <td>{formatCurrency(product.revenue)}</td>
                      <td>{getGrowthBadge(product.growth)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MarketingDashboard;