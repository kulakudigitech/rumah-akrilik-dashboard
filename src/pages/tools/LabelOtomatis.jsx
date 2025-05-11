import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const LabelOtomatis = () => {
  const [orders, setOrders] = useState([]);
  const [showOnlyUnprinted, setShowOnlyUnprinted] = useState(false);
  const labelRefs = useRef({});
  const today = new Date().toISOString().split("T")[0];

  const fetchOrders = () => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const hariIni = res.data.filter(o => o.tanggal_order === today);
        setOrders(hariIni);
      })
      .catch(err => console.error("Gagal ambil order:", err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const cetakLabel = (order) => {
    const element = labelRefs.current[order.id];
    html2pdf().set({
      margin: 0,
      filename: `label-${order.nama_customer}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: [90, 38], orientation: "landscape" }
    }).from(element).save();

    axios.patch(`http://45.77.252.39:8001/api/order/${order.id}/`, { label_dicetak: true })
      .then(() => fetchOrders())
      .catch(err => console.error("Gagal update status label:", err));
  };

  const filteredOrders = showOnlyUnprinted
    ? orders.filter(o => !o.label_dicetak)
    : orders;

  return (
    <div style={{ marginTop: 40 }}>
      <h2>⚡ Auto Label Order Hari Ini ({today})</h2>

      <label>
        <input
          type="checkbox"
          checked={showOnlyUnprinted}
          onChange={(e) => setShowOnlyUnprinted(e.target.checked)}
        /> Hanya tampilkan yang belum dicetak
      </label>

      {filteredOrders.length === 0 && <p>Tidak ada data untuk ditampilkan.</p>}

      {filteredOrders.map(order => (
        <div key={order.id} style={{ border: "1px dashed #000", padding: 10, width: 340, marginBottom: 20, background: order.label_dicetak ? "#e0ffe0" : "#fff" }}>
          <div ref={el => (labelRefs.current[order.id] = el)} style={{ fontSize: "12px", width: 340 }}>
            <h4>📦 Rumah Akrilik</h4>
            <p><strong>Nama:</strong> {order.nama_customer}</p>
            <p><strong>HP:</strong> {order.nomor_hp}</p>
            <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
            <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
          </div>
          <button
            onClick={() => cetakLabel(order)}
            disabled={order.label_dicetak}
            style={{ marginTop: 10 }}
          >
            🖨️ {order.label_dicetak ? "Sudah Dicetak" : "Cetak Label"}
          </button>
        </div>
      ))}
    </div>
  );
};

export default LabelOtomatis;

