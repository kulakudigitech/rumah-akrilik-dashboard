import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardMarketingOffline = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/marketing/offline/performa/")
      .then(res => setData(res.data))
      .catch(err => console.error("Gagal ambil data marketing offline:", err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🏪 Dashboard Marketing Offline (Retail & CS Offline)</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="periode" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="jumlah_kunjungan" fill="#8884d8" name="Jumlah Kunjungan" />
          <Bar dataKey="closing_rate" fill="#82ca9d" name="Closing Rate (%)" />
          <Bar dataKey="total_order" fill="#ffc658" name="Total Order" />
        </BarChart>
      </ResponsiveContainer>

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Jumlah Kunjungan</th>
            <th>Closing Rate (%)</th>
            <th>Total Order</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.periode}</td>
              <td>{item.jumlah_kunjungan}</td>
              <td>{item.closing_rate}%</td>
              <td>{item.total_order}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardMarketingOffline;

