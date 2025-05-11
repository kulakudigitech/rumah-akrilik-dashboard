import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardKeuanganRealtime = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/keuangan/")
      .then(res => setData(res.data))
      .catch(err => console.error("Gagal ambil data keuangan:", err));
  }, []);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📉 Dashboard Laporan Keuangan Real-Time</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="bulan" />
          <YAxis />
          <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="omzet" stroke="#8884d8" name="Omzet" />
          <Line type="monotone" dataKey="profit" stroke="#82ca9d" name="Profit" />
          <Line type="monotone" dataKey="pengeluaran" stroke="#ffc658" name="Pengeluaran" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardKeuanganRealtime;

