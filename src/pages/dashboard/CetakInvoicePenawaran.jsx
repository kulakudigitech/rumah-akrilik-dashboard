import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const CetakInvoicePenawaran = () => {
  const [transaksi, setTransaksi] = useState([]);
  const cetakRef = useRef({});

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/pembayaran/?status=approved")
      .then(res => setTransaksi(res.data))
      .catch(err => console.error("Gagal ambil data transaksi:", err));
  }, []);

  const cetakDokumen = (item) => {
    const element = cetakRef.current[item.id];
    html2pdf().from(element).save(`invoice-penawaran-${item.id}.pdf`);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🖨️ Cetak Invoice & Surat Penawaran Otomatis</h2>

      {transaksi.length === 0 ? <p>Tidak ada transaksi yang diapprove saat ini.</p> : null}

      {transaksi.map(item => (
        <div key={item.id} style={{ border: "1px solid #ccc", padding: 20, marginTop: 20 }}>
          <div ref={el => (cetakRef.current[item.id] = el)} style={{ background: "#fff", padding: 20 }}>
            <h3>Invoice & Surat Penawaran</h3>
            <p><strong>ID Pembayaran:</strong> #{item.id}</p>
            <p><strong>Customer:</strong> {item.nama_customer}</p>
            <p><strong>Jumlah Dibayar:</strong> Rp {item.jumlah.toLocaleString()}</p>
            <p><strong>Tanggal Transaksi:</strong> {item.tanggal_transaksi}</p>
            <p><strong>Akun Tujuan:</strong> {item.akun_tujuan}</p>
            <p><strong>Referensi:</strong> {item.referensi || '-'}</p>
            <hr />
            <p>Terima kasih atas kepercayaan Anda. Berikut invoice dan surat penawaran resmi dari Rumah Akrilik.</p>
          </div>
          <button style={{ marginTop: 10 }} onClick={() => cetakDokumen(item)}>🖨️ Cetak Dokumen</button>
        </div>
      ))}
    </div>
  );
};

export default CetakInvoicePenawaran;

