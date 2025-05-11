import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaCalendarAlt, FaMoneyBillWave, FaChartLine, FaFileInvoiceDollar } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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

const DashboardAdminKeuangan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [keuanganData, setKeuanganData] = useState({
    pendapatan: 0,
    pengeluaran: 0,
    piutang: 0,
    profit: 0,
    transaksiTerbaru: []
  });

  // Format currency display
  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "Rp 0";
    }
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchKeuanganData = async () => {
      try {
        setLoading(true);
        
        // Simulasi data keuangan (ganti dengan API call sebenarnya)
        const transaksiData = [
          {
            id: 'TRX-001',
            tanggal: '2025-05-01',
            keterangan: 'Pembayaran Order #INV-20250501-0001',
            kategori: 'Pendapatan',
            jumlah: 3500000
          },
          {
            id: 'TRX-002',
            tanggal: '2025-05-01',
            keterangan: 'Pembelian Bahan Baku Akrilik',
            kategori: 'Pengeluaran',
            jumlah: -1200000
          },
          {
            id: 'TRX-003',
            tanggal: '2025-05-02',
            keterangan: 'Pembayaran Order #INV-20250502-0003',
            kategori: 'Pendapatan',
            jumlah: 2750000
          },
          {
            id: 'TRX-004',
            tanggal: '2025-05-02',
            keterangan: 'Biaya Operasional',
            kategori: 'Pengeluaran',
            jumlah: -500000
          }
        ];
        
        // Hitung total pendapatan, pengeluaran, dan profit
        let pendapatan = 0;
        let pengeluaran = 0;
        
        transaksiData.forEach(transaksi => {
          if (transaksi.jumlah > 0) {
            pendapatan += transaksi.jumlah;
          } else {
            pengeluaran += Math.abs(transaksi.jumlah);
          }
        });
        
        const profit = pendapatan - pengeluaran;
        
        setKeuanganData({
          pendapatan,
          pengeluaran,
          piutang: 1800000, // Contoh data piutang
          profit,
          transaksiTerbaru: transaksiData
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching keuangan data:', error);
        setLoading(false);
      }
    };
    
    fetchKeuanganData();
  }, []);

  const handleDateRangeChange = () => {
    // Implementasi filter berdasarkan tanggal
    console.log(`Filter dari ${startDate} sampai ${endDate}`);
    // Refresh data berdasarkan range tanggal
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading keuangan data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Dashboard Admin Keuangan</h2>
      
      {/* Date Range Filter */}
      <Card className="mb-4">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col>
              <h6 className="m-0 font-weight-bold">Filter Tanggal</h6>
            </Col>
            <Col md={8}>
              <Row>
                <Col md={5}>
                  <Form.Group>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaCalendarAlt />
                      </InputGroup.Text>
                      <DatePicker
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        className="form-control"
                        dateFormat="dd/MM/yyyy"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={1} className="text-center">
                  <span>s/d</span>
                </Col>
                <Col md={5}>
                  <Form.Group>
                    <InputGroup>
                      <InputGroup.Text>
                        <FaCalendarAlt />
                      </InputGroup.Text>
                      <DatePicker
                        selected={endDate}
                        onChange={date => setEndDate(date)}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        className="form-control"
                        dateFormat="dd/MM/yyyy"
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={1}>
                  <Button variant="primary" onClick={handleDateRangeChange}>
                    Filter
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card.Header>
      </Card>
      
      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3} className="mb-4">
          <Card className="border-left-success h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Total Pendapatan
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {formatCurrency(keuanganData.pendapatan)}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaMoneyBillWave size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="border-left-danger h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                    Total Pengeluaran
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {formatCurrency(keuanganData.pengeluaran)}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaFileInvoiceDollar size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="border-left-info h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Piutang
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {formatCurrency(keuanganData.piutang)}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaFileInvoiceDollar size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="border-left-primary h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Profit
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {formatCurrency(keuanganData.profit)}
                  </div>
                </Col>
                <Col xs="auto">
                  <FaChartLine size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Transaksi Terbaru */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="m-0 font-weight-bold">Transaksi Terbaru</h6>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => navigate('/keuangan/daftar-pembayaran')}
              >
                Lihat Semua
              </Button>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>ID Transaksi</th>
                      <th>Tanggal</th>
                      <th>Keterangan</th>
                      <th>Kategori</th>
                      <th>Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keuanganData.transaksiTerbaru.map((transaksi, index) => (
                      <tr key={index}>
                        <td>{transaksi.id}</td>
                        <td>{new Date(transaksi.tanggal).toLocaleDateString('id-ID')}</td>
                        <td>{transaksi.keterangan}</td>
                        <td>{transaksi.kategori}</td>
                        <td className={transaksi.jumlah > 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(transaksi.jumlah)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Quick Actions */}
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h6 className="m-0 font-weight-bold">Input Cepat</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/tools/input-pembayaran')}>
                  Input Pembayaran
                </Button>
                <Button variant="outline-success" onClick={() => navigate('/tools/export-laporan')}>
                  Export Laporan Keuangan
                </Button>
                <Button variant="outline-info" onClick={() => navigate('/dashboard/approval-pembayaran')}>
                  Approval Pembayaran
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/dashboard/pembelian-keuangan')}>
                  Input Pengeluaran
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card>
            <Card.Header>
              <h6 className="m-0 font-weight-bold">Laporan Keuangan</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/laporan/order/harian')}>
                  Laporan Harian
                </Button>
                <Button variant="outline-success" onClick={() => navigate('/laporan/order/bulanan')}>
                  Laporan Bulanan
                </Button>
                <Button variant="outline-info" onClick={() => navigate('/laporan/order/grafik')}>
                  Grafik Pendapatan
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/laporan/gabungan/bulanan')}>
                  Laporan Gabungan
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardAdminKeuangan;

