import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ExportGabungan = () => {
  const [order, setOrder] = useState([]);
  const [produksi, setProduksi] = useState([]);
  const [absensi, setAbsensi] = useState([]);

  useEffect(() => {
    axios.get("order/").then((res) => setOrder(res.data));
    axios.get("produksi/").then((res) => setProduksi(res.data));
    axios.get("absensi/").then((res) => setAbsensi(res.data));
  }, []);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const ws1 = XLSX.utils.json_to_sheet(order);
    XLSX.utils.book_append_sheet(wb, ws1, "Order");

    const ws2 = XLSX.utils.json_to_sheet(produksi);
    XLSX.utils.book_append_sheet(wb, ws2, "Produksi");

    const ws3 = XLSX.utils.json_to_sheet(absensi);
    XLSX.utils.book_append_sheet(wb, ws3, "Absensi");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const fileData = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(fileData, "laporan-gabungan.xlsx");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📦 Export Gabungan: Order + Produksi + Absensi</h2>
      <button onClick={exportToExcel}>Download Excel Gabungan</button>
    </div>
  );
};

export default ExportGabungan;

