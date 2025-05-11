import React, { useEffect, useState } from "react";
import axios from "axios";

const MonitoringStokGudang = () => {
  const [stok, setStok] = useState([]);

  useEffect(() => {
    axios.get("/api/gudang/stok/")
      .then(res => setStok(res.data))
      .catch(err => console.error("Gagal ambil data stok:", err));
  }, []);

  const kirimNotifikasi = (item) => {
    if (item.jumlah <= item.minimal_stok) {
      const pesan = encodeURIComponent(
        `⚠️ Peringatan stok! Barang ${item.nama_barang} tinggal ${item.jumlah} pcs di gudang ${item.gudang}. Segera lakukan restok.`
      );
      const waLink = `https://wa.me/?text=${pesan}`;
      window.open(waLink, "_blank");
    }
  };

  useEffect(() => {
    stok.forEach(item => kirimNotifikasi(item));
  }, [stok]);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📦 Monitoring Stok Gudang Real-Time</h2>

      {stok.length === 0 ? <p>Belum ada data stok di gudang.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Nama Barang</th>
            <th>Gudang</th>
            <th>Jumlah Stok</th>
            <th>Minimal Stok</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stok.map(item => (
            <tr key={item.id}>
              <td>{item.nama_barang}</td>
              <td>{item.gudang}</td>
              <td>{item.jumlah} pcs</td>
              <td>{item.minimal_stok} pcs</td>
              <td>{item.jumlah <= item.minimal_stok ? "⚠️ Stok Rendah" : "✅ Aman"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitoringStokGudang;
