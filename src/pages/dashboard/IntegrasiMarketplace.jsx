import React, { useEffect, useState } from "react";
import axios from "axios";

const IntegrasiMarketplace = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    axios.get("/api/marketplace-orders/")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Gagal ambil data marketplace:", err));
  }, []);

  const integrasiOrder = (order) => {
    axios.post("/api/order/", order)
      .then(() => alert(`Order #${order.id_marketplace} berhasil diintegrasikan.`))
      .catch(err => console.error("Gagal integrasi order:", err));
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>?? Integrasi Otomatis Marketplace & E-commerce</h2>

      {orders.length === 0 ? <p>Tidak ada order dari marketplace saat ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Marketplace</th>
            <th>Customer</th>
            <th>Produk</th>
            <th>Platform</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id_marketplace}>
              <td>{order.id_marketplace}</td>
              <td>{order.nama_customer}</td>
              <td>{order.nama_produk}</td>
              <td>{order.platform}</td>
              <td>
                <button onClick={() => integrasiOrder(order)}>?? Integrasi ke Sistem</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default IntegrasiMarketplace;

