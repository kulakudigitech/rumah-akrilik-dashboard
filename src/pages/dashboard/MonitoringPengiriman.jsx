import React, { useEffect, useState } from "react";
import axios from "axios";

const MonitoringPengiriman = () => {
  const [pengiriman, setPengiriman] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/pengiriman/")
      .then(res => setPengiriman(res.data))
      .catch(err => console.error("Gagal ambil data pengiriman:", err));
  }, []);

  const kirimNotifikasiWA = (item) => {
    const nomor = item.nomor_hp?.replace(/^0/, "62");
    const pesan = encodeURIComponent(
      `Halo ${item.nama_customer}, status pengiriman produk Anda (${item.nama_produk}) saat ini adalah: ${item.status_pengiriman}. Terima kasih telah berbelanja di Rumah Akrilik!`
    );
    const waLink = `https://wa.me/${nomor}?text=${pesan}`;
    window.open(waLink, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🚚 Monitoring Status Pengiriman Real-Time</h2>

      {pengiriman.length === 0 ? <p>Tidak ada data pengiriman saat ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Order</th>
            <th>Customer</th>
            <th>Produk</th>
            <th>Status Pengiriman</th>
            <th>Notifikasi</th>
          </tr>
        </thead>
        <tbody>
          {pengiriman.map(item => (
            <tr key={item.id}>
              <td>#{item.order_id}</td>
              <td>{item.nama_customer}</td>
              <td>{item.nama_produk}</td>
              <td>{item.status_pengiriman}</td>
              <td>
                <button onClick={() => kirimNotifikasiWA(item)}>📲 Kirim WA</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitoringPengiriman;

