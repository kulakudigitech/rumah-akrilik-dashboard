import React, { useEffect, useState } from "react";
import axios from "axios";

const FeedbackCustomerWA = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/pengiriman/?status=terkirim")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Gagal ambil data pengiriman:", err));
  }, []);

  const kirimFeedbackWA = (order) => {
    const nomor = order.nomor_hp?.replace(/^0/, "62");
    const pesan = encodeURIComponent(
      `Halo ${order.nama_customer},\n\nTerima kasih sudah menerima produk ${order.nama_produk}. Mohon kesediaannya untuk memberikan feedback terhadap produk dan layanan kami, agar kami dapat terus meningkatkan kualitas layanan.\n\nTerima kasih atas waktunya! 🙏`);

    const waLink = `https://wa.me/${nomor}?text=${pesan}`;
    window.open(waLink, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📲 Feedback Otomatis Customer via WA</h2>

      {orders.length === 0 ? <p>Belum ada pesanan yang terkirim untuk dimintai feedback.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Order</th>
            <th>Customer</th>
            <th>Produk</th>
            <th>Feedback WA</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>#{order.order_id}</td>
              <td>{order.nama_customer}</td>
              <td>{order.nama_produk}</td>
              <td>
                <button onClick={() => kirimFeedbackWA(order)}>📲 Kirim WA</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FeedbackCustomerWA;

