import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const LabelPengiriman = () => {
  const [orders, setOrders] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [order, setOrder] = useState(null);
  const labelRef = useRef();

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Gagal ambil order:", err));
  }, []);

  useEffect(() => {
    if (selectedId) {
      axios.get(`http://45.77.252.39:8001/api/order/${selectedId}/`)
        .then(res => setOrder(res.data))
        .catch(err => console.error("Gagal ambil data order:", err));
    }
  }, [selectedId]);

  const cetakLabel = () => {
    if (!order) return;
    html2pdf().from(labelRef.current).save(`label-${order.nama_customer}.pdf`);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🏷️ Cetak Label Pengiriman</h2>
      <label>
        Pilih Order ID:
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">-- Pilih --</option>
          {orders.map(o => (
            <option key={o.id} value={o.id}>
              #{o.id} - {o.nama_customer}
            </option>
          ))}
        </select>
      </label>

      {order && (
        <>
          <div ref={labelRef} style={{ border: "1px dashed #000", padding: 20, width: 400, marginTop: 20 }}>
            <h3 style={{ marginBottom: 10 }}>📦 Rumah Akrilik</h3>
            <p><strong>Nama:</strong> {order.nama_customer}</p>
            <p><strong>HP:</strong> {order.nomor_hp}</p>
            <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
            <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
          </div>
          <button onClick={cetakLabel} style={{ marginTop: 10 }}>🖨️ Cetak Label</button>
        </>
      )}
    </div>
  );
};

export default LabelPengiriman;

