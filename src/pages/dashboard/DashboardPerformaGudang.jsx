import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardPerformaGudang = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/gudang/performa/")
      .then(res => setData(res.data))
      .catch(err => console.error("Gagal ambil data performa gudang:", err));
  }, []);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📊 Dashboard Analisis Performa Gudang</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="periode" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="barang_masuk" stroke="#8884d8" name="Barang Masuk" />
          <Line type="monotone" dataKey="barang_keluar" stroke="#82ca9d" name="Barang Keluar" />
          <Line type="monotone" dataKey="restok" stroke="#ffc658" name="Restok" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardPerformaGudang;

