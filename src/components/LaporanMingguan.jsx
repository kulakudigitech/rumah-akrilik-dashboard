import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Card, Container, Form, Button, Table, Spinner, Alert } from 'react-bootstrap';

// Buat instance axios dengan baseURL dan interceptor
const api = axios.create({
  baseURL: 'https://rumahakrilik.id/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Tambahkan interceptor untuk token
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

// Helper untuk format tanggal
const formatDate = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date:", e);
    return null;
  }
};

const LaporanMingguan = () => {
  const [data, setData] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inisialisasi tanggal default (minggu ini)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay())); // Minggu
    const lastDay = new Date(today.setDate(today.getDate() + 6)); // Sabtu
    
    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(lastDay));
  }, []);

  // Fetch data produksi
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    api.get("/produksi/")
      .then((res) => {
        // Pastikan data adalah array
        const produksiData = Array.isArray(res.data) ? res.data : 
                             res.data?.results || [];
                             
        setData(produksiData);
        filterByDate(produksiData);
      })
      .catch(err => {
        console.error("Gagal ambil data produksi:", err);
        setError("Gagal mengambil data produksi. Silakan coba lagi nanti.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Filter data berdasarkan tanggal
  useEffect(() => {
    filterByDate(data);
  }, [startDate, endDate, data]);

  const filterByDate = (list) => {
    if (!Array.isArray(list)) {
      console.error("Data bukan array:", list);
      setGrouped({});
      return;
    }
    
    const filtered = list.filter(item => {
      if (!startDate || !endDate || !item.mulai) return true;
      
      try {
        const itemDate = new Date(item.mulai);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // Set jam ke 00:00:00 untuk start date
        startDateObj.setHours(0, 0, 0, 0);
        
        // Set jam ke 23:59:59 untuk end date untuk mencakup seluruh hari
        endDateObj.setHours(23, 59, 59, 999);
        
        return itemDate >= startDateObj && itemDate <= endDateObj;
      } catch (e) {
        console.error("Error filtering date:", e);
        return false;
      }
    });
    
    groupByUser(filtered);
  };

  const groupByUser = (list) => {
    if (!Array.isArray(list)) {
      setGrouped({});
      return;
    }
    
    const result = {};

    list.forEach(item => {
      // Validasi data item
      if (!item) return;
      
      const user = item.penanggung_jawab || "(Tidak Diisi)";
      
      // Validasi tanggal
      if (!item.mulai || !item.selesai) {
        // Jika tidak ada tanggal, hitung hanya jumlah pekerjaan
        if (!result[user]) {
          result[user] = {
            totalJam: 0,
            jumlahPekerjaan: 0
          };
        }
        result[user].jumlahPekerjaan += 1;
        return;
      }
      
      try {
        const mulai = new Date(item.mulai);
        const selesai = new Date(item.selesai);
        
        // Validasi durasi
        if (isNaN(mulai.getTime()) || isNaN(selesai.getTime())) {
          console.warn("Invalid date for item:", item);
          return;
        }
        
        const durasi = (selesai - mulai) / 1000 / 60 / 60; // jam

        if (!result[user]) {
          result[user] = {
            totalJam: 0,
            jumlahPekerjaan: 0
          };
        }

        // Hanya tambahkan durasi positif
        result[user].totalJam += durasi > 0 ? durasi : 0;
        result[user].jumlahPekerjaan += 1;
      } catch (e) {
        console.error("Error processing item:", item, e);
      }
    });

    setGrouped(result);
  };

  // Export ke Excel
  const exportToExcel = () => {
    // Tambahkan judul laporan dengan rentang tanggal
    const title = startDate && endDate 
      ? `Laporan Produksi (${startDate} s/d ${endDate})`
      : `Laporan Produksi Mingguan`;
    
    const exportData = Object.entries(grouped).map(([user, info]) => ({
      "Nama": user,
      "Jumlah Pekerjaan": info.jumlahPekerjaan,
      "Total Jam Kerja": parseFloat(info.totalJam.toFixed(2)),
      "Rata-rata Jam/Pekerjaan": parseFloat((info.totalJam / (info.jumlahPekerjaan || 1)).toFixed(2))
    }));

    // Tambahkan baris total
    const totalPekerjaan = exportData.reduce((sum, row) => sum + row["Jumlah Pekerjaan"], 0);
    const totalJam = exportData.reduce((sum, row) => sum + row["Total Jam Kerja"], 0);
    
    exportData.push({
      "Nama": "TOTAL",
      "Jumlah Pekerjaan": totalPekerjaan,
      "Total Jam Kerja": parseFloat(totalJam.toFixed(2)),
      "Rata-rata Jam/Pekerjaan": parseFloat((totalJam / (totalPekerjaan || 1)).toFixed(2))
    });

    // Buat workbook dan worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    
    // Tambahkan judul laporan
    XLSX.utils.sheet_add_aoa(ws, [[title]], { origin: "A1" });
    
    // Set lebar kolom
    const colWidths = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Mingguan");
    
    // Ekspor ke file
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    
    // Nama file dengan tanggal
    const fileName = startDate && endDate 
      ? `laporan-produksi-${startDate}-sampai-${endDate}.xlsx`
      : `laporan-produksi-mingguan.xlsx`;
      
    saveAs(fileData, fileName);
  };

  // Kirim ke WhatsApp
  const kirimWA = () => {
    // Format tanggal untuk judul
    const dateRange = startDate && endDate 
      ? `(${startDate} s/d ${endDate})`
      : "";
    
    // Hitung total
    const totalPekerjaan = Object.values(grouped).reduce((sum, info) => sum + info.jumlahPekerjaan, 0);
    const totalJam = Object.values(grouped).reduce((sum, info) => sum + info.totalJam, 0);
    
    // Format pesan
    const pesan = Object.entries(grouped).map(([user, info]) => {
      return `*${user}*\n- Jumlah Pekerjaan: ${info.jumlahPekerjaan}\n- Total Jam: ${info.totalJam.toFixed(2)} jam`;
    }).join("\n\n");
    
    // Tambahkan total ke pesan
    const pesanDenganTotal = `${pesan}\n\n*TOTAL*\n- Jumlah Pekerjaan: ${totalPekerjaan}\n- Total Jam: ${totalJam.toFixed(2)} jam`;
    
    const finalText = encodeURIComponent(`📊 *Rekap Produksi ${dateRange}*\n\n${pesanDenganTotal}`);
    const waLink = `https://wa.me/?text=${finalText}`;
    window.open(waLink, "_blank");
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm">
        <Card.Body>
          <h2 className="mb-4">📊 Laporan Produksi Mingguan</h2>
          
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
              <div className="mt-2">
                <Button variant="outline-danger" size="sm" onClick={() => window.location.reload()}>
                  Refresh Halaman
                </Button>
              </div>
            </Alert>
          )}
          
          <Form className="mb-4">
            <div className="d-flex flex-wrap gap-3">
              <Form.Group>
                <Form.Label>Dari:</Form.Label>
                <Form.Control 
                  type="date" 
                  value={startDate || ''} 
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
              
              <Form.Group>
                <Form.Label>Sampai:</Form.Label>
                <Form.Control 
                  type="date" 
                  value={endDate || ''} 
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </div>
            
            <div className="d-flex gap-2 mt-3">
              <Button 
                variant="success" 
                onClick={exportToExcel} 
                disabled={loading || Object.keys(grouped).length === 0}
              >
                📤 Export ke Excel
              </Button>
              <Button 
                variant="primary" 
                onClick={kirimWA} 
                disabled={loading || Object.keys(grouped).length === 0}
              >
                📲 Kirim ke WhatsApp
              </Button>
            </div>
          </Form>
          
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Memuat data produksi...</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <Alert variant="info">
              Tidak ada data produksi untuk periode yang dipilih.
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr className="table-primary">
                  <th>Nama</th>
                  <th>Jumlah Pekerjaan</th>
                  <th>Total Jam Kerja</th>
                  <th>Rata-rata (Jam/Pekerjaan)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(grouped).map(([user, info]) => (
                  <tr key={user}>
                    <td>{user}</td>
                    <td className="text-center">{info.jumlahPekerjaan}</td>
                    <td>{info.totalJam.toFixed(2)} jam</td>
                    <td>
                      {(info.totalJam / (info.jumlahPekerjaan || 1)).toFixed(2)} jam
                    </td>
                  </tr>
                ))}
                {/* Baris Total */}
                <tr className="table-secondary fw-bold">
                  <td>TOTAL</td>
                  <td className="text-center">
                    {Object.values(grouped).reduce((sum, info) => sum + info.jumlahPekerjaan, 0)}
                  </td>
                  <td>
                    {Object.values(grouped).reduce((sum, info) => sum + info.totalJam, 0).toFixed(2)} jam
                  </td>
                  <td>
                    {(
                      Object.values(grouped).reduce((sum, info) => sum + info.totalJam, 0) /
                      (Object.values(grouped).reduce((sum, info) => sum + info.jumlahPekerjaan, 0) || 1)
                    ).toFixed(2)} jam
                  </td>
                </tr>
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LaporanMingguan;

