import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const ProduksiList = () => {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState({});
  const labelRefs = useRef({});

  useEffect(() => {
    axios.get("produksi/")
      .then((res) => {
        // Handle pagination for produksi data
        if (res.data && Array.isArray(res.data.results)) {
           setData(res.data.results);
        } else if (Array.isArray(res.data)) {
           setData(res.data);
        } else {
           console.error("Error fetch produksi (ProduksiList): Data structure unknown", res.data);
           setData([]);
        }
    })
      .catch((err) => console.error(err));

    axios.get("order/")
.then((res) => {
    const orderMap = {};
    // Handle pagination for order data
    const orderData = (res.data && Array.isArray(res.data.results)) ? res.data.results : (Array.isArray(res.data) ? res.data : []);
    orderData.forEach(o => { orderMap[o.id] = o });
    setOrders(orderMap);
})
      .catch(err => console.error("Gagal ambil order:", err));
  }, []);

  const cetakLabel = (order) => {
    const el = labelRefs.current[order.id];
    if (!el) return;
    html2pdf().set({
      margin: 0,
      filename: `label-${order.nama_customer}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: [90, 38], orientation: "landscape" }
    }).from(el).save();
  };

  return (
    <div>
      <h2>🔧 Tahapan Produksi</h2>
      <ul>
        {data.map((item) => {
          const order = orders[item.order];
          return (
            <li key={item.id} style={{ marginBottom: 20 }}>
              Order #{item.order} | Tahap: {item.tahap} | PIC: {item.penanggung_jawab} | Mulai: {item.mulai}
              {order && (
                <>
                  <div ref={el => (labelRefs.current[order.id] = el)} style={{ display: "none" }}>
                    <h3>📦 Rumah Akrilik</h3>
                    <p><strong>Nama:</strong> {order.nama_customer}</p>
                    <p><strong>HP:</strong> {order.nomor_hp}</p>
                    <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
                    <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
                  </div>
                  <button style={{ marginLeft: 10 }} onClick={() => cetakLabel(order)}>🖨️ Cetak Label</button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ProduksiList;

