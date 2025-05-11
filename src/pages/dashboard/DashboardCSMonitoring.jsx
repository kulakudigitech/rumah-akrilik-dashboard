import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardCSMonitoring = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const csMap = {};
        res.data.forEach(o => {
          const marketing = o.nama_marketing || "Tanpa CS";
          if (!csMap[marketing]) {
            csMap[marketing] = { marketing, totalLead: 0, totalClosing: 0 };
          }
          csMap[marketing].totalLead++;
          if (o.cara_pembayaran !== "") csMap[marketing].totalClosing++;
        });

        const finalData = Object.values(csMap).map(cs => ({
          marketing: cs.marketing,
          totalLead: cs.totalLead,
          totalClosing: cs.totalClosing,
          closingRate: ((cs.totalClosing / cs.totalLead) * 100).toFixed(2)
        }));

        setData(finalData);
      })
      .catch(err => console.error("Gagal ambil data order:", err));
  }, []);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📊 Dashboard Monitoring CS</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="marketing" />
          <YAxis />
          <Tooltip formatter={(value, name) => name === "closingRate" ? `${value}%` : value} />
          <Legend />
          <Bar dataKey="totalLead" fill="#8884d8" name="Total Lead" />
          <Bar dataKey="totalClosing" fill="#82ca9d" name="Total Closing" />
          <Bar dataKey="closingRate" fill="#ffc658" name="Closing Rate (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardCSMonitoring;

