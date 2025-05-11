import React, { useEffect, useState } from "react";
import axios from "axios";

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log("OrderList component rendering");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get('/orders/');
        console.log('API Response:', response.data); // Tambahkan logging
        setOrders(response.data.results || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setError('Gagal mengambil data order');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p>Loading data...</p>;
  if (error) return <p>{error}</p>;

  console.log("Order data:", orders);
  orders.forEach(order => {
    Object.entries(order).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        console.log(`Object property found in order.${key}:`, value);
      }
    });
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2>?? Daftar Order</h2>
      <p>Debug: Found {orders.length} orders</p>
      {orders.length === 0 ? (
        <p>Belum ada order.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              {/* FIX: Make sure you're not rendering entire objects */}
              <strong>{order.nama_customer || "Tanpa Nama"}</strong> - {order.produk || "Produk tidak diketahui"} ({order.jumlah || 0}) -{" "}
              <em>{order.status || "Status tidak diketahui"}</em>
              
              {/* Remove any code that might be rendering an object directly */}
              {/* For example, if you have something like this: */}
              {/* WRONG: {order.category} */}
              {/* RIGHT: {order.category?.name || "No Category"} */}
              
              {/* Make sure nested objects are accessed with ? operator */}
              {order.sumber_order?.name && <span> - Source: {order.sumber_order?.name}</span>}
              
              {/* Render metadata correctly */}
              <div>{JSON.stringify(order.metadata)}</div>
              
              {/* Correctly render category name */}
              <div>{order.category?.name || "No Category"}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderList;
