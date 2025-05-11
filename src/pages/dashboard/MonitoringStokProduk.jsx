import React, { useEffect, useState } from "react";
import axios from "axios";

const MonitoringStokProduk = () => {
  const [stok, setStok] = useState([]);

  useEffect(() => {
    axios.get("/api/stok/")
      .then(res => setStok(res.data))
      .catch(err => console.error("Gagal ambil data stok:", err));
  }, []);

  const cekNotifikasiStok = (produk) => {
    if (produk.jumlah <= produk.minimal_stok) {
      const pesan = encodeURIComponent(`Stok produk ${produk.nama_produk} hampir habis (tersisa ${produk.jumlah} pcs). Harap segera restok.`);
      const waLink = `https://wa.me/?text=${pesan}`;
      window.open(waLink, "_blank");
    }
  };

  useEffect(() => {
    stok.forEach(produk => cekNotifikasiStok(produk));
  }, [stok]);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📦 Monitoring Stok Produk</h2>

      {stok.length === 0 ? <p>Tidak ada data stok.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Nama Produk</th>
            <th>Jumlah Stok</th>
            <th>Minimal Stok</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stok.map(produk => (
            <tr key={produk.id} style={{ backgroundColor: produk.jumlah <= produk.minimal_stok ? "#ffcccc" : "#ccffcc" }}>
              <td>{produk.nama_produk}</td>
              <td>{produk.jumlah} pcs</td>
              <td>{produk.minimal_stok} pcs</td>
              <td>{produk.jumlah <= produk.minimal_stok ? "⚠️ Segera Restok" : "✅ Aman"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitoringStokProduk;

