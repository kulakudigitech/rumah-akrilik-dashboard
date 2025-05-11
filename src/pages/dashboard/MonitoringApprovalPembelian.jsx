import React, { useEffect, useState } from "react";
import axios from "axios";

const MonitoringApprovalPembelian = () => {
  const [pembelian, setPembelian] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/pembelian-bahan-baku/?status=pending")
      .then(res => setPembelian(res.data))
      .catch(err => console.error("Gagal ambil data pembelian:", err));
  }, []);

  const handleApproval = (id, status) => {
    axios.patch(`http://45.77.252.39:8001/api/pembelian-bahan-baku/${id}/`, { status })
      .then(() => {
        alert(`Pembelian ${status === "approved" ? "diapprove" : "direject"}!`);
        setPembelian(pembelian.filter(item => item.id !== id));
      })
      .catch(err => console.error("Gagal update status pembelian:", err));
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📦 Monitoring & Approval Pembelian Bahan Baku</h2>

      {pembelian.length === 0 ? <p>Tidak ada pembelian yang perlu approval saat ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Pembelian</th>
            <th>Vendor</th>
            <th>Tanggal Transaksi</th>
            <th>Jatuh Tempo</th>
            <th>Termin</th>
            <th>Gudang</th>
            <th>Approve</th>
            <th>Reject</th>
          </tr>
        </thead>
        <tbody>
          {pembelian.map(item => (
            <tr key={item.id}>
              <td>{item.nomor_transaksi}</td>
              <td>{item.vendor}</td>
              <td>{item.tanggal_transaksi}</td>
              <td>{item.tanggal_jatuh_tempo}</td>
              <td>{item.termin}</td>
              <td>{item.gudang}</td>
              <td>
                <button onClick={() => handleApproval(item.id, "approved")}>✅ Approve</button>
              </td>
              <td>
                <button onClick={() => handleApproval(item.id, "rejected")}>❌ Reject</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MonitoringApprovalPembelian;

