import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const UploadInvoiceLabelDrive = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const comboRef = useRef();

  useEffect(() => {
    axios.get(`http://45.77.252.39:8001/api/order/${orderId}/`)
      .then(res => setOrder(res.data))
      .catch(err => console.error("Gagal ambil data order:", err));
  }, [orderId]);

  const uploadToDrive = () => {
    html2pdf()
      .from(comboRef.current)
      .outputPdf()
      .then((pdfBlob) => {
        const file = new File([pdfBlob], `invoice-label-${order.nama_customer}.pdf`, {
          type: "application/pdf",
        });

        const formData = new FormData();
        formData.append("file", file);

        axios.post("http://45.77.252.39:8001/api/upload-drive/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then(() => alert("Upload sukses ke Google Drive!"))
        .catch((err) => console.error("Gagal upload ke Drive:", err));
      });
  };

  if (!order) return <p>Loading...</p>;

  const total = parseFloat(order.harga_produk) * order.quantity + parseFloat(order.biaya_pasang) + parseFloat(order.biaya_survey);

  return (
    <div style={{ marginTop: 40 }}>
      <h2>📥 Invoice + Label (Drive)</h2>
      <button onClick={uploadToDrive}>📤 Upload ke Google Drive</button>

      <div ref={comboRef} style={{ background: "#fff", padding: 20, width: 600, marginTop: 20 }}>
        <h3>📋 Invoice</h3>
        <p><strong>Order ID:</strong> #{order.id}</p>
        <p><strong>Tanggal:</strong> {order.tanggal_order}</p>
        <p><strong>Customer:</strong> {order.nama_customer}</p>
        <p><strong>No HP:</strong> {order.nomor_hp}</p>
        <p><strong>Produk:</strong> {order.nama_produk}</p>
        <p><strong>Qty:</strong> {order.quantity}</p>
        <p><strong>Total:</strong> Rp {total.toLocaleString()}</p>

        <hr style={{ margin: "30px 0" }} />

        <h3>🏷️ Label Pengiriman</h3>
        <p><strong>Nama:</strong> {order.nama_customer}</p>
        <p><strong>HP:</strong> {order.nomor_hp}</p>
        <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
        <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
      </div>
    </div>
  );
};

export default UploadInvoiceLabelDrive;

