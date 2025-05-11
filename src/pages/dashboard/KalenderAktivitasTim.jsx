import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

const KalenderAktivitasTim = () => {
  const [events, setEvents] = useState([
    { title: "Meeting CS", date: "2025-03-25" },
    { title: "Produksi Neon Box", date: "2025-03-27" },
  ]);

  const handleDateClick = (arg) => {
    const title = prompt("Masukkan judul aktivitas baru:");
    if (title) {
      setEvents([...events, { title, date: arg.dateStr }]);
    }
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📅 Kalender Aktivitas & Reminder Tim</h2>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        dateClick={handleDateClick}
        events={events}
        editable={true}
        selectable={true}
      />
    </div>
  );
};

export default KalenderAktivitasTim;

