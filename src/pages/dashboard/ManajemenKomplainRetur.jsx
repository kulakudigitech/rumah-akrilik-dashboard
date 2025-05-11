import React, { useEffect, useState } from "react";
import axios from "axios";

const ManajemenKomplainRetur = () => {
  const [komplain, setKomplain] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/komplain/")
      .then(res => setKomplain(res.data))
      .catch(err => console.error("Gagal ambil data komplain:", err));
  }, []);

  const kirimUpdateWA = (item) => {
    const nomor = item.nomor_hp?.replace(/^0/, "62");
    const pesan = encodeURIComponent(
      `Halo ${item.nama_customer}, status komplain Anda mengenai produk ${item.nama_produk} adalah: ${item.status}. Kami akan terus menginformasikan update terbaru. Terima kasih atas pengertiannya.`
    );

    const waLink = `https://wa.me/${nomor}?text=${pesan}`;
    window.open(waLink, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>🛠️ Manajemen Komplain & Retur Produk</h2>

      {komplain.length === 0 ? <p>Belum ada komplain atau retur saat ini.</p> : null}

      <table border="1" cellPadding="10" style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th>ID Komplain</th>
            <th>Customer</th>
            <th>Produk</th>
            <th>Status</th>
            <th>Update WA</th>
          </tr>
        </thead>
        <tbody>
          {komplain.map(item => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.nama_customer}</td>
              <td>{item.nama_produk}</td>
              <td>{item.status}</td>
              <td>
                <button onClick={() => kirimUpdateWA(item)}>📲 Kirim Update WA</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManajemenKomplainRetur;

