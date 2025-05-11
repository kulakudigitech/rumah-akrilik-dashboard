import React, { useEffect, useState } from "react";
import axios from "axios";
import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardReseller = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/marketing/reseller/performa/")
      .then(res => setData(res.data))
      .catch(err => console.error("Gagal ambil data reseller:", err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>📦 Dashboard Khusus Reseller</h2>

      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="periode" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area type="monotone" dataKey="total_order" stroke="#8884d8" fill="#8884d8" name="Total Order" />
          <Area type="monotone" dataKey="total_omset" stroke="#82ca9d" fill="#82ca9d" name="Total Omset" />
          <Area type="monotone" dataKey="komisi" stroke="#ffc658" fill="#ffc658" name="Komisi" />
        </AreaChart>
      </ResponsiveContainer>

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Total Order</th>
            <th>Total Omset</th>
            <th>Komisi (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.periode}</td>
              <td>{item.total_order}</td>
              <td>Rp {item.total_omset.toLocaleString()}</td>
              <td>Rp {item.komisi.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardReseller;

