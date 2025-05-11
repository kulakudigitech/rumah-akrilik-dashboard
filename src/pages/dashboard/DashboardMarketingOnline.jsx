import React, { useEffect, useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardMarketingOnline = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/marketing/online/performa/")
      .then(res => setData(res.data))
      .catch(err => console.error("Gagal ambil data marketing online:", err));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>🎯 Dashboard Marketing Online (CS & Freelance)</h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="periode" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="lead_masuk" stroke="#8884d8" name="Lead Masuk" />
          <Line type="monotone" dataKey="closing_rate" stroke="#82ca9d" name="Closing Rate (%)" />
          <Line type="monotone" dataKey="roas" stroke="#ffc658" name="ROAS" />
        </LineChart>
      </ResponsiveContainer>

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Periode</th>
            <th>Lead Masuk</th>
            <th>Closing Rate (%)</th>
            <th>ROAS</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr key={idx}>
              <td>{item.periode}</td>
              <td>{item.lead_masuk}</td>
              <td>{item.closing_rate}%</td>
              <td>{item.roas}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardMarketingOnline;

