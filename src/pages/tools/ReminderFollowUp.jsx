import React, { useEffect, useState } from "react";
import axios from "axios";

const ReminderFollowUp = () => {
  const [leads, setLeads] = useState([]);
  const [tanggal, setTanggal] = useState("");

  useEffect(() => {
    if (!tanggal) return;

    axios.get("http://45.77.252.39:8001/api/order/")
      .then(res => {
        const belumClosing = res.data.filter(o => o.tanggal_order === tanggal && o.cara_pembayaran === "");
        setLeads(belumClosing);
      })
      .catch(err => console.error("Gagal ambil data order:", err));
  }, [tanggal]);

  const kirimReminderWA = (lead) => {
    const nomor = lead.nomor_hp?.replace(/^0/, "62");
    const pesan = encodeURIComponent(
      `Halo ${lead.nama_customer}, kami dari Rumah Akrilik ingin memastikan apakah Anda sudah memutuskan order produk ${lead.nama_produk}. Silakan infokan kami untuk proses lebih lanjut. Terima kasih!`
    );
    const waLink = `https://wa.me/${nomor}?text=${pesan}`;
    window.open(waLink, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📅 Reminder Follow-Up CS</h2>
      <label>
        Pilih Tanggal Lead:
        <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
      </label>

      {leads.length === 0 && tanggal && <p>Tidak ada lead untuk difollow-up pada tanggal ini.</p>}

      <ul>
        {leads.map(lead => (
          <li key={lead.id} style={{ marginTop: 15 }}>
            {lead.nama_customer} - {lead.nama_produk}
            <button style={{ marginLeft: 10 }} onClick={() => kirimReminderWA(lead)}>📲 Kirim Reminder WA</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReminderFollowUp;

