import React, { useEffect, useState } from "react";
import axios from "axios";

const NotifikasiProduksiSelesai = () => {
  const [produksi, setProduksi] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/produksi/")
      .then(res => setProduksi(res.data.filter(p => p.tahap !== "selesai")))
      .catch(err => console.error(err));
  }, []);

  const selesaiProduksi = (item) => {
    axios.patch(`http://45.77.252.39:8001/api/produksi/${item.id}/`, { tahap: "selesai" })
      .then(() => {
        const pesan = encodeURIComponent(
          `Produksi untuk Order #${item.order} telah selesai.\nPIC: ${item.penanggung_jawab}\nTanggal: ${item.mulai}`
        );
        const waLink = `https://wa.me/?text=${pesan}`;
        window.open(waLink, "_blank");

        setProduksi(produksi.filter(p => p.id !== item.id));
      })
      .catch(err => console.error(err));
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🔔 Notifikasi Produksi Selesai ke WA</h2>
      {produksi.length === 0 ? <p>Tidak ada produksi yang sedang berjalan.</p> : null}

      <ul>
        {produksi.map(item => (
          <li key={item.id}>
            Order #{item.order} | Tahap: {item.tahap} | PIC: {item.penanggung_jawab}
            <button style={{ marginLeft: 10 }} onClick={() => selesaiProduksi(item)}>✅ Selesai & Kirim WA</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotifikasiProduksiSelesai;

