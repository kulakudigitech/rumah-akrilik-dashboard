import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExportProduksi = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [tanggal, setTanggal] = useState("");
  const [tahap, setTahap] = useState("");

  useEffect(() => {
    axios.get("produksi/")
      .then((res) => {
        setData(res.data);
        setFiltered(res.data);
      })
      .catch((err) => console.error("Gagal ambil data produksi:", err));
  }, []);

  useEffect(() => {
    const result = data.filter(item => {
      const tglMulai = new Date(item.mulai).toISOString().split("T")[0];
      const cocokTanggal = tanggal ? tglMulai === tanggal : true;
      const cocokTahap = tahap ? item.tahap === tahap : true;
      return cocokTanggal && cocokTahap;
    });
    setFiltered(result);
  }, [tanggal, tahap, data]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produksi Filter");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, "produksi-filter.xlsx");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📤 Export Produksi Berdasarkan Tanggal & Tahapan</h2>

      <label>
        Tanggal Mulai:{" "}
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>

      <label style={{ marginLeft: 20 }}>
        Tahapan:{" "}
        <select value={tahap} onChange={(e) => setTahap(e.target.value)}>
          <option value="">Semua</option>
          <option value="desain">Desain</option>
          <option value="laser">Laser</option>
          <option value="finishing">Finishing</option>
          <option value="qc">QC</option>
          <option value="packing">Packing</option>
        </select>
      </label>

      <br />
      <button style={{ marginTop: 10 }} onClick={exportToExcel}>Download Filter Excel</button>
    </div>
  );
};

export default ExportProduksi;

