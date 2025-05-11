import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import html2pdf from "html2pdf.js";

const DashboardRingkasanBulanan = () => {
  const [data, setData] = useState([]);
  const [bulanAktif, setBulanAktif] = useState("");
  const [ringkasan, setRingkasan] = useState(null);
  const reportRef = useRef();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [o, p, a] = await Promise.all([
          axios.get("http://45.77.252.39:8001/api/order/"),
          axios.get("http://45.77.252.39:8001/api/produksi/"),
          axios.get("http://45.77.252.39:8001/api/absensi/")
        ]);
        prosesData(o.data, p.data, a.data);
      } catch (err) {
        console.error("Gagal ambil data:", err);
      }
    };
    fetchAll();
  }, []);

  const prosesData = (orders, produksi, absensi) => {
    const map = {};
    const getKey = (date) => new Date(date).toLocaleString("default", { month: "short", year: "numeric" });

    orders.forEach(o => {
      const key = getKey(o.tanggal_order);
      const total = parseFloat(o.harga_produk) * o.quantity + parseFloat(o.biaya_pasang) + parseFloat(o.biaya_survey);
      if (!map[key]) map[key] = { bulan: key, order: 0, produksi: 0, absensi: 0, omzet: 0 };
      map[key].order++;
      map[key].omzet += total;
    });

    produksi.forEach(p => {
      const key = getKey(p.mulai);
      if (!map[key]) map[key] = { bulan: key, order: 0, produksi: 0, absensi: 0, omzet: 0 };
      map[key].produksi++;
    });

    absensi.forEach(a => {
      const key = getKey(a.tanggal);
      if (!map[key]) map[key] = { bulan: key, order: 0, produksi: 0, absensi: 0, omzet: 0 };
      map[key].absensi++;
    });

    const final = Object.values(map).sort((a, b) => new Date("1 " + b.bulan) - new Date("1 " + a.bulan));
    setData(final);
    if (final.length > 0) {
      setBulanAktif(final[0].bulan);
      setRingkasan(final[0]);
    }
  };

  const cetakPDF = () => {
    html2pdf().from(reportRef.current).save(`ringkasan-${bulanAktif}.pdf`);
  };

  const kirimWA = () => {
    if (!ringkasan) return;
    const pesan = `📊 *Ringkasan Bulanan - ${ringkasan.bulan}*\n\n` +
      `🛒 Order: ${ringkasan.order}\n` +
      `🛠️ Produksi: ${ringkasan.produksi}\n` +
      `👥 Absensi: ${ringkasan.absensi}\n` +
      `💰 Omzet: Rp ${ringkasan.omzet.toLocaleString()}`;
    const link = `https://wa.me/?text=${encodeURIComponent(pesan)}`;
    window.open(link, "_blank");
  };

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📅 Dashboard Ringkasan Bulanan</h2>

      {data.length > 0 && (
        <>
          <label>
            Pilih Bulan:{" "}
            <select value={bulanAktif} onChange={(e) => {
              setBulanAktif(e.target.value);
              const r = data.find(d => d.bulan === e.target.value);
              setRingkasan(r);
            }}>
              {data.map((d) => (
                <option key={d.bulan} value={d.bulan}>{d.bulan}</option>
              ))}
            </select>
          </label>

          {ringkasan && (
            <div style={{ marginTop: 20 }}>
              <div style={{ marginBottom: 10 }}>
                <button onClick={cetakPDF} style={{ marginRight: 10 }}>🖨️ Cetak PDF</button>
                <button onClick={kirimWA}>📲 Kirim WA</button>
              </div>

              <div ref={reportRef}>
                <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Produksi</th>
                      <th>Absensi</th>
                      <th>Omzet</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{ringkasan.order}</td>
                      <td>{ringkasan.produksi}</td>
                      <td>{ringkasan.absensi}</td>
                      <td>Rp {ringkasan.omzet.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={{ height: 300, marginTop: 40 }}>
                  <ResponsiveContainer>
                    <BarChart data={[ringkasan]} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="bulan" />
                      <Tooltip formatter={(value, name) => name === 'omzet' ? `Rp ${value.toLocaleString()}` : value} />
                      <Legend />
                      <Bar dataKey="order" fill="#8884d8" name="Order" />
                      <Bar dataKey="produksi" fill="#82ca9d" name="Produksi" />
                      <Bar dataKey="absensi" fill="#ffc658" name="Absensi" />
                      <Bar dataKey="omzet" fill="#ff8042" name="Omzet" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardRingkasanBulanan;

