import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2pdf from "html2pdf.js";

const LaporanGabunganBulanan = () => {
  const [bulan, setBulan] = useState("");
  const [orders, setOrders] = useState([]);
  const [produksi, setProduksi] = useState([]);
  const [absensi, setAbsensi] = useState([]);
  const reportRef = useRef();

  const fetchData = async () => {
    try {
      const [o, p, a] = await Promise.all([
        axios.get("http://45.77.252.39:8001/api/order/"),
        axios.get("http://45.77.252.39:8001/api/produksi/"),
        axios.get("http://45.77.252.39:8001/api/absensi/")
      ]);
      setOrders(o.data);
      setProduksi(p.data);
      setAbsensi(a.data);
    } catch (err) {
      console.error("Gagal ambil data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filterByBulan = (list) => {
    return list.filter(item => {
      const date = new Date(item.tanggal_order || item.mulai || item.tanggal);
      const key = date.toLocaleString("default", { month: "short", year: "numeric" });
      return key === bulan;
    });
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filterByBulan(orders)), "Order");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filterByBulan(produksi)), "Produksi");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filterByBulan(absensi)), "Absensi");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `laporan-gabungan-${bulan}.xlsx`);
  };

  const cetakPDF = () => {
    html2pdf().from(reportRef.current).save(`laporan-gabungan-${bulan}.pdf`);
  };

  const kirimWA = () => {
    const orderCount = filterByBulan(orders).length;
    const produksiCount = filterByBulan(produksi).length;
    const absensiCount = filterByBulan(absensi).length;
    const omzet = filterByBulan(orders).reduce((sum, o) => {
      const total = parseFloat(o.harga_produk) * o.quantity + parseFloat(o.biaya_pasang) + parseFloat(o.biaya_survey);
      return sum + total;
    }, 0);

    const pesan = `📦 *Laporan Gabungan Bulanan - ${bulan}*\n\n` +
      `🛒 Order Masuk: ${orderCount}\n` +
      `🛠️ Produksi: ${produksiCount}\n` +
      `👥 Absensi: ${absensiCount}\n` +
      `💰 Omzet: Rp ${omzet.toLocaleString()}`;

    const link = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(link, "_blank");
  };

  const bulanList = [...new Set([...orders, ...produksi, ...absensi].map(item => {
    const d = new Date(item.tanggal_order || item.mulai || item.tanggal);
    return d.toLocaleString("default", { month: "short", year: "numeric" });
  }))];

  const orderCount = filterByBulan(orders).length;
  const produksiCount = filterByBulan(produksi).length;
  const absensiCount = filterByBulan(absensi).length;
  const omzet = filterByBulan(orders).reduce((sum, o) => {
    const total = parseFloat(o.harga_produk) * o.quantity + parseFloat(o.biaya_pasang) + parseFloat(o.biaya_survey);
    return sum + total;
  }, 0);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📦 Laporan Gabungan Bulanan</h2>
      <label>
        Pilih Bulan: {" "}
        <select value={bulan} onChange={(e) => setBulan(e.target.value)}>
          <option value="">-- Pilih Bulan --</option>
          {bulanList.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </label>

      {bulan && (
        <>
          <div style={{ marginTop: 10 }}>
            <button onClick={exportExcel} style={{ marginRight: 10 }}>📥 Export Excel</button>
            <button onClick={cetakPDF} style={{ marginRight: 10 }}>🖨️ Cetak PDF</button>
            <button onClick={kirimWA}>📲 Kirim WA</button>
          </div>

          <div ref={reportRef} style={{ marginTop: 20 }}>
            <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Jenis</th>
                  <th>Jumlah</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Order</td>
                  <td>{orderCount}</td>
                  <td>Jumlah order masuk</td>
                </tr>
                <tr>
                  <td>Produksi</td>
                  <td>{produksiCount}</td>
                  <td>Jumlah proses produksi</td>
                </tr>
                <tr>
                  <td>Absensi</td>
                  <td>{absensiCount}</td>
                  <td>Total entri absensi</td>
                </tr>
                <tr>
                  <td>Omzet</td>
                  <td colSpan={2}>Rp {omzet.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default LaporanGabunganBulanan;

