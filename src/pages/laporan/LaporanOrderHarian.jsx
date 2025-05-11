import React, { useState, useEffect } from 'react';
import { Card, Container, Table, Row, Col, Form, Button, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaFileExport, FaPrint } from 'react-icons/fa';
import axios from 'axios';

// Buat konfigurasi API dengan baseURL dan header
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

const LaporanOrderHarian = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalOrders: 0, totalRevenue: 0, averageOrderValue: 0 });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Coba panggil API
      const response = await api.get(`/order/report/daily/?date=${date}`);
      
      // Proses data jika berhasil
      const data = response.data.results || [];
      setReportData(data);
      
      // Set summary data
      setSummary({
        totalOrders: response.data.total_orders || 0,
        totalRevenue: response.data.total_revenue || 0,
        averageOrderValue: response.data.average_order_value || 0
      });
      
    } catch (err) {
      console.error('Error fetching report data:', err);
      
      // Set error message
      if (err.response && err.response.status === 404) {
        setError('API endpoint tidak ditemukan. Data laporan belum tersedia.');
      } else {
        setError('Gagal mengambil data laporan. Silakan coba lagi.');
      }
      
      // Gunakan data dummy untuk development
      if (process.env.NODE_ENV === 'development') {
        const mockData = generateMockData(date);
        setReportData(mockData);
        
        // Hitung summary dari mock data
        const totalOrders = mockData.length;
        const totalRevenue = mockData.reduce((sum, order) => sum + order.total, 0);
        
        setSummary({
          totalOrders,
          totalRevenue,
          averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk generate data dummy
  const generateMockData = (date) => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `ORD-${date.replace(/-/g, '')}-${String(i + 1).padStart(3, '0')}`,
      customer_name: `Customer ${i + 1}`,
      time: `${Math.floor(Math.random() * 12 + 9)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
      items: Math.floor(Math.random() * 3) + 1,
      total: Math.floor(Math.random() * 900000) + 100000,
      status: ['Baru', 'Diproses', 'Siap Kirim', 'Dikirim', 'Selesai'][i % 5],
      payment_status: ['Belum Bayar', 'DP', 'Lunas'][i % 3],
    }));
  };

  // Format currency display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Handler untuk export laporan ke Excel/CSV
  const handleExport = () => {
    alert('Fitur export laporan akan segera tersedia');
    // Implementasi export ke Excel/CSV
  };

  // Handler untuk print laporan
  const handlePrint = () => {
    window.print();
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Laporan Order Harian</h2>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4}>
              <Form.Group className="mb-0">
                <Form.Label>Pilih Tanggal</Form.Label>
                <div className="d-flex">
                  <Form.Control 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                  />
                  <Button 
                    variant="primary" 
                    className="ms-2" 
                    onClick={fetchReportData}
                    disabled={loading}
                  >
                    {loading ? <Spinner size="sm" animation="border" /> : <FaCalendarAlt />}
                  </Button>
                </div>
              </Form.Group>
            </Col>
            <Col md={8} className="text-md-end mt-3 mt-md-0">
              <Button variant="outline-success" className="me-2" onClick={handleExport}>
                <FaFileExport className="me-1" /> Export
              </Button>
              <Button variant="outline-secondary" onClick={handlePrint}>
                <FaPrint className="me-1" /> Print
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="mb-3">{summary.totalOrders}</h3>
              <Card.Title>Total Order</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="mb-3">{formatCurrency(summary.totalRevenue)}</h3>
              <Card.Title>Total Pendapatan</Card.Title>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100">
            <Card.Body>
              <h3 className="mb-3">{formatCurrency(summary.averageOrderValue)}</h3>
              <Card.Title>Rata-rata Order</Card.Title>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          <h5 className="mb-3">Detail Orders {date}</h5>
          
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>ID Order</th>
                  <th>Waktu</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Pembayaran</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2 mb-0">Memuat data laporan...</p>
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <p className="mb-0">Tidak ada order pada tanggal ini.</p>
                    </td>
                  </tr>
                ) : (
                  reportData.map((order) => (
                    <tr key={order.id}>
                      <td>{order.id}</td>
                      <td>{order.time}</td>
                      <td>{order.customer_name}</td>
                      <td className="text-center">{order.items}</td>
                      <td>{formatCurrency(order.total)}</td>
                      <td>
                        <span className={`badge bg-${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

// Helper untuk mendapatkan warna status
const getStatusColor = (status) => {
  if (!status) return 'secondary';
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('selesai') || lowerStatus.includes('komplet')) return 'success';
  else if (lowerStatus.includes('produksi') || lowerStatus.includes('proses')) return 'info';
  else if (lowerStatus.includes('kirim') && !lowerStatus.includes('siap')) return 'warning';
  else if (lowerStatus.includes('siap')) return 'primary';
  else if (lowerStatus.includes('baru')) return 'danger';
  
  return 'secondary';
};

// Helper untuk mendapatkan warna status pembayaran
const getPaymentStatusColor = (status) => {
  if (!status) return 'secondary';
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes('lunas')) return 'success';
  else if (lowerStatus.includes('dp')) return 'warning';
  else if (lowerStatus.includes('belum')) return 'danger';
  
  return 'secondary';
};

export default LaporanOrderHarian;