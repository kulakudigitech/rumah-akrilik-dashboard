import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

const InvoiceGenerator = ({ orderId }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const invoiceRef = useRef();

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/order/${orderId}/`);
        setOrder(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Gagal mengambil data order:", err);
        setError("Gagal mengambil data invoice. Silakan coba lagi.");
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const handleDownload = () => {
    const element = invoiceRef.current;
    const opt = {
      margin: 10,
      filename: `invoice-order-${orderId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(element).set(opt).save();
  };

  // Format currency untuk tampilan rupiah
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format tanggal untuk tampilan Indonesia
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Memuat invoice...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>{error}</div>;
  }

  if (!order) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Data order tidak ditemukan</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Invoice #{orderId}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleDownload}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Download PDF
        </button>
      </div>
      
      <div ref={invoiceRef} style={{ 
        padding: '20px', 
        border: '1px solid #ddd', 
        borderRadius: '5px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '24px', margin: '0 0 5px' }}>INVOICE</h1>
            <p style={{ margin: '0', color: '#777' }}>Rumah Akrilik Indonesia</p>
            <p style={{ margin: '0', color: '#777' }}>Jl. Monjali No. 46, Yogyakarta</p>
            <p style={{ margin: '0', color: '#777' }}>Tel: 0274-123456</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 5px' }}>#{order.order_number || orderId}</h2>
            <p style={{ margin: '0', color: '#777' }}>Tanggal: {formatDate(order.order_date)}</p>
            <p style={{ margin: '0', color: '#777' }}>
              Status: <span style={{
                backgroundColor: order.status?.color || '#777',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.85em'
              }}>
                {order.status?.name || 'Tidak diketahui'}
              </span>
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>Tagihan Kepada:</h3>
            <p style={{ margin: '0' }}><strong>{order.customer?.name || 'Tidak diketahui'}</strong></p>
            <p style={{ margin: '0' }}>{order.alamat_jalan || 'Tidak diketahui'}</p>
            <p style={{ margin: '0' }}>
              {[
                order.kelurahan,
                order.kecamatan,
                order.kota,
                order.provinsi,
                order.kode_pos
              ].filter(Boolean).join(', ')}
            </p>
            <p style={{ margin: '0' }}>Tel: {order.nomor_hp || 'Tidak diketahui'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>Informasi Pembayaran:</h3>
            <p style={{ margin: '0' }}><strong>Metode:</strong> {order.payment_method || 'Tidak diketahui'}</p>
            <p style={{ margin: '0' }}><strong>Sales:</strong> {order.sales_person?.username || 'Tidak diketahui'}</p>
          </div>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Produk</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #ddd' }}>Qty</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Harga Satuan</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #ddd' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                    <div style={{ fontWeight: 'bold' }}>{item.nama_produk}</div>
                    <div style={{ fontSize: '0.9em', color: '#777' }}>{item.keterangan_produk}</div>
                    <div style={{ fontSize: '0.9em', color: '#777' }}>
                      {item.spesifikasi_bahan} - {item.ukuran_produk}
                    </div>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{formatCurrency(item.unit_price * item.quantity)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ padding: '10px', textAlign: 'center' }}>Tidak ada produk</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2"></td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Subtotal:</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                {formatCurrency(
                  order.items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0
                )}
              </td>
            </tr>
            {order.biaya_survey > 0 && (
              <tr>
                <td colSpan="2"></td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Biaya Survey:</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(order.biaya_survey)}</td>
              </tr>
            )}
            {order.biaya_pasang > 0 && (
              <tr>
                <td colSpan="2"></td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Biaya Pemasangan:</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(order.biaya_pasang)}</td>
              </tr>
            )}
            <tr>
              <td colSpan="2"></td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #ddd' }}>Total:</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #ddd' }}>{formatCurrency(order.total_amount)}</td>
            </tr>
            {order.payments && order.payments.length > 0 && (
              <tr>
                <td colSpan="2"></td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Total Dibayar:</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  {formatCurrency(order.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0))}
                </td>
              </tr>
            )}
            {order.payments && order.payments.length > 0 && (
              <tr>
                <td colSpan="2"></td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Sisa Pembayaran:</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>
                  {formatCurrency(
                    order.total_amount - 
                    order.payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0)
                  )}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
        
        {order.notes && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>Catatan:</h3>
            <p style={{ margin: '0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>{order.notes}</p>
          </div>
        )}
        
        {order.terms && (
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px' }}>Syarat & Ketentuan:</h3>
            <p style={{ margin: '0', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>{order.terms}</p>
          </div>
        )}
        
        <div style={{ textAlign: 'center', marginTop: '50px', color: '#777', fontSize: '0.9em' }}>
          <p style={{ margin: '0' }}>Terima kasih atas kepercayaan Anda pada Rumah Akrilik!</p>
          <p style={{ margin: '0' }}>www.rumahakrilik.id | info@rumahakrilik.id</p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;