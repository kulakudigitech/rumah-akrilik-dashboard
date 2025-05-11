import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExportAbsensi = () => {
  const [absensi, setAbsensi] = useState([]);
  const [tanggal, setTanggal] = useState("");

  useEffect(() => {
    axios.get("absensi/")
      .then(res => setAbsensi(res.data))
      .catch(err => console.error("Gagal ambil data absensi:", err));
  }, []);

  const filtered = tanggal
    ? absensi.filter(item => item.tanggal === tanggal)
    : absensi;

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Absensi");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, "data-absensi.xlsx");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📋 Export Absensi Pegawai</h2>
      <label>
        Tanggal:{" "}
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>
      <br />
      <button style={{ marginTop: 10 }} onClick={exportToExcel}>
        Download Absensi Excel
      </button>
    </div>
  );
};

export default ExportAbsensi;

