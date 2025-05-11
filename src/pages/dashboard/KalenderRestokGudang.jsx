import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

const KalenderRestokGudang = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get("http://45.77.252.39:8001/api/gudang/restok/")
      .then(res => {
        const eventRestok = res.data.map(item => ({
          title: `Restok ${item.nama_barang}`,
          date: item.tanggal_restok,
          backgroundColor: "#ffcc00"
        }));
        setEvents(eventRestok);
      })
      .catch(err => console.error("Gagal ambil data restok:", err));
  }, []);

  const handleDateClick = (arg) => {
    alert(`Tanggal ${arg.dateStr} dipilih. Silahkan cek detail restok!`);
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📅 Kalender Jadwal Restok Otomatis</h2>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        dateClick={handleDateClick}
      />
    </div>
  );
};

export default KalenderRestokGudang;

