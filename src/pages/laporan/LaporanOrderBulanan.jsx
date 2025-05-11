import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import { Container, Card, Table, Button, Form, Row, Col, Spinner, Alert } from "react-bootstrap";
import { FaFileExcel, FaFilePdf, FaWhatsapp, FaFilter, FaSync } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

const LaporanOrderBulanan = () => {
  const [orders, setOrders] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [useDummyData, setUseDummyData] = useState(false);
  const reportRef = useRef();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Selalu gunakan data dummy dalam mode development
      setUseDummyData(true);
      const dummyData = generateDummyMonthlyData(year);
      setMonthlyData(dummyData);
      setLoading(false);
    } else {
      fetchOrderData();
    }
  }, [year]);

  const fetchOrderData = () => {
    setLoading(true);
    setError(null);
    
    // Jika dalam mode dummy data, langsung gunakan data dummy
    if (useDummyData) {
      const dummyData = generateDummyMonthlyData(year);
      setMonthlyData(dummyData);
      setLoading(false);
      return;
    }
    
    api.get(`/order/report/monthly/?year=${year}`)
      .then(res => {
        const responseData = res.data;
        console.log('API Response:', responseData);
        
        // Variasi 1: Jika response adalah array langsung
        const data = Array.isArray(responseData) ? responseData : 
          // Variasi 2: Jika ada property results
          (responseData.results || 
           // Variasi 3: Format backend kustom
           (responseData.data || []));
        
        // Format data untuk tampilan
        const formattedData = processMonthlyData(data, year);
        setMonthlyData(formattedData);
      })
      .catch(err => {
        console.error('API Error:', err.response?.data || err.message);
        setError(`Gagal mengambil data laporan: ${err.response?.data?.error || err.message}`);
        
        // Otomatis gunakan data dummy saat development
        if (process.env.NODE_ENV === 'development') {
          console.log("Using dummy data for development");
          const dummyData = generateDummyMonthlyData(year);
          setMonthlyData(dummyData);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const processMonthlyData = (data, selectedYear) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const result = [];
    
    // Inisialisasi data untuk semua bulan
    for (let i = 0; i < 12; i++) {
      result.push({
        bulan: `${monthNames[i]} ${selectedYear}`,
        jumlahOrder: 0,
        omzet: 0
      });
    }
    
    // Update dengan data dari API
    if (Array.isArray(data)) {
      data.forEach(item => {
        // Coba berbagai format yang mungkin dari API
        let monthStr = '';
        let orderCount = 0;
        let revenue = 0;
        
        // Format 1: "month": "Jan 2025"
        if (item.month && typeof item.month === 'string') {
          monthStr = item.month;
        }
        
        // Format 2: separate month & year fields
        else if (item.month_name && item.year) {
          monthStr = `${item.month_name} ${item.year}`;
        }
        
        // Ambil data jumlah order & pendapatan
        orderCount = item.order_count || item.total_orders || 0;
        revenue = item.revenue || item.total_revenue || 0;
        
        // Cari bulan yang sesuai dan update
        const monthIndex = result.findIndex(m => m.bulan === monthStr);
        if (monthIndex !== -1) {
          result[monthIndex].jumlahOrder = orderCount;
          result[monthIndex].omzet = revenue;
        }
      });
    }
    
    return result;
  };

  const generateDummyMonthlyData = (selectedYear) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    
    return monthNames.map((month, index) => {
      // Buat pola data yang realistis
      const baseOrders = 10;
      const fluctuation = [0.8, 1.2, 1.0, 1.5, 2.0, 1.8, 1.0, 0.9, 1.3, 1.4, 1.6, 2.2];
      const orderCount = Math.floor(baseOrders * fluctuation[index]);
      
      // Hitung omzet berdasarkan jumlah order
      const avgOrderValue = 500000; // Rata-rata Rp 500.000 per order
      const variation = Math.random() * 0.4 + 0.8; // 80%-120% dari rata-rata
      const revenue = orderCount * avgOrderValue * variation;
      
      return {
        bulan: `${month} ${selectedYear}`,
        jumlahOrder: orderCount,
        omzet: Math.round(revenue)
      };
    });
  };

  const exportToExcel = () => {
    // Buat workbook baru
    const wb = XLSX.utils.book_new();
    
    // Buat worksheet dengan data
    const ws = XLSX.utils.json_to_sheet(
      monthlyData.map(item => ({
        'Bulan': item.bulan,
        'Jumlah Order': item.jumlahOrder,
        'Total Omzet (Rp)': item.omzet.toLocaleString('id-ID')
      }))
    );
    
    // Tambahkan worksheet ke workbook
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Bulanan");
    
    // Buat buffer Excel dan simpan sebagai file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, `laporan-order-bulanan-${year}.xlsx`);
  };

  const cetakPDF = () => {
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `laporan-order-bulanan-${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save();
  };

  const kirimWA = () => {
    // Buat pesan untuk WhatsApp
    const title = `?? *LAPORAN ORDER BULANAN ${year}*\n\n`;
    const data = monthlyData
      .filter(item => item.jumlahOrder > 0) // Hanya tampilkan bulan dengan order
      .map(item => 
        `*${item.bulan}*\n• Order: ${item.jumlahOrder}\n• Omzet: Rp ${item.omzet.toLocaleString('id-ID')}`
      )
      .join('\n\n');
    
    const total = {
      orders: monthlyData.reduce((sum, item) => sum + item.jumlahOrder, 0),
      omzet: monthlyData.reduce((sum, item) => sum + item.omzet, 0)
    };
    
    const summary = `\n\n*TOTAL TAHUN ${year}*\n• Total Order: ${total.orders}\n• Total Omzet: Rp ${total.omzet.toLocaleString('id-ID')}`;
    
    const pesan = title + data + summary;
    const link = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(link, "_blank");
  };

  // Format currency untuk display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 5; i <= currentYear; i++) {
    years.push(i);
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Laporan Order Bulanan</h2>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={4} className="mb-3 mb-md-0">
              <Form.Group>
                <Form.Label>Tahun</Form.Label>
                <div className="d-flex">
                  <Form.Select 
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                  >
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Form.Select>
                  <Button 
                    variant="primary" 
                    className="ms-2"
                    onClick={fetchOrderData}
                    disabled={loading}
                  >
                    <FaFilter className="me-1" /> Filter
                  </Button>
                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant={useDummyData ? "warning" : "outline-warning"}
                      size="sm" 
                      className="ms-2"
                      onClick={() => {
                        setUseDummyData(!useDummyData);
                        if (!useDummyData) {
                          const dummyData = generateDummyMonthlyData(year);
                          setMonthlyData(dummyData);
                          setError(null);
                        } else {
                          fetchOrderData();
                        }
                      }}
                    >
                      <FaSync className="me-1" /> {useDummyData ? "Data API" : "Data Dummy"}
                    </Button>
                  )}
                </div>
              </Form.Group>
            </Col>
            <Col md={8} className="text-md-end">
              <Button 
                variant="outline-success" 
                className="me-2" 
                onClick={exportToExcel}
                disabled={loading || !monthlyData.length}
              >
                <FaFileExcel className="me-1" /> Export Excel
              </Button>
              <Button 
                variant="outline-danger" 
                className="me-2" 
                onClick={cetakPDF}
                disabled={loading || !monthlyData.length}
              >
                <FaFilePdf className="me-1" /> Cetak PDF
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={kirimWA}
                disabled={loading || !monthlyData.length}
              >
                <FaWhatsapp className="me-1" /> Kirim WA
              </Button>
            </Col>
          </Row>
          <Row className="mt-2">
            <Col>
              {error && (
                <Alert variant="danger" className="mb-0 py-1">
                  <small>{error}</small>
                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-2"
                      onClick={() => {
                        setUseDummyData(true);
                        const dummyData = generateDummyMonthlyData(year);
                        setMonthlyData(dummyData);
                        setError(null);
                      }}
                    >
                      <small>Gunakan data dummy</small>
                    </Button>
                  )}
                </Alert>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <div ref={reportRef}>
        <Card className="mb-4">
          <Card.Body>
            <h4 className="mb-4 text-center">Rekap Order Bulanan Tahun {year}</h4>
            
            {loading ? (
              <div className="text-center p-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Memuat data laporan...</p>
              </div>
            ) : monthlyData.length === 0 ? (
              <Alert variant="info">
                Tidak ada data order untuk tahun {year}.
              </Alert>
            ) : (
              <>
                <div className="table-responsive">
                  <Table bordered striped>
                    <thead>
                      <tr className="bg-light">
                        <th>Bulan</th>
                        <th className="text-center">Jumlah Order</th>
                        <th className="text-end">Total Omzet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map(item => (
                        <tr key={item.bulan}>
                          <td>{item.bulan}</td>
                          <td className="text-center">{item.jumlahOrder}</td>
                          <td className="text-end">{formatCurrency(item.omzet)}</td>
                        </tr>
                      ))}
                      <tr className="table-active fw-bold">
                        <td>TOTAL</td>
                        <td className="text-center">
                          {monthlyData.reduce((sum, item) => sum + item.jumlahOrder, 0)}
                        </td>
                        <td className="text-end">
                          {formatCurrency(monthlyData.reduce((sum, item) => sum + item.omzet, 0))}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                
                <div className="mt-5" style={{ height: 400 }}>
                  <h5 className="text-center mb-4">Grafik Order Bulanan {year}</h5>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis dataKey="bulan" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === "omzet" ? formatCurrency(value) : value,
                          name === "omzet" ? "Omzet" : "Jumlah Order"
                        ]} 
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="jumlahOrder" 
                        fill="#8884d8" 
                        name="Jumlah Order" 
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="omzet" 
                        fill="#82ca9d" 
                        name="Omzet" 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default LaporanOrderBulanan;

