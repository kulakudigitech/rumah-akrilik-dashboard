import React, { useEffect, useState } from "react";
import axios from "axios";

const ApprovalPembayaranAdmin = () => {
  const [transaksi, setTransaksi] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/pembayaran/?status=pending")
      .then(res => setTransaksi(res.data))
      .catch(err => console.error("Gagal ambil data pembayaran:", err));
  }, []);

  const handleApproval = (id, status) => {
    axios.patch(`http://45.77.252.39:8001/api/pembayaran/${id}/`, { status })
      .then(() => {
        alert(`Pembayaran ${status === "approved" ? "diapprove" : "direject"}!`);
        setTransaksi(transaksi.filter(item => item.id !== id));
      })
      .catch(err => console.error("Gagal update status pembayaran:", err));
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>✅ Approval Pembayaran Admin</h2>

      {transaksi.length === 0 ? <p>Tidak ada pembayaran yang perlu approval saat ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Pembayaran</th>
            <th>Jumlah Dibayar</th>
            <th>Akun Tujuan</th>
            <th>Tanggal Transaksi</th>
            <th>Bukti Pembayaran</th>
            <th>Approve</th>
            <th>Reject</th>
          </tr>
        </thead>
        <tbody>
          {transaksi.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>Rp {item.jumlah.toLocaleString()}</td>
              <td>{item.akun_tujuan}</td>
              <td>{item.tanggal_transaksi}</td>
              <td>
                <a href={item.bukti_pembayaran} target="_blank" rel="noopener noreferrer">Lihat Bukti</a>
              </td>
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

export default ApprovalPembayaranAdmin;

