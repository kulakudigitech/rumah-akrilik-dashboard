import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const ExportLaporanExcel = () => {
  const [periode, setPeriode] = useState("");

  const exportExcel = () => {
    axios.get(`http://45.77.252.39:8001/api/laporan/?periode=${periode}`)
      .then(res => {
        const worksheet = XLSX.utils.json_to_sheet(res.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
        XLSX.writeFile(workbook, `laporan-${periode}.xlsx`);
      })
      .catch(err => console.error("Gagal export laporan:", err));
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📥 Export Laporan Otomatis ke Excel</h2>
      <label>
        Pilih Periode:
        <select value={periode} onChange={(e) => setPeriode(e.target.value)}>
          <option value="">-- Pilih Periode --</option>
          <option value="harian">Harian</option>
          <option value="mingguan">Mingguan</option>
          <option value="bulanan">Bulanan</option>
        </select>
      </label>
      <button style={{ marginLeft: 10 }} onClick={exportExcel}>📥 Export ke Excel</button>
    </div>
  );
};

export default ExportLaporanExcel;

