import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LaporanMingguanFull = () => {
  const [data, setData] = useState([]);
  const [grouped, setGrouped] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const reportRef = useRef();

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/produksi/")
      .then((res) => {
        setData(res.data);
        filterByDate(res.data);
      })
      .catch(err => console.error("Gagal ambil data produksi:", err));
  }, []);

  useEffect(() => {
    filterByDate(data);
  }, [startDate, endDate]);

  const filterByDate = (list) => {
    const filtered = list.filter(item => {
      if (!startDate || !endDate) return true;
      const mulai = new Date(item.mulai);
      return mulai >= new Date(startDate) && mulai <= new Date(endDate);
    });
    groupByUser(filtered);
  };

  const groupByUser = (list) => {
    const result = {};

    list.forEach(item => {
      const user = item.penanggung_jawab || "(Tidak Diisi)";
      const mulai = new Date(item.mulai);
      const selesai = new Date(item.selesai);
      const durasi = (selesai - mulai) / 1000 / 60 / 60; // jam

      if (!result[user]) {
        result[user] = {
          totalJam: 0,
          jumlahPekerjaan: 0,
          bonus: 0
        };
      }

      result[user].totalJam += durasi > 0 ? durasi : 0;
      result[user].jumlahPekerjaan += 1;
    });

    // hitung bonus (contoh: Rp 10.000 per pekerjaan)
    const finalData = Object.entries(result).map(([user, info]) => ({
      nama: user,
      jumlahPekerjaan: info.jumlahPekerjaan,
      totalJam: parseFloat(info.totalJam.toFixed(2)),
      bonus: info.jumlahPekerjaan * 10000
    }));

    setGrouped(finalData);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(grouped);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Mingguan");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, "laporan-mingguan.xlsx");
  };

  const kirimWA = () => {
    const pesan = grouped.map(item => `*${item.nama}*\n- Pekerjaan: ${item.jumlahPekerjaan}\n- Jam: ${item.totalJam} jam\n- Bonus: Rp ${item.bonus}`).join("\n\n");
    const finalText = encodeURIComponent(`📊 *Rekap Produksi Mingguan*\n\n${pesan}`);
    const waLink = `https://wa.me/?text=${finalText}`;
    window.open(waLink, "_blank");
  };

  const cetakPDF = () => {
    const element = reportRef.current;
    html2pdf().from(element).save("laporan-mingguan.pdf");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📊 Laporan Produksi Mingguan Lengkap</h2>

      <label>
        Dari: <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </label>
      <label style={{ marginLeft: 20 }}>
        Sampai: <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </label>

      <br />
      <button onClick={exportToExcel} style={{ marginTop: 10, marginRight: 10 }}>📥 Export Excel</button>
      <button onClick={cetakPDF} style={{ marginTop: 10, marginRight: 10 }}>🖨️ Cetak PDF</button>
      <button onClick={kirimWA} style={{ marginTop: 10 }}>📲 Kirim WA</button>

      <div ref={reportRef} style={{ marginTop: 20 }}>
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", marginTop: 20 }}>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jumlah Pekerjaan</th>
              <th>Total Jam Kerja</th>
              <th>Bonus (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map((item) => (
              <tr key={item.nama}>
                <td>{item.nama}</td>
                <td>{item.jumlahPekerjaan}</td>
                <td>{item.totalJam} jam</td>
                <td>Rp {item.bonus}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 40, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grouped} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="nama" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="jumlahPekerjaan" fill="#8884d8" name="Pekerjaan" />
              <Bar dataKey="totalJam" fill="#82ca9d" name="Jam Kerja" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LaporanMingguanFull;

