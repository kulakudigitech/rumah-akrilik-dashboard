import React, { useEffect, useState } from "react";
import axios from "axios";

const LogAktivitasRealTime = () => {
  const [logs, setLogs] = useState([]);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/log-aktivitas/")
      .then(res => {
        const filtered = res.data.filter(log => log.tanggal === tanggal);
        setLogs(filtered);
      })
      .catch(err => console.error("Gagal ambil data log aktivitas:", err));
  }, [tanggal]);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📋 Log Aktivitas CS & Produksi Real-Time</h2>
      <label>
        Pilih Tanggal:
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>

      {logs.length === 0 ? <p>Tidak ada aktivitas pada tanggal ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Waktu</th>
            <th>Divisi</th>
            <th>User</th>
            <th>Aktivitas</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.waktu}</td>
              <td>{log.divisi}</td>
              <td>{log.user}</td>
              <td>{log.aktivitas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LogAktivitasRealTime;

