import React, { useEffect, useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const InvoiceMassal = () => {
  const [orders, setOrders] = useState([]);
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Gagal ambil data order:", err));
  }, []);

  const filtered = filterDate
    ? orders.filter(order => order.tanggal_order === filterDate)
    : orders;

  const generatePDF = (order) => {
    const container = document.createElement("div");
    container.innerHTML = `
      <div style="padding: 20px; font-family: Arial;">
        <h2>Invoice Order #${order.id}</h2>
        <p><strong>Tanggal:</strong> ${order.tanggal_order}</p>
        <p><strong>Customer:</strong> ${order.nama_customer}</p>
        <p><strong>Produk:</strong> ${order.nama_produk}</p>
        <p><strong>Qty:</strong> ${order.quantity}</p>
        <p><strong>Harga Produk:</strong> Rp ${order.harga_produk}</p>
        <p><strong>Biaya Pasang:</strong> Rp ${order.biaya_pasang}</p>
        <p><strong>Biaya Survey:</strong> Rp ${order.biaya_survey}</p>
        <p><strong>Total:</strong> Rp ${parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey)}</p>
        <p><strong>Pembayaran:</strong> ${order.cara_pembayaran}</p>
      </div>
    `;

    html2pdf().from(container).save(`invoice-order-${order.id}.pdf`);
  };

  const downloadSemua = () => {
    filtered.forEach(order => generatePDF(order));
  };

  const sendWA = (order) => {
    const nomor = order.nomor_hp?.replace(/^0/, "62");
    const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);
    const pesan = encodeURIComponent(`Halo ${order.nama_customer}, berikut rincian order Anda:\n\nProduk: ${order.nama_produk}\nQty: ${order.quantity}\nTotal: Rp ${total}\n\nTerima kasih!`);
    const link = `https://wa.me/${nomor}?text=${pesan}`;
    window.open(link, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📄 Cetak Massal Invoice</h2>

      <label>
        Tanggal: <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
      </label>

      <br />
      <button style={{ marginTop: 10 }} onClick={downloadSemua}>Download Semua PDF</button>

      <ul>
        {filtered.map(order => (
          <li key={order.id}>
            #{order.id} - {order.nama_customer} - {order.tanggal_order}
            <button style={{ marginLeft: 10 }} onClick={() => sendWA(order)}>Kirim ke WA</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvoiceMassal;

