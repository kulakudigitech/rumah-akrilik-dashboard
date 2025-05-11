import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const LabelMassal = () => {
  const [orders, setOrders] = useState([]);
  const [tanggal, setTanggal] = useState("");
  const containerRef = useRef();

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Gagal ambil order:", err));
  }, []);

  const filtered = tanggal
    ? orders.filter(o => o.tanggal_order === tanggal)
    : [];

  const cetakSemua = () => {
    if (filtered.length === 0) return alert("Tidak ada data.");
    html2pdf().from(containerRef.current).save(`label-massal-${tanggal}.pdf`);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🏷️ Cetak Label Massal</h2>
      <label>
        Pilih Tanggal Order:
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>
      <br />
      <button style={{ marginTop: 10 }} onClick={cetakSemua}>🖨️ Cetak Semua</button>

      <div ref={containerRef} style={{ marginTop: 20 }}>
        {filtered.map((order) => (
          <div key={order.id} style={{ border: "1px dashed #000", padding: 20, width: 350, marginBottom: 20, pageBreakInside: "avoid" }}>
            <h3>📦 Rumah Akrilik</h3>
            <p><strong>Nama:</strong> {order.nama_customer}</p>
            <p><strong>HP:</strong> {order.nomor_hp}</p>
            <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
            <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LabelMassal;

