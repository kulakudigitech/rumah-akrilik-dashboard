import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const DashboardLaporanBarang = () => {
  const [transaksi, setTransaksi] = useState([]);
  const [tanggal, setTanggal] = useState("");
  const [gudang, setGudang] = useState("");

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/gudang/transaksi/")
      .then(res => setTransaksi(res.data))
      .catch(err => console.error("Gagal ambil data transaksi:", err));
  }, []);

  const filteredTransaksi = transaksi.filter(t =>
    (!tanggal || t.tanggal === tanggal) && (!gudang || t.gudang === gudang)
  );

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTransaksi);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Barang");
    XLSX.writeFile(wb, `laporan-barang-${tanggal || "all"}.xlsx`);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📋 Dashboard Laporan Barang Masuk & Keluar</h2>

      <label>Filter Tanggal:</label>
      <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />

      <label>Filter Gudang:</label>
      <input type="text" value={gudang} onChange={(e) => setGudang(e.target.value)} />

      <button onClick={exportToExcel}>📥 Export ke Excel</button>

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nama Barang</th>
            <th>Gudang</th>
            <th>Jenis Transaksi</th>
            <th>Jumlah</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransaksi.map(item => (
            <tr key={item.id}>
              <td>{item.tanggal}</td>
              <td>{item.nama_barang}</td>
              <td>{item.gudang}</td>
              <td>{item.jenis_transaksi}</td>
              <td>{item.jumlah}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardLaporanBarang;

