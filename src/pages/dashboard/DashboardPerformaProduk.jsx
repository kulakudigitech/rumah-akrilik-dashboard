import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardPerformaProduk = () => {
  const [data, setData] = useState([]);
  const [bulan, setBulan] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const filtered = res.data.filter(o => o.tanggal_order.startsWith(bulan));
        const produkMap = {};

        filtered.forEach(o => {
          if (!produkMap[o.nama_produk]) {
            produkMap[o.nama_produk] = { nama_produk: o.nama_produk, totalQty: 0, totalOmzet: 0 };
          }
          produkMap[o.nama_produk].totalQty += o.quantity;
          produkMap[o.nama_produk].totalOmzet += (parseFloat(o.harga_produk) * o.quantity);
        });

        setData(Object.values(produkMap));
      })
      .catch(err => console.error("Gagal ambil data order:", err));
  }, [bulan]);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📈 Dashboard Performa Produk</h2>
      <label>
        Pilih Bulan:
        <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
      </label>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="nama_produk" />
          <YAxis />
          <Tooltip formatter={(value, name) => name === "totalOmzet" ? `Rp ${value.toLocaleString()}` : value} />
          <Legend />
          <Bar dataKey="totalQty" fill="#8884d8" name="Total Qty Terjual" />
          <Bar dataKey="totalOmzet" fill="#82ca9d" name="Total Omzet" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardPerformaProduk;

