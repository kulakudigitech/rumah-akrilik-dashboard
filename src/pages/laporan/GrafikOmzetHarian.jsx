import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GrafikOmzetHarian = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => groupByDate(res.data))
      .catch(err => console.error("Gagal fetch order:", err));
  }, []);

  const groupByDate = (orders) => {
    const grouped = {};

    orders.forEach(order => {
      const tanggal = order.tanggal_order;
      const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);

      if (!grouped[tanggal]) {
        grouped[tanggal] = 0;
      }
      grouped[tanggal] += total;
    });

    const result = Object.entries(grouped).map(([tanggal, omzet]) => ({ tanggal, omzet }));
    setData(result);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📊 Grafik Omzet Harian</h2>
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="tanggal" />
            <YAxis />
            <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="omzet" fill="#82ca9d" name="Omzet" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrafikOmzetHarian;

