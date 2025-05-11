import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

// Buat instance axios dengan baseURL dan header
const api = axios.create({
  baseURL: 'https://rumahakrilik.id/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor untuk token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const ProduksiList = () => {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const labelRefs = useRef({});

  useEffect(() => {
    setLoading(true);
    
    // Ambil data produksi
    api.get("produksi/")
      .then((res) => {
        // Handle pagination for produksi data
        if (res.data && Array.isArray(res.data.results)) {
           setData(res.data.results);
        } else if (Array.isArray(res.data)) {
           setData(res.data);
        } else {
           setError("Format data produksi tidak sesuai");
           setData([]);
        }
    })
    .catch((err) => {
      console.error("Error fetching produksi:", err);
      setError("Gagal mengambil data produksi");
    });

    // Ambil data order
    api.get("order/")
      .then((res) => {
        const orderMap = {};
        // Handle pagination for order data
        const orderData = (res.data && Array.isArray(res.data.results)) ? res.data.results : 
                         (Array.isArray(res.data) ? res.data : []);
        
        orderData.forEach(o => { 
          orderMap[o.id] = {
            id: o.id,
            nama_customer: o.customer?.name || "Customer",
            nomor_hp: o.nomor_hp || o.customer?.phone || "-",
            alamat_jalan: o.alamat_jalan || "",
            kelurahan: o.kelurahan || "",
            kecamatan: o.kecamatan || "",
            kota: o.kota || "",
            nama_produk: o.items?.[0]?.nama_produk || "Produk",
            quantity: o.items?.[0]?.quantity || 1
          };
        });
        
        setOrders(orderMap);
      })
      .catch(err => {
        console.error("Gagal ambil order:", err);
        setError("Gagal mengambil data order");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const cetakLabel = (order) => {
    const el = labelRefs.current[order.id];
    if (!el) return;
    
    html2pdf().set({
      margin: 0,
      filename: `label-${order.nama_customer || 'order'}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: [90, 38], orientation: "landscape" }
    }).from(el).save();
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Memuat data produksi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h5>Error</h5>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => window.location.reload()}
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header bg-info text-white">
        <h5 className="m-0">🔧 Tahapan Produksi</h5>
      </div>
      <div className="card-body">
        {data.length === 0 ? (
          <div className="alert alert-info">Belum ada data produksi</div>
        ) : (
          <div className="list-group">
            {data.map((item) => {
              const order = orders[item.order];
              return (
                <div key={item.id} className="list-group-item list-group-item-action">
                  <div className="d-flex w-100 justify-content-between">
                    <h5 className="mb-1">Order #{item.order}</h5>
                    <small>{new Date(item.mulai).toLocaleDateString('id-ID')}</small>
                  </div>
                  <p className="mb-1">
                    <strong>Tahap:</strong> {item.tahap || "-"} | 
                    <strong> PIC:</strong> {item.penanggung_jawab || "Tidak diisi"}
                  </p>
                  
                  {order && (
                    <>
                      <p className="mb-1">
                        <strong>Customer:</strong> {order.nama_customer} | 
                        <strong> HP:</strong> {order.nomor_hp}
                      </p>
                      
                      {/* Hidden element for PDF export */}
                      <div ref={el => (labelRefs.current[order.id] = el)} style={{ display: "none" }}>
                        <h3>📦 Rumah Akrilik</h3>
                        <p><strong>Nama:</strong> {order.nama_customer}</p>
                        <p><strong>HP:</strong> {order.nomor_hp}</p>
                        <p><strong>Alamat:</strong> {order.alamat_jalan}, {order.kelurahan}, {order.kecamatan}, {order.kota}</p>
                        <p><strong>Produk:</strong> {order.nama_produk} ({order.quantity} pcs)</p>
                      </div>
                      
                      <button 
                        className="btn btn-sm btn-outline-primary mt-2"
                        onClick={() => cetakLabel(order)}
                      >
                        🖨️ Cetak Label
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProduksiList;