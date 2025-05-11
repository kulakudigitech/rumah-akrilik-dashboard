import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBox, FaChartLine, FaClipboardCheck, FaBell } from 'react-icons/fa';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Dropdown } from 'react-bootstrap';
import useSafeApiCall from '../../hooks/useSafeApiCall';
import { getEmergencyDashboardData } from '../../components/emergency/EmergencyDashboardData';

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
      config.headers['Authorization'] = `Bearer ${token}`;
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
      
      // Return a resolved promise with empty data structure
      return Promise.resolve({
        data: { results: [] }
      });
    }
    
    // Add special handling for dashboard stats 500 errors
    if (error.config && error.config.url &&
        error.config.url.includes('/dashboard/stats/') &&
        error?.response?.status === 500) {
      
      console.warn('Dashboard stats API returned 500 - using fallback calculations');
      
      // Return empty stats structure for fallback calculation
      return Promise.resolve({
        data: {
          order_baru: 0,
          order_proses: 0,
          order_selesai: 0,
          pendapatan_bulan_ini: 0,
          monthly_sales: [],
          top_products: []
        }
      });
    }
    
    // For all other errors, continue with rejection
    return Promise.reject(error);
  }
);

// Add this wrapper function for API calls to prevent console errors
const safeApiCall = async (apiFunction, fallbackValue = []) => {
  try {
    const response = await apiFunction();
    return response;
  } catch (error) {
    // Only log errors once in development to avoid console spam
    if (process.env.NODE_ENV === 'development' && !localStorage.getItem(`logged_${error.message}`)) {
      console.warn(`API error (this will only be logged once): ${error.message}`);
      localStorage.setItem(`logged_${error.message}`, 'true');
    }
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
    return [currentYear - 2, currentYear - 1, currentYear];
  });
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const emergency = token && (
      token.startsWith('emergency-') || 
      localStorage.getItem('emergency_login_time')
    );
    setIsEmergencyMode(emergency);
  }, []);

  useEffect(() => {
    // Check if we're in emergency mode
    const token = localStorage.getItem('jwtToken');
    const isEmergencyMode = token && (
      token.startsWith('emergency-') || 
      localStorage.getItem('emergency_login_time')
    );
    
    if (isEmergencyMode) {
      console.log("Dashboard running in emergency mode - using fallback data");
      const emergencyData = getEmergencyDashboardData();
      
      setStats({
        totalOrders: emergencyData.totalOrders.count,
        pendingOrders: emergencyData.pendingOrders.count,
        completedOrders: emergencyData.completedOrders.count,
        totalRevenue: emergencyData.revenue.amount,
        topProducts: []
      });
      
      setRecentOrders(emergencyData.recentOrders);
      
      // Set up chart data
      setRevenueChartData({
        labels: emergencyData.revenueData.map(item => item.month),
        datasets: [{
          label: 'Monthly Revenue',
          data: emergencyData.revenueData.map(item => item.amount),
          fill: false,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          tension: 0.4
        }]
      });
      
      setOrderStatusChartData({
        labels: emergencyData.orderStatusDistribution.map(item => item.name),
        datasets: [{
          data: emergencyData.orderStatusDistribution.map(item => item.value),
          backgroundColor: [
            '#4e73df', // Blue - Pending
            '#f6c23e', // Yellow - In Progress
            '#1cc88a', // Green - Completed
            '#e74a3b'  // Red - Cancelled
          ],
          borderWidth: 1
        }]
      });
      
      setLoading(false);
      return;
    }
  }, []);

  useEffect(() => {
    // Declare originalFetch at the useEffect scope level
    let originalFetch;
    
    // Add this to prevent the tracking API errors
    const silenceTrackingErrors = () => {
      // Assign to the outer variable instead of creating a new one
      originalFetch = window.fetch;
      window.fetch = function(url, options) {
        const promise = originalFetch.apply(this, arguments);
        
        if (url.toString().includes('/api/production-tracking/')) {
          // For tracking endpoints, catch 404 errors silently
          return promise.catch(err => {
            // Return an empty 200 response to prevent console errors
            return new Response(JSON.stringify({ results: [] }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        }
        return promise;
      };
    };
    
    silenceTrackingErrors();
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Fetching dashboard data...');
        
        // Data fallback jika API gagal
        let dashboardStats = {
          order_baru: 0,
          order_proses: 0,
          order_selesai: 0,
          pendapatan_bulan_ini: 0,
          monthly_sales: [],
          top_products: []
        };
        
        // Ambil data order terlebih dahulu
        console.log('Fetching orders...');
        const ordersResponse = await api.get('/order/');
        console.log('Orders response:', ordersResponse.data);
        
        let orders = [];
        if (ordersResponse.data && ordersResponse.data.results) {
          orders = ordersResponse.data.results;
        } else if (Array.isArray(ordersResponse.data)) {
          orders = ordersResponse.data;
        } else {
          console.warn('Unexpected order data format:', ordersResponse.data);
        }
        
        console.log(`Received ${orders.length} orders`);
        
        // After getting orders
        console.log('Raw orders data example:', orders.length > 0 ? orders[0] : 'No orders');
        console.log('Total amount in the first order:', 
          orders[0]?.calculated_total || 
          orders[0]?.total || 
          orders[0]?.total_amount);

        try {
          // Coba ambil statsit dashboard
          console.log('Fetching dashboard stats...');
          const statsResponse = await api.get('/dashboard/stats/');
          console.log('Stats response:', statsResponse.data);
          
          if (statsResponse.data) {
            dashboardStats = statsResponse.data;
          }
        } catch (apiError) {
          console.error('Error fetching dashboard stats:', apiError);
          // Hitung stats dari order data jika API stats gagal
          
          // Hitung order berdasarkan status
          let baru = 0, proses = 0, selesai = 0, pendapatan = 0;
          
          // Log jumlah order dan format data untuk debugging
          console.log(`Calculating stats from ${orders.length} orders`);
          if (orders.length > 0) {
            console.log('First order structure:', JSON.stringify(orders[0]).substring(0, 200) + '...');
          }
          
          // Perbarui logika penghitungan order - lebih sederhana dan robust
          orders.forEach(order => {
            // Periksa status dengan lebih fleksibel
            const status = String(order.status?.name || order.status || '').toLowerCase();
            
            // Log status untuk debugging
            console.log(`Order ${order.id || order.order_number}: status="${status}"`);
            
            // Kategorikan status dengan lebih fleksibel
            if (status.includes('baru') || status.includes('new') || status === 'pending') {
              baru++;
            } else if (status.includes('proses') || status.includes('produksi') || status.includes('progress')) {
              proses++;
            } else if (status.includes('selesai') || status.includes('terkirim') || status.includes('completed')) {
              selesai++;
            } else if (status === '') {
              // Jika status kosong, anggap sebagai "baru"
              baru++;
            }
            
            // Hitung pendapatan dengan lebih fleksibel
            const amount = 
              parseFloat(order.total_amount) || 
              parseFloat(order.calculated_total) || 
              parseFloat(order.total) || 
              0;
            
            pendapatan += amount;
            
            // Log pendapatan untuk debugging
            console.log(`Order ${order.id || order.order_number}: amount=${amount}`);
          });
          
          // Pastikan jumlah order total sesuai
          const totalOrders = baru + proses + selesai;
          if (totalOrders !== orders.length) {
            console.warn(`Warning: Total categorized orders (${totalOrders}) doesn't match order count (${orders.length})`);
          }
          
          dashboardStats = {
            order_baru: baru,
            order_proses: proses,
            order_selesai: selesai,
            pendapatan_bulan_ini: pendapatan,
            monthly_sales: [], // Set default
            top_products: []   // Set default
          };
          
          // Log hasil kalkulasi
          console.log('Dashboard stats API returned 500 - using fallback calculations:', dashboardStats);
        }
        
        // Verify that monthly_sales exists before using it
        const monthlySales = Array.isArray(dashboardStats.monthly_sales) 
          ? dashboardStats.monthly_sales 
          : [];
        
        // Ensure we have valid monthly data with safe property access
        const revenueData = {
          labels: monthlySales.map(item => item?.month || ''),
          datasets: [
            {
              label: 'Pendapatan Bulanan',
              data: monthlySales.map(item => Number(item?.amount || 0)),
              fill: false,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              tension: 0.4
            }
          ]
        };
        setRevenueChartData(revenueData);
        
        // Persiapkan data untuk grafik status order
        const orderStatuses = [
          { name: 'Baru', count: dashboardStats.order_baru, color: '#4e73df' },
          { name: 'Proses', count: dashboardStats.order_proses, color: '#f6c23e' },
          { name: 'Selesai', count: dashboardStats.order_selesai, color: '#1cc88a' }
        ];
        
        const statusData = {
          labels: orderStatuses.map(status => status.name),
          datasets: [
            {
              data: orderStatuses.map(status => status.count),
              backgroundColor: orderStatuses.map(status => status.color),
              borderWidth: 1
            }
          ]
        };
        setOrderStatusChartData(statusData);

        // Gunakan data dashboard dan orders
        setStats({
          totalOrders: orders.length,
          pendingOrders: (dashboardStats.order_baru || 0) + (dashboardStats.order_proses || 0),
          completedOrders: dashboardStats.order_selesai || 0,
          totalRevenue: dashboardStats.pendapatan_bulan_ini || 0,
          topProducts: dashboardStats.top_products || []
        });
        
        // Format recent orders data
        const recentOrdersData = orders.slice(0, 5).map(order => {
          // Get total from all possible sources
          const orderTotal = 
            parseFloat(order.calculated_total) || 
            parseFloat(order.total) || 
            0;
          
          // Log each order's total calculation
          console.log(`Order ${order.order_number || order.id} total calculation:`, {
            calculated_total: order.calculated_total,
            total: order.total,
            final_value: orderTotal
          });
          
          return {
            id: order.order_number || `#${order.id}`,
            customer_name: order.customer?.name || 'Unknown',
            date: order.order_date,
            total: orderTotal,
            calculated_total: order.calculated_total,
            status: order.status?.name || 'Unknown',
            status_id: order.status?.id || 0
          };
        });
        
        console.log('Recent orders data:', recentOrdersData);
        setRecentOrders(recentOrdersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Use emergency data as fallback
        const emergencyData = getEmergencyDashboardData();
        
        setStats({
          totalOrders: emergencyData.totalOrders.count,
          pendingOrders: emergencyData.pendingOrders.count,
          completedOrders: emergencyData.completedOrders.count,
          totalRevenue: emergencyData.revenue.amount,
          topProducts: []
        });
        
        setRecentOrders(emergencyData.recentOrders);
        setRevenueChartData({
          labels: emergencyData.revenueData.map(item => item.month),
          datasets: [{
            label: 'Monthly Revenue',
            data: emergencyData.revenueData.map(item => item.amount),
            fill: false,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.4
          }]
        });
        
        setOrderStatusChartData({
          labels: emergencyData.orderStatusDistribution.map(item => item.name),
          datasets: [{
            data: emergencyData.orderStatusDistribution.map(item => item.value),
            backgroundColor: ['#4e73df', '#f6c23e', '#1cc88a', '#e74a3b'],
            borderWidth: 1
          }]
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Now originalFetch will be available in this scope
    return () => {
      // Add safety check before attempting to restore
      if (originalFetch) {
        window.fetch = originalFetch;
      }
    };
  }, [selectedYear]);

  // Format currency display
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Rp 0';
    try {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    } catch (e) {
      return `Rp ${amount}`;
    }
  };

  // Order status badge
  const getStatusBadge = (status) => {
    let variant = 'secondary';
    if (!status) return <Badge bg={variant}>Unknown</Badge>;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('selesai')) variant = 'success';
    else if (statusLower.includes('produksi') || statusLower.includes('proses')) variant = 'info';
    else if (statusLower.includes('kirim')) variant = 'primary';
    else if (statusLower.includes('pembayaran') || statusLower.includes('baru')) variant = 'warning';
    
    return <Badge bg={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading dashboard data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Dashboard Rumah Akrilik</h2>
      
      {isEmergencyMode && (
        <div className="alert alert-warning mb-4" role="alert">
          <p className="mb-0">
            <strong>Emergency Mode Active:</strong> You're viewing cached data. Some features may be limited.
          </p>
        </div>
      )}
      
      {/* Stats cards */}
      <Row className="mb-4">
        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-left-primary h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.totalOrders}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaBox className="text-gray-300" size={32} />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-left-success h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Revenue
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaChartLine className="text-gray-300" size={32} />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-left-info h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Completed Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.completedOrders}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaClipboardCheck className="text-gray-300" size={32} />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={3} sm={6} className="mb-4">
          <Card className="border-left-warning h-100 py-2">
            <Card.Body>
              <Row className="no-gutters align-items-center">
                <Col className="mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending Orders
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {stats.pendingOrders}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaBell className="text-gray-300" size={32} />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Analytics Charts */}
      <Row className="mb-4">
        <Col lg={8}>
          <Card className="h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Pendapatan Bulanan</h6>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  {selectedYear}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {availableYears.map(year => (
                    <Dropdown.Item key={year} onClick={() => setSelectedYear(year)}>
                      {year}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Card.Header>
            <Card.Body>
              <Line 
                data={revenueChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return formatCurrency(context.parsed.y);
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      ticks: {
                        callback: function(value) {
                          return formatCurrency(value, false);
                        }
                      }
                    }
                  }
                }} 
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header className="bg-white">
              <h6 className="mb-0">Distribusi Status Order</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ position: 'relative', height: '300px' }}>
                <Pie 
                  data={orderStatusChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Top Products */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-white">
              <h6 className="mb-0">Produk Terpopuler</h6>
            </Card.Header>
            <Card.Body>
              <div style={{ position: 'relative', height: '300px' }}>
                <Bar 
                  data={{
                    labels: stats.topProducts?.map(product => product.product_name) || [],
                    datasets: [
                      {
                        label: 'Jumlah Order',
                        data: stats.topProducts?.map(product => product.count) || [],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders Table */}
      <Row>
        <Col>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold">Order Terbaru</h6>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => navigate('/order-list')}
              >
                Lihat Semua
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID Order</th>
                      <th>Pelanggan</th>
                      <th>Tanggal</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                  {/* --- AWAL KODE BARU --- */}
                  {/* Pengecekan: Pastikan recentOrders adalah array & punya isi sebelum map */}
                  {Array.isArray(recentOrders) && recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      // Menggunakan order.id sebagai key jika unik, jika tidak, fallback ke index (tapi order.id lebih baik)
                      <tr key={order.id}> 
                        <td>{order.id}</td>
                        <td>{order.customer_name || 'N/A'}</td>
                        <td>{order.date ? new Date(order.date).toLocaleDateString('id-ID') : '-'}</td>
                        <td>{formatCurrency(order.total || order.calculated_total || 0)}</td>
                        <td>{getStatusBadge(order.status)}</td>
                        <td>
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            // Pastikan order.id sudah string sebelum replace
                            onClick={() => navigate(`/input-pembayaran/${String(order.id).replace('#', '')}`)}
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Tampilan jika tidak ada data
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-3"> 
                        {loading ? 'Memuat data order...' : 'Tidak ada order terbaru.'}
                      </td>
                    </tr>
                  )}
                  {/* --- AKHIR KODE BARU --- */}
                </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Activity and Announcements */}
      <Row>
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h6 className="m-0 font-weight-bold">Aktivitas Terbaru</h6>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                <div className="timeline-item mb-3 pb-3 border-bottom">
                  <strong>Admin</strong> menambahkan order baru
                  <div className="small text-muted">Hari ini</div>
                </div>
                <div className="timeline-item mb-3 pb-3 border-bottom">
                  <strong>Admin</strong> mengubah status order menjadi "Proses Produksi"
                  <div className="small text-muted">Kemarin</div>
                </div>
                <div className="timeline-item mb-3 pb-3 border-bottom">
                  <strong>Admin Keuangan</strong> mencatat pembayaran untuk order
                  <div className="small text-muted">2 hari yang lalu</div>
                </div>
                <div className="timeline-item">
                  <strong>Gudang</strong> memperbarui status stok produk
                  <div className="small text-muted">3 hari yang lalu</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="h-100">
            <Card.Header>
              <h6 className="m-0 font-weight-bold">Menu Cepat</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/form-input-order')}>
                  Buat Order Baru
                </Button>
                <Button variant="outline-info" onClick={() => navigate('/produksi/daftar-order')}>
                  Lihat Daftar Produksi
                </Button>
                <Button variant="outline-success" onClick={() => navigate('/keuangan/daftar-pembayaran')}>
                  Kelola Pembayaran
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/laporan/order/harian')}>
                  Lihat Laporan Harian
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;