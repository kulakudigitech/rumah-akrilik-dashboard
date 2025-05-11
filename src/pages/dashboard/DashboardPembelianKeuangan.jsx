import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const DashboardPembelianKeuangan = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/pembelian-bahan-baku/")
      .then(res => {
        const monthlyData = {};

        res.data.forEach(item => {
          const bulan = item.tanggal_transaksi.slice(0, 7);
          if (!monthlyData[bulan]) {
            monthlyData[bulan] = { bulan, totalBelanja: 0 };
          }
          item.produk.forEach(produk => {
            monthlyData[bulan].totalBelanja += (produk.kuantitas * produk.harga);
          });
        });

        setData(Object.values(monthlyData));
      })
      .catch(err => console.error("Gagal ambil data pembelian:", err));
  }, []);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📊 Dashboard Monitoring Pembelian Bahan Baku & Keuangan</h2>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="bulan" />
          <YAxis />
          <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="totalBelanja" fill="#8884d8" name="Total Belanja Bahan Baku" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardPembelianKeuangan;

