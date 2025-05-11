import React, { useEffect, useState } from "react";
import axios from "axios";

const KirimMassalInvoiceLabel = () => {
  const [orders, setOrders] = useState([]);
  const [tanggal, setTanggal] = useState("");

  useEffect(() => {
    if (!tanggal) return;

    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const filtered = res.data.filter(o => o.tanggal_order === tanggal);
        setOrders(filtered);
      })
      .catch(err => console.error("Gagal ambil order:", err));
  }, [tanggal]);

  const kirimWA = (order) => {
    const nomor = order.nomor_hp?.replace(/^0/, "62");
    const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);
    const pesan = encodeURIComponent(`Halo ${order.nama_customer}, berikut rincian order Anda:\n\nProduk: ${order.nama_produk}\nQty: ${order.quantity}\nTotal: Rp ${total}\n\nTerima kasih!`);
    const link = `https://wa.me/${nomor}?text=${pesan}`;
    window.open(link, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📲 Kirim Massal Invoice + Label ke WA</h2>
      <label>
        Pilih Tanggal Order:
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>

      {orders.length === 0 && tanggal && <p>Tidak ada order pada tanggal ini.</p>}

      <ul>
        {orders.map(order => (
          <li key={order.id} style={{ marginTop: 15 }}>
            {order.nama_customer} - {order.nama_produk} ({order.quantity} pcs)
            <button style={{ marginLeft: 10 }} onClick={() => kirimWA(order)}>📲 Kirim ke WA</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KirimMassalInvoiceLabel;

