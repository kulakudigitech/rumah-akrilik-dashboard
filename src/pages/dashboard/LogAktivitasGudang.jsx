import React, { useEffect, useState } from "react";
import axios from "axios";

const LogAktivitasGudang = () => {
  const [logs, setLogs] = useState([]);
  const [tanggal, setTanggal] = useState("");

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/gudang/log-aktivitas/")
      .then(res => setLogs(res.data))
      .catch(err => console.error("Gagal ambil log aktivitas:", err));
  }, []);

  const filteredLogs = logs.filter(log => !tanggal || log.tanggal === tanggal);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📋 Log Aktivitas Gudang Otomatis</h2>

      <label>Filter Tanggal:</label>
      <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />

      {filteredLogs.length === 0 ? <p>Tidak ada aktivitas pada tanggal ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Tanggal & Waktu</th>
            <th>Jenis Aktivitas</th>
            <th>Nama Barang</th>
            <th>Jumlah</th>
            <th>Gudang</th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map(log => (
            <tr key={log.id}>
              <td>{log.tanggal_waktu}</td>
              <td>{log.jenis_transaksi}</td>
              <td>{log.nama_barang}</td>
              <td>{log.jumlah}</td>
              <td>{log.gudang}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogAktivitasGudang;

