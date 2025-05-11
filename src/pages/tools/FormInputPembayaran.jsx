import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

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

const FormInputPembayaran = () => {
  console.log("FormInputPembayaran component rendered");
  const { orderId } = useParams();
  console.log("Order ID from params:", orderId);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  
  // State untuk form pembayaran
  const [payments, setPayments] = useState([
    {
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'tunai',
      reference_number: '',
      notes: '',
      proof_file: null
    }
  ]);
  
  // State untuk status submit
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // Fetch order detail saat komponen dimuat
  useEffect(() => {
    console.log("Fetching order details for ID:", orderId);
    const fetchOrderDetail = async () => {
      try {
        const response = await axios.get(`/order/${orderId}/`);
        console.log("Order detail fetched successfully:", response.data);
        setOrderDetail(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch order detail:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          console.error("Error status:", err.response.status);
        }
        setError("Gagal memuat detail order. Silakan coba lagi nanti.");
        setLoading(false);
      }
    };
    
    fetchOrderDetail();
  }, [orderId]);
  
  // Hitung total yang sudah dibayarkan
  const calculateTotalPaid = () => {
    // Jika ada data pembayaran sebelumnya dari API
    const previousPayments = orderDetail?.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
    
    // Tambahkan pembayaran yang sedang diinput saat ini
    const currentPayments = payments.reduce((sum, payment) => {
      const amount = payment.amount ? parseFloat(payment.amount) : 0;
      return sum + amount;
    }, 0);
    
    return previousPayments + currentPayments;
  };
  
  // Hitung sisa yang harus dibayar
  const calculateRemaining = () => {
    if (!orderDetail) return 0;
    
    const totalAmount = parseFloat(orderDetail.total_amount || 0);
    const totalPaid = calculateTotalPaid();
    
    return Math.max(0, totalAmount - totalPaid);
  };
  
  // Handle perubahan input pada form pembayaran
  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...payments];
    updatedPayments[index][field] = value;
    setPayments(updatedPayments);
  };
  
  // Handle upload file bukti pembayaran
  const handleFileChange = (index, e) => {
    if (e.target.files && e.target.files[0]) {
      const updatedPayments = [...payments];
      updatedPayments[index].proof_file = e.target.files[0];
      setPayments(updatedPayments);
    }
  };
  
  // Tambah form pembayaran baru
  const addPaymentForm = () => {
    setPayments([
      ...payments,
      {
        amount: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'tunai',
        reference_number: '',
        notes: '',
        proof_file: null
      }
    ]);
  };
  
  // Hapus form pembayaran
  const removePaymentForm = (index) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };
  
  // Handle submit pembayaran
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    
    if (submitting) return;
    
    const totalPaid = calculateTotalPaid();
    const totalAmount = parseFloat(orderDetail.total_amount || 0);
    
    if (totalPaid > totalAmount) {
      toast.error("Total pembayaran melebihi total order! Silakan periksa kembali jumlah pembayaran.");
      return;
    }
    
    setSubmitting(true);
    
    try {
      console.log("Submitting payment for order ID:", orderId);
      
      // Persiapkan data untuk setiap pembayaran
      for (const payment of payments) {
        // Gunakan FormData untuk mengirim file
        const formData = new FormData();
        formData.append('order', orderId);
        formData.append('amount', payment.amount);
        formData.append('payment_date', payment.payment_date);
        formData.append('payment_method', payment.payment_method);
        formData.append('reference_number', payment.reference_number || '');
        formData.append('notes', payment.notes || '');
        
        if (payment.proof_file) {
          formData.append('proof_file', payment.proof_file);
        }
        
        // Log data yang akan dikirim untuk debugging
        console.log("Sending payment data:", {
          order: orderId,
          amount: payment.amount,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          reference_number: payment.reference_number,
          notes: payment.notes,
          has_proof_file: !!payment.proof_file
        });
        
        // Kirim data pembayaran ke API
        const response = await axios.post(`/payment/`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        });
        
        console.log("Payment submitted successfully:", response.data);
      }
      
      setSubmitSuccess(true);
      toast.success("Pembayaran berhasil disimpan!");
      
      // Arahkan kembali ke halaman daftar order setelah 2 detik
      setTimeout(() => {
        navigate('/order-list');
      }, 2000);
      
    } catch (err) {
      console.error("Failed to save payment:", err);
      if (err.response) {
        console.error("Error response:", err.response.data);
        console.error("Error status:", err.response.status);
      }
      toast.error("Gagal menyimpan pembayaran. Silakan coba lagi nanti.");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) return (
    <div className="loading-container" style={{ textAlign: 'center', padding: '50px' }}>
      <div className="spinner" style={{ 
        border: '4px solid rgba(0, 0, 0, 0.1)', 
        borderLeft: '4px solid #007bff',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto'
      }}></div>
      <p style={{ marginTop: '20px' }}>Memuat data order...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
  
  if (error) return (
    <div className="error-message" style={{ 
      color: '#721c24',
      backgroundColor: '#f8d7da',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h3>Error</h3>
      <p>{error}</p>
      <button 
        onClick={() => navigate('/order-list')} 
        style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Kembali ke Daftar Order
      </button>
    </div>
  );
  
  if (!orderDetail) return (
    <div className="no-data" style={{ textAlign: 'center', padding: '50px' }}>
      <p>Data order tidak ditemukan</p>
      <button 
        onClick={() => navigate('/order-list')} 
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '8px 15px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        Kembali ke Daftar Order
      </button>
    </div>
  );
  
  if (submitSuccess) return (
    <div className="success-message" style={{ 
      color: '#155724',
      backgroundColor: '#d4edda',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h3>Pembayaran Berhasil!</h3>
      <p>Pembayaran telah berhasil disimpan. Mengalihkan ke halaman daftar order...</p>
    </div>
  );
  
  // Hitung total pembayaran sebelumnya
  const previousTotalPaid = orderDetail.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
  
  // Tentukan status pembayaran
  let paymentStatus = "Belum Dibayar";
  if (previousTotalPaid > 0) {
    paymentStatus = previousTotalPaid >= orderDetail.total_amount ? "Lunas" : "Dibayar Sebagian";
  }
  
  return (
    <div className="form-input-pembayaran" style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '24px' }}>Form Input Pembayaran</h2>
      
      {/* Order Detail Summary */}
      <div className="order-summary" style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e3e6f0'
      }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Detail Order #{orderDetail.order_number}</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '280px' }}>
            <p style={{ margin: '5px 0' }}><strong>Customer:</strong> {orderDetail.customer?.name || "Unknown Customer"}</p>
            <p style={{ margin: '5px 0' }}><strong>Tanggal Order:</strong> {formatDate(orderDetail.order_date)}</p>
            <p style={{ margin: '5px 0' }}><strong>Status:</strong> 
              <span style={{ 
                backgroundColor: orderDetail.status?.color || '#6c757d',
                color: parseInt((orderDetail.status?.color || '#6c757d').replace('#', ''), 16) > 0x888888 ? '#000' : '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                marginLeft: '5px'
              }}>
                {orderDetail.status?.name || "Unknown"}
              </span>
            </p>
            <p style={{ margin: '5px 0' }}><strong>Status Pembayaran:</strong> 
              <span style={{ 
                backgroundColor: 
                  paymentStatus === "Lunas" ? "#28a745" : 
                  paymentStatus === "Dibayar Sebagian" ? "#ffc107" : "#dc3545",
                color: 
                  paymentStatus === "Dibayar Sebagian" ? '#000' : '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.85em',
                marginLeft: '5px'
              }}>
                {paymentStatus}
              </span>
            </p>
          </div>
          <div style={{ flex: '1', minWidth: '280px', textAlign: 'right' }}>
            <p style={{ margin: '5px 0' }}><strong>Total Order:</strong> {formatCurrency(orderDetail.total_amount)}</p>
            <p style={{ margin: '5px 0' }}><strong>Total Dibayar:</strong> {formatCurrency(previousTotalPaid)}</p>
            <p style={{ margin: '5px 0' }}><strong>Sisa Pembayaran:</strong> {formatCurrency(Math.max(0, orderDetail.total_amount - previousTotalPaid))}</p>
            <p style={{ margin: '5px 0' }}><strong>Sales:</strong> {orderDetail.sales_person?.username || "No Sales Person"}</p>
          </div>
        </div>
        
        {/* Products section */}
        {orderDetail.items && orderDetail.items.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <h4 style={{ fontSize: '16px', marginBottom: '10px' }}>Produk:</h4>
            <ul style={{ paddingLeft: '20px' }}>
              {orderDetail.items.map((item, idx) => (
                <li key={idx}>
                  {item.nama_produk} x {item.quantity} - {formatCurrency(item.unit_price)}
                  {item.notes && <span> - <em>{item.notes}</em></span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Previous Payments Section (if any) */}
      {orderDetail.payments && orderDetail.payments.length > 0 && (
        <div className="previous-payments" style={{
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #ddd'
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Pembayaran Sebelumnya</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Tanggal</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Metode</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Referensi</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Catatan</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {orderDetail.payments.map((payment, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDate(payment.payment_date)}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{
                    payment.payment_method === 'tunai' ? 'Kas (Tunai)' :
                    payment.payment_method === 'bca' ? 'Bank BCA' :
                    payment.payment_method === 'bri' ? 'Bank BRI' :
                    payment.payment_method === 'jateng' ? 'Bank Jateng' :
                    payment.payment_method === 'mandiri' ? 'Bank Mandiri' : 
                    payment.payment_method
                  }</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{payment.reference_number || '-'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{payment.notes || '-'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(payment.amount)}</td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f2f2f2', fontWeight: 'bold' }}>
                <td colSpan="4" style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Total:</td>
                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{formatCurrency(previousTotalPaid)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* Form Pembayaran */}
      <form onSubmit={handleSubmitPayment}>
        {payments.map((payment, index) => (
          <div key={index} className="payment-form-section" style={{
            backgroundColor: '#fff',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            border: '1px solid #ddd'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Pembayaran {index + 1}</h3>
            
            <div className="form-row" style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label htmlFor={`amount-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Total Dibayar*:</label>
                <input
                  id={`amount-${index}`}
                  type="number"
                  value={payment.amount}
                  onChange={(e) => handlePaymentChange(index, 'amount', e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  placeholder="0"
                />
              </div>
              
              <div style={{ flex: 1, minWidth: '250px' }}>
                <label htmlFor={`payment_date-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Tanggal Transaksi*:</label>
                <input
                  id={`payment_date-${index}`}
                  type="date"
                  value={payment.payment_date}
                  onChange={(e) => handlePaymentChange(index, 'payment_date', e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
            
            <div className="form-row" style={{ marginBottom: '15px' }}>
              <label htmlFor={`payment_method-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Dibayar Ke*:</label>
              <select
                id={`payment_method-${index}`}
                value={payment.payment_method}
                onChange={(e) => handlePaymentChange(index, 'payment_method', e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="tunai">Kas (tunai)</option>
                <option value="bca">Bank BCA</option>
                <option value="bri">Bank BRI</option>
                <option value="jateng">Bank Jateng</option>
                <option value="mandiri">Bank Mandiri</option>
              </select>
            </div>
            
            <div className="form-row" style={{ marginBottom: '15px' }}>
              <label htmlFor={`reference_number-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Referensi:</label>
              <input
                id={`reference_number-${index}`}
                type="text"
                value={payment.reference_number}
                onChange={(e) => handlePaymentChange(index, 'reference_number', e.target.value)}
                placeholder="Nomor referensi (opsional)"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>
            
            <div className="form-row" style={{ marginBottom: '15px' }}>
              <label htmlFor={`notes-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Catatan:</label>
              <textarea
                id={`notes-${index}`}
                value={payment.notes}
                onChange={(e) => handlePaymentChange(index, 'notes', e.target.value)}
                placeholder="Catatan tambahan (opsional)"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
              />
            </div>
            
            <div className="form-row" style={{ marginBottom: '15px' }}>
              <label htmlFor={`proof_file-${index}`} style={{ display: 'block', marginBottom: '5px' }}>Upload Bukti Pembayaran:</label>
              <input
                id={`proof_file-${index}`}
                type="file"
                onChange={(e) => handleFileChange(index, e)}
                accept="image/*,.pdf"
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              {payment.proof_file && (
                <div style={{ marginTop: '5px', fontSize: '0.9em' }}>
                  File terpilih: {payment.proof_file.name}
                </div>
              )}
            </div>
            
            {payments.length > 1 && (
              <button
                type="button"
                onClick={() => removePaymentForm(index)}
                style={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  padding: '8px 15px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Hapus Pembayaran
              </button>
            )}
          </div>
        ))}
        
        {/* Button untuk menambah form pembayaran */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={addPaymentForm}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Tambah Pembayaran
          </button>
        </div>
        
        {/* Total Summary Pembayaran */}
        <div className="payment-summary" style={{
          backgroundColor: '#e9f7ef',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #d5f5e3'
        }}>
          <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Ringkasan Pembayaran</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '280px' }}>
              <p style={{ margin: '5px 0' }}><strong>Total Order:</strong> {formatCurrency(orderDetail.total_amount)}</p>
              <p style={{ margin: '5px 0' }}><strong>Pembayaran Sebelumnya:</strong> {formatCurrency(previousTotalPaid)}</p>
              <p style={{ margin: '5px 0' }}><strong>Pembayaran Saat Ini:</strong> {formatCurrency(payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0))}</p>
            </div>
            <div style={{ flex: '1', minWidth: '280px', textAlign: 'right' }}>
              <p style={{ margin: '5px 0' }}><strong>Total Pembayaran:</strong> {formatCurrency(calculateTotalPaid())}</p>
              <p style={{ margin: '5px 0' }}><strong>Sisa Pembayaran:</strong> {formatCurrency(calculateRemaining())}</p>
              <p style={{ margin: '5px 0' }}>
                <strong>Status Setelah Pembayaran:</strong> 
                <span style={{ 
                  backgroundColor: 
                    calculateTotalPaid() === 0 ? "#dc3545" :
                    calculateRemaining() > 0 ? "#ffc107" : "#28a745",
                  color: 
                    calculateTotalPaid() === 0 || calculateRemaining() === 0 ? '#fff' : '#000',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.85em',
                  marginLeft: '5px'
                }}>
                  {
                    calculateTotalPaid() === 0 ? "Belum Dibayar" :
                    calculateRemaining() > 0 ? "Dibayar Sebagian" : "Lunas"
                  }
                </span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={() => navigate('/order-list')}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Kembali
          </button>
          
          <button
            type="submit"
            disabled={submitting || payments.some(p => !p.amount)}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: submitting || payments.some(p => !p.amount) ? 'not-allowed' : 'pointer',
              opacity: submitting || payments.some(p => !p.amount) ? 0.7 : 1
            }}
          >
            {submitting ? 'Menyimpan...' : 'Simpan Pembayaran'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormInputPembayaran;

