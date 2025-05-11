import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const InvoiceLabelCombo = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const comboRef = useRef();

  useEffect(() => {
    axios.get(`http://45.77.252.39:8001/api/order/${orderId}/`)
      .then(res => setOrder(res.data))
      .catch(err => console.error("Gagal ambil data order:", err));
  }, [orderId]);

  const downloadPDF = () => {
    html2pdf().from(comboRef.current).save(`invoice-label-${order.nama_customer}.pdf`);
  };

  const kirimWhatsApp = () => {
    const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);
    const pesan = `📋 *Invoice & Label Pengiriman*\n\n*Customer*: ${order.nama_customer}\n*No HP*: ${order.nomor_hp}\n*Alamat*: ${order.alamat_jalan}, ${order.kelurahan}, ${order.kecamatan}, ${order.kota}\n*Produk*: ${order.nama_produk}\n*Qty*: ${order.quantity}\n*Total*: Rp ${total.toLocaleString()}\n\nTerima kasih atas ordernya! 🙏😊`;
    const url = `https://wa.me/${order.nomor_hp}?text=${encodeURIComponent(pesan)}`;
    window.open(url, "_blank");
  };

  if (!order) return <p>Loading...</p>;

  const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📑 Invoice + Label</h2>
      <button onClick={downloadPDF}>⬇️ Download Gabungan PDF</button>
      <button style={{ marginLeft: 10 }} onClick={kirimWhatsApp}>📲 Kirim ke WhatsApp</button>

      <div ref={comboRef} style={{ background: "#fff", padding: 20, width: 600, marginTop: 20 }}>
        {/* Invoice */}
        <h3>📋 Invoice</h3>
        <p><strong>Order ID:</strong> #{order.id}</p>
        <p><strong>Tanggal:</strong> {order.tanggal_order}</p>
        <p><strong>Customer:</strong> {order.nama_customer}</p>
        <p><strong>No HP:</strong> {order.nomor_hp}</p>
        <p><strong>Produk:</strong> {order.nama_produk}</p>
        <p><strong>Qty:</strong> {order.quantity}</p>
        <p><strong>Harga Produk:</strong> Rp {order.harga_produk}</p>
        <p><strong>Biaya Pasang:</strong> Rp {order.biaya_pasang}</p>
        <p><strong>Biaya Survey:</strong> Rp {order.biaya_survey}</p>
        <p><strong>Total:</strong> Rp {total.toLocaleString()}</p>
        <p><strong>Pembayaran:</strong> {order.cara_pembayaran}</p>

        <hr style={{ margin: "30px 0" }} />

        {/* Label */}
        <h3>🏷️ Label Pengiriman</h3>
        <p><strong>Nama:</strong> {order.nama_customer}</p>
        <p><strong>HP:</strong> {order.nomor_hp}</p>
        <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
        <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
      </div>
    </div>
  );
};

export default InvoiceLabelCombo;

