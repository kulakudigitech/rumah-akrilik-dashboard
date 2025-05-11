import React, { useEffect, useState } from "react";
import axios from "axios";

const NotifikasiStokMinimum = () => {
  const [stok, setStok] = useState([]);

  useEffect(() => {
    axios.get("/api/stok/")
      .then(res => {
        const stokMinimum = res.data.filter(item => item.jumlah <= item.minimal_stok);
        setStok(stokMinimum);
      })
      .catch(err => console.error("Gagal ambil data stok:", err));
  }, []);

  const kirimNotifikasiWA = (item) => {
    const pesan = encodeURIComponent(
      `?? Peringatan Stok Minimum! Produk ${item.nama_produk} tersisa ${item.jumlah} pcs. Harap segera restok produk ini.`
    );
    const waLink = `https://wa.me/?text=${pesan}`;
    window.open(waLink, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>?? Notifikasi Stok Minimum</h2>

      {stok.length === 0 ? <p>Semua stok produk dalam kondisi aman.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>Nama Produk</th>
            <th>Jumlah Stok</th>
            <th>Minimal Stok</th>
            <th>Notifikasi</th>
          </tr>
        </thead>
        <tbody>
          {stok.map(item => (
            <tr key={item.id}>
              <td>{item.nama_produk}</td>
              <td>{item.jumlah} pcs</td>
              <td>{item.minimal_stok} pcs</td>
              <td>
                <button onClick={() => kirimNotifikasiWA(item)}>?? Kirim Notifikasi WA</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NotifikasiStokMinimum;

