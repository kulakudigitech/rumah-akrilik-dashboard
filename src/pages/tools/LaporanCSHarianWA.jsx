import React, { useEffect, useState } from "react";
import axios from "axios";

const LaporanCSHarianWA = () => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const filtered = res.data.filter(o => o.tanggal_order === tanggal);
        const csMap = {};

        filtered.forEach(o => {
          const marketing = o.nama_marketing || "Tanpa CS";
          if (!csMap[marketing]) {
            csMap[marketing] = { marketing, totalLead: 0, totalClosing: 0 };
          }
          csMap[marketing].totalLead++;
          if (o.cara_pembayaran !== "") csMap[marketing].totalClosing++;
        });

        setReport(Object.values(csMap));
      })
      .catch(err => console.error("Gagal ambil data order:", err));
  }, [tanggal]);

  const kirimLaporanWA = () => {
    let pesan = `📊 Laporan Harian CS (${tanggal})\n\n`;

    report.forEach(r => {
      pesan += `CS: ${r.marketing}\nLead: ${r.totalLead}, Closing: ${r.totalClosing}\n\n`;
    });

    const waLink = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(waLink, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📲 Kirim Laporan Harian CS via WA</h2>
      <label>
        Tanggal Laporan:
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>

      {report.length === 0 && <p>Tidak ada data untuk tanggal ini.</p>}

      <ul>
        {report.map(r => (
          <li key={r.marketing}>
            CS: {r.marketing} | Lead: {r.totalLead} | Closing: {r.totalClosing}
          </li>
        ))}
      </ul>

      <button style={{ marginTop: 20 }} onClick={kirimLaporanWA}>📲 Kirim Laporan ke WA</button>
    </div>
  );
};

export default LaporanCSHarianWA;

