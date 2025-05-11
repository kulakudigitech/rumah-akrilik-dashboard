import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Table, Button } from 'react-bootstrap';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
} from 'chart.js';
import axios from 'axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getEmergencyOrderData, getEmergencyDashboardStats } from '../../utils/DashboardData';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Buat instance axios dengan konfigurasi
const api = axios.create({
  baseURL: 'https://rumahakrilik.id/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor untuk token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Modify the api axios instance to extend error handling
api.interceptors.response.use(
  response => response,
  error => {
    // For 404 errors on tracking endpoints, return empty data instead of rejecting
    if (error.config && error.config.url && 
        error.config.url.includes('/production-tracking/') && 
        error?.response?.status === 404) {
      console.log('404 on tracking endpoint, returning empty data');
      return Promise.resolve({ data: [] });
    }
    
    // Add special handling for dashboard stats 500 errors
    if (error.config && error.config.url &&
        error.config.url.includes('/dashboard/stats/') &&
        error?.response?.status === 500) {
      console.log('500 on dashboard stats, using fallback calculation');
      return Promise.resolve({ data: getEmergencyDashboardStats() });
    }
    
    // For all other errors, continue with rejection
    return Promise.reject(error);
  }
);

// Add this wrapper function for API calls to prevent console errors
const safeApiCall = async (apiFunction, fallbackValue = []) => {
  try {
    const response = await apiFunction();
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    return fallbackValue;
  }
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    topProducts: []
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [revenueChartData, setRevenueChartData] = useState({
    labels: [],
    datasets: []
  });
  const [orderStatusChartData, setOrderStatusChartData] = useState({
    labels: [],
    datasets: []
  });
  const [availableYears] = useState(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
  });
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  useEffect(() => {
    document.title = "Dashboard | Rumah Akrilik";
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      console.log('Fetching dashboard data...');
      
      try {
        // Fetch orders first
        console.log('Fetching orders...');
        let ordersResponse;
        try {
          ordersResponse = await api.get('/orders/');
          console.log('Orders response:', ordersResponse.data);
        } catch (orderError) {
          console.error('Error fetching orders, using emergency data:', orderError);
          ordersResponse = { data: getEmergencyOrderData() };
          setIsEmergencyMode(true);
        }
        
        let orders = [];
        if (ordersResponse.data && ordersResponse.data.results) {
          orders = ordersResponse.data.results;
        } else if (Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data;
        } else {
          console.warn('Unexpected order data format:', ordersResponse.data);
          orders = getEmergencyOrderData().results;
          setIsEmergencyMode(true);
        }
        
        console.log(`Received ${orders.length} orders`);
        
        // Attempt to fetch dashboard stats with retry logic
        let dashboardStats;
        let statsRetryCount = 0;
        const MAX_RETRIES = 2;
        
        while (statsRetryCount <= MAX_RETRIES) {
          try {
            console.log(`Fetching dashboard stats (attempt ${statsRetryCount + 1})...`);
            const statsResponse = await api.get('/dashboard/stats/', {
              params: { year: selectedYear }
            });
            
            console.log('Stats response:', statsResponse.data);
            
            if (statsResponse.data) {
              dashboardStats = statsResponse.data;
              break; // Success, exit retry loop
            }
            
            statsRetryCount++;
          } catch (apiError) {
            console.error(`Error fetching dashboard stats (attempt ${statsRetryCount + 1}):`, apiError);
            statsRetryCount++;
            
            if (statsRetryCount > MAX_RETRIES) {
              // Use emergency data as final fallback
              console.log('Max retries reached, using emergency data');
              dashboardStats = getEmergencyDashboardStats();
              setIsEmergencyMode(true);
            }
          }
        }

        // Prepare revenue chart data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        let monthlyData = dashboardStats.monthlyRevenue || 
            months.map(month => ({ month, amount: 0 }));
        
        // If we have actual monthly data, use that
        if (!monthlyData || monthlyData.length === 0) {
            // Fallback to calculating from orders
            let monthlyRevenue = new Array(12).fill(0);
            
            orders.forEach(order => {
                // Check if order date exists
                if (order.order_date) {
                    const orderDate = new Date(order.order_date);
                    const orderYear = orderDate.getFullYear();
                    
                    // Only include orders from the selected year
                    if (orderYear === selectedYear) {
                        const monthIndex = orderDate.getMonth();
                        const amount = parseFloat(order.total || order.calculated_total || 0);
                        monthlyRevenue[monthIndex] += amount;
                    }
                }
            });
            
            // Convert to expected format
            monthlyData = months.map((month, index) => ({ 
                month, 
                amount: monthlyRevenue[index] 
            }));
        }
        
        setRevenueChartData({
          labels: monthlyData.map(item => item.month),
          datasets: [
            {
              label: 'Pendapatan Bulanan',
              data: monthlyData.map(item => item.amount),
              fill: false,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.4
            }
          ]
        });

        // Prepare order status chart data
        const statusData = dashboardStats.orderStatusDistribution || [
          { name: 'Baru', value: 0 },
          { name: 'Produksi', value: 0 },
          { name: 'Selesai', value: 0 }
        ];
        
        setOrderStatusChartData({
          labels: statusData.map(item => item.name),
          datasets: [
            {
              data: statusData.map(item => item.value),
              backgroundColor: ['#4e73df', '#f6c23e', '#1cc88a', '#e74a3b'],
              borderWidth: 1
            }
          ]
        });

        // Set dashboard statistics
        setStats({
          totalOrders: dashboardStats.totalOrders || orders.length,
          pendingOrders: dashboardStats.pendingOrders || 
                        (dashboardStats.order_baru || 0) + (dashboardStats.order_proses || 0),
          completedOrders: dashboardStats.completedOrders || dashboardStats.order_selesai || 0,
          totalRevenue: dashboardStats.totalRevenue || dashboardStats.pendapatan_bulan_ini || 0,
          topProducts: dashboardStats.topProducts || []
        });

        // Set recent orders for the table
        const recentOrdersList = dashboardStats.recentOrders || 
          orders.slice(0, 5).map(order => ({
            id: order.id,
            order_number: order.order_number,
            customer_name: order.customer?.name || 'Unknown',
            date: order.order_date,
            total: parseFloat(order.total || order.calculated_total || 0),
            status: order.status?.name || 'Unknown'
          }));
        
        setRecentOrders(recentOrdersList);

      } catch (error) {
        console.error('Error in fetchDashboardData:', error);
        
        // Fallback to emergency data for everything
        const emergencyStats = getEmergencyDashboardStats();
        const emergencyOrderData = getEmergencyOrderData();
        
        setStats({
          totalOrders: emergencyStats.totalOrders,
          pendingOrders: emergencyStats.pendingOrders,
          completedOrders: emergencyStats.completedOrders,
          totalRevenue: emergencyStats.totalRevenue,
          topProducts: emergencyStats.topProducts || []
        });
        
        setRecentOrders(emergencyStats.recentOrders);
        
        // Set chart data
        setRevenueChartData({
          labels: emergencyStats.monthlyRevenue.map(item => item.month),
          datasets: [{
            label: 'Monthly Revenue',
            data: emergencyStats.monthlyRevenue.map(item => item.amount),
            fill: false,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4
          }]
        });
        
        setOrderStatusChartData({
          labels: emergencyStats.orderStatusDistribution.map(item => item.name),
          datasets: [{
            data: emergencyStats.orderStatusDistribution.map(item => item.value),
            backgroundColor: ['#4e73df', '#f6c23e', '#1cc88a', '#e74a3b'],
            borderWidth: 1
          }]
        });
        
        setIsEmergencyMode(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedYear]);

  // Format currency display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Order status badge
  const getStatusBadge = (status) => {
    const lowerStatus = String(status).toLowerCase();
    
    if (lowerStatus.includes('baru')) return <span className="badge bg-primary">Baru</span>;
    if (lowerStatus.includes('proses') || lowerStatus.includes('produksi')) return <span className="badge bg-warning">Proses</span>;
    if (lowerStatus.includes('siap') || lowerStatus.includes('selesai')) return <span className="badge bg-success">Selesai</span>;
    if (lowerStatus.includes('batal')) return <span className="badge bg-danger">Batal</span>;
    
    return <span className="badge bg-secondary">{status}</span>;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Container fluid>
      {isEmergencyMode && (
        <div className="alert alert-warning mb-4" role="alert">
          <strong>Info:</strong> Beberapa data sedang menggunakan mode darurat karena kesalahan server.
          Data yang ditampilkan mungkin tidak mencerminkan kondisi terbaru.
        </div>
      )}
      
      <h1 className="h3 mb-2 text-gray-800">Dashboard</h1>
      <p className="mb-4">Ringkasan aktivitas dan kinerja bisnis Anda.</p>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="border-left-primary h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Order
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.totalOrders}</div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-calendar fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-left-success h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-left-info h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Completed Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.completedOrders}</div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clipboard-check fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="border-left-warning h-100 py-2">
            <Card.Body>
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{stats.pendingOrders}</div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-comments fa-2x text-gray-300"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={8}>
          <Card className="mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Pendapatan Bulanan</h6>
              <div className="dropdown no-arrow">
                <select 
                  className="form-select form-select-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="chart-area">
                <Line data={revenueChartData} options={{ 
                  maintainAspectRatio: false, 
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          let label = context.dataset.label || '';
                          if (label) {
                            label += ': ';
                          }
                          if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              minimumFractionDigits: 0
                            }).format(context.parsed.y);
                          }
                          return label;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function(value) {
                          if (value >= 1000000) {
                            return 'Rp ' + (value / 1000000).toFixed(1) + ' Jt';
                          } else if (value >= 1000) {
                            return 'Rp ' + (value / 1000).toFixed(0) + ' Rb';
                          }
                          return 'Rp ' + value;
                        }
                      }
                    }
                  }
                }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header className="py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 font-weight-bold text-primary">Distribusi Status Order</h6>
            </Card.Header>
            <Card.Body>
              <div className="chart-pie pt-4 pb-2">
                <Doughnut data={orderStatusChartData} options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }} />
              </div>
              <div className="mt-4 text-center small">
                {orderStatusChartData.labels.map((label, index) => (
                  <span key={index} className="mr-2">
                    <i 
                      className="fas fa-circle" 
                      style={{ 
                        color: orderStatusChartData.datasets[0].backgroundColor[index % orderStatusChartData.datasets[0].backgroundColor.length] 
                      }}
                    ></i>{' '}
                    {label}
                  </span>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="mb-4">
            <Card.Header className="py-3">
              <h6 className="m-0 font-weight-bold text-primary">Order Terbaru</h6>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Tanggal</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order.id || Math.random()}>
                          <td>{order.order_number}</td>
                          <td>{order.customer_name}</td>
                          <td>{new Date(order.date).toLocaleDateString('id-ID')}</td>
                          <td>{formatCurrency(order.total)}</td>
                          <td>{getStatusBadge(order.status)}</td>
                          <td>
                            <Button 
                              variant="outline-primary" 
                              size="sm"
                              onClick={() => navigate(`/order/${order.id}`)}
                            >
                              Detail
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Tidak ada order terbaru.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <div className="d-grid gap-2">
            <Button variant="outline-primary" onClick={() => navigate('/form-input-order')}>
              Buat Order Baru
            </Button>
            <Button variant="outline-info" onClick={() => navigate('/produksi')}>
              Lihat Daftar Produksi
            </Button>
            <Button variant="outline-success" onClick={() => navigate('/keuangan/daftar-pembayaran')}>
              Kelola Pembayaran
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/laporan/order/harian')}>
              Lihat Laporan Harian
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;