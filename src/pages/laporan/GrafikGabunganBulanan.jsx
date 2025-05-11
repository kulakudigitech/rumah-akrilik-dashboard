import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const GrafikGabunganBulanan = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [o, p, a] = await Promise.all([
          axios.get("http://45.77.252.39:8001/api/order/"),
          axios.get("http://45.77.252.39:8001/api/produksi/"),
          axios.get("http://45.77.252.39:8001/api/absensi/")
        ]);
        generateGraph(o.data, p.data, a.data);
      } catch (err) {
        console.error("Gagal ambil data:", err);
      }
    };
    fetchAll();
  }, []);

  const generateGraph = (orders, produksi, absensi) => {
    const map = {};

    const getKey = (date) => new Date(date).toLocaleString("default", { month: "short", year: "numeric" });

    orders.forEach(o => {
      const key = getKey(o.tanggal_order);
      const total = parseFloat(o.harga_produk) * o.quantity + parseFloat(o.biaya_pasang) + parseFloat(o.biaya_survey);
      if (!map[key]) map[key] = { bulan: key, order: 0, produksi: 0, absensi: 0, omzet: 0 };
      map[key].order++;
      map[key].omzet += total;
    });

    produksi.forEach(p => {
      const key = getKey(p.mulai);
      if (!map[key]) map[key] = { bulan: key, order: 0, produksi: 0, absensi: 0, omzet: 0 };
      map[key].produksi++;
    });

    absensi.forEach(a => {
      const key = getKey(a.tanggal);
      if (!map[key]) map[key] = { bulan: key, order: 0, produksi: 0, absensi: 0, omzet: 0 };
      map[key].absensi++;
    });

    const result = Object.values(map).sort((a, b) => new Date("1 " + a.bulan) - new Date("1 " + b.bulan));
    setData(result);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📊 Grafik Gabungan Kinerja Bulanan</h2>
      <div style={{ height: 400, width: "100%" }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="bulan" />
            <YAxis />
            <Tooltip formatter={(value, name) => name === 'omzet' ? `Rp ${value.toLocaleString()}` : value} />
            <Legend />
            <Bar dataKey="order" fill="#8884d8" name="Order" />
            <Bar dataKey="produksi" fill="#82ca9d" name="Produksi" />
            <Bar dataKey="absensi" fill="#ffc658" name="Absensi" />
            <Bar dataKey="omzet" fill="#ff8042" name="Omzet" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GrafikGabunganBulanan;

