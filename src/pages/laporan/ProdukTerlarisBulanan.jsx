import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const ProdukTerlarisBulanan = () => {
  const [orders, setOrders] = useState([]);
  const [bulan, setBulan] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [ranking, setRanking] = useState([]);
  const reportRef = useRef();

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => setOrders(res.data))
      .catch(err => console.error("Gagal ambil order:", err));
  }, []);

  useEffect(() => {
    if (!bulan) return;
    const hasil = orders.filter(order => {
      const date = new Date(order.tanggal_order);
      const key = date.toLocaleString("default", { month: "short", year: "numeric" });
      return key === bulan;
    });
    setFiltered(hasil);
    hitungRanking(hasil);
  }, [bulan, orders]);

  const hitungRanking = (list) => {
    const map = {};
    list.forEach(order => {
      const nama = order.nama_produk || "(Tanpa Nama)";
      const qty = parseInt(order.quantity || 0);
      const total = parseFloat(order.harga_produk || 0) * qty;

      if (!map[nama]) {
        map[nama] = { nama, qty: 0, omzet: 0 };
      }

      map[nama].qty += qty;
      map[nama].omzet += total;
    });

    const sorted = Object.values(map).sort((a, b) => b.qty - a.qty);
    setRanking(sorted);
  };

  const semuaBulan = [...new Set(orders.map(o => {
    const d = new Date(o.tanggal_order);
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  }))];

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(ranking);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produk Terlaris");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, `produk-terlaris-${bulan}.xlsx`);
  };

  const cetakPDF = () => {
    html2pdf().from(reportRef.current).save(`produk-terlaris-${bulan}.pdf`);
  };

  const kirimWA = () => {
    const isi = ranking.map((item, i) => `#${i + 1} *${item.nama}*\nQty: ${item.qty}\nOmzet: Rp ${item.omzet.toLocaleString()}`).join("\n\n");
    const pesan = `🏆 *Produk Terlaris - ${bulan}*\n\n${isi}`;
    const link = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(link, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🏆 Produk Terlaris per Bulan</h2>

      <label>
        Pilih Bulan: {" "}
        <select value={bulan} onChange={(e) => setBulan(e.target.value)}>
          <option value="">-- Pilih --</option>
          {semuaBulan.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </label>

      {ranking.length > 0 && (
        <>
          <div style={{ marginTop: 10 }}>
            <button onClick={exportToExcel} style={{ marginRight: 10 }}>📥 Export Excel</button>
            <button onClick={cetakPDF} style={{ marginRight: 10 }}>🖨️ Cetak PDF</button>
            <button onClick={kirimWA}>📲 Kirim WA</button>
          </div>

          <div ref={reportRef} style={{ marginTop: 20 }}>
            <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Qty Terjual</th>
                  <th>Total Omzet</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, i) => (
                  <tr key={i}>
                    <td>{item.nama}</td>
                    <td>{item.qty}</td>
                    <td>Rp {item.omzet.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ height: 300, marginTop: 40 }}>
              <ResponsiveContainer>
                <BarChart data={ranking} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="nama" />
                  <YAxis />
                  <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="qty" fill="#8884d8" name="Qty" />
                  <Bar dataKey="omzet" fill="#82ca9d" name="Omzet" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProdukTerlarisBulanan;

