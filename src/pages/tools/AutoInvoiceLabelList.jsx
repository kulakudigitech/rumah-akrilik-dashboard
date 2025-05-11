import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const AutoInvoiceLabelList = () => {
  const [orders, setOrders] = useState([]);
  const refs = useRef({});
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const hariIni = res.data.filter(o => o.tanggal_order === today);
        setOrders(hariIni);
      })
      .catch(err => console.error("Gagal ambil order:", err));
  }, []);

  const downloadPDF = (order) => {
    html2pdf().from(refs.current[order.id]).save(`invoice-label-${order.nama_customer}.pdf`);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📄 Auto Generate Invoice + Label</h2>
      <p>Tanggal: {today}</p>

      {orders.length === 0 && <p>Tidak ada order hari ini.</p>}

      {orders.map(order => {
        const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);
        return (
          <div key={order.id} style={{ border: "1px solid #ccc", padding: 20, marginBottom: 30 }}>
            <button onClick={() => downloadPDF(order)}>⬇️ Download PDF</button>
            <div ref={el => (refs.current[order.id] = el)} style={{ background: "#fff", padding: 20, width: 600, marginTop: 10 }}>
              <h3>📋 Invoice</h3>
              <p><strong>Order ID:</strong> #{order.id}</p>
              <p><strong>Tanggal:</strong> {order.tanggal_order}</p>
              <p><strong>Customer:</strong> {order.nama_customer}</p>
              <p><strong>No HP:</strong> {order.nomor_hp}</p>
              <p><strong>Produk:</strong> {order.nama_produk}</p>
              <p><strong>Qty:</strong> {order.quantity}</p>
              <p><strong>Total:</strong> Rp {total.toLocaleString()}</p>

              <hr style={{ margin: "20px 0" }} />

              <h3>🏷️ Label</h3>
              <p><strong>Nama:</strong> {order.nama_customer}</p>
              <p><strong>HP:</strong> {order.nomor_hp}</p>
              <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
              <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AutoInvoiceLabelList;

