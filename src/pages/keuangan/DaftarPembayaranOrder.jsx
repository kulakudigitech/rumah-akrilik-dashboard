import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
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

// Helper function untuk warna teks pada background
function isLightColor(color) {
  if (!color || color === "" || !color.startsWith("#")) return false;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128;
}

const DaftarPembayaranOrder = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  console.log("DaftarPembayaranOrder component initializing");
  
  useEffect(() => {
    console.log('Fetching order data for DaftarPembayaranOrder...');
    const fetchData = async () => {
      try {
        const response = await axios.get("/order/");
        console.log('Order data received:', response.data);
        const orderData = response.data.results || [];
        
        // Process data
        const processedOrders = orderData.map(order => {
          // Hitung total pembayaran yang sudah dilakukan
          const totalPaid = order.payments?.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0) || 0;
          const totalAmount = parseFloat(order.total_amount || 0);
          
          // Tentukan status pembayaran
          let paymentStatus = "Belum Dibayar";
          if (totalPaid > 0) {
            paymentStatus = totalPaid >= totalAmount ? "Lunas" : "Dibayar Sebagian";
          }
          
          return {
            id: order.id,
            orderNumber: order.order_number || "No Order Number",
            customerName: order.customer?.name || "Unknown Customer",
            totalAmount: totalAmount,
            totalPaid: totalPaid,
            remainingAmount: Math.max(0, totalAmount - totalPaid),
            orderDate: order.order_date,
            formattedOrderDate: formatDate(order.order_date),
            statusText: order.status?.name || "Unknown Status",
            statusColor: order.status?.color || "#000000",
            salesPerson: order.sales_person?.username || "No Sales Person",
            paymentStatus: paymentStatus,
            payments: order.payments || [],
            notes: order.notes || "",
            terms: order.terms || ""
          };
        });
        
        setOrders(processedOrders);
        setFilteredOrders(processedOrders);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order data:", err);
        if (err.response) {
          console.error("Error response:", err.response.data);
          console.error("Error status:", err.response.status);
        }
        setError("Failed to load order data");
        toast.error("Gagal memuat data order");
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters when any filter changes
  useEffect(() => {
    console.log("Applying filters:", { paymentStatus, searchQuery, startDate, endDate });
    
    let result = [...orders];
    
    // Filter by payment status
    if (paymentStatus !== 'all') {
      result = result.filter(order => order.paymentStatus === paymentStatus);
    }
    
    // Filter by search query (order number or customer name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        order => (order.orderNumber && order.orderNumber.toLowerCase().includes(query)) || 
                 (order.customerName && order.customerName.toLowerCase().includes(query))
      );
    }
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59); // Set end date to end of day
      
      result = result.filter(order => {
        if (!order.orderDate) return false;
        const orderDate = new Date(order.orderDate);
        return orderDate >= start && orderDate <= end;
      });
    } else if (startDate) {
      const start = new Date(startDate);
      result = result.filter(order => {
        if (!order.orderDate) return false;
        return new Date(order.orderDate) >= start;
      });
    } else if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      result = result.filter(order => {
        if (!order.orderDate) return false;
        return new Date(order.orderDate) <= end;
      });
    }
    
    setFilteredOrders(result);
    console.log("Filtered orders count:", result.length);
  }, [orders, paymentStatus, searchQuery, startDate, endDate]);
  
  // Reset filters
  const resetFilters = () => {
    setPaymentStatus('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    toast.info("Filter direset");
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
    <div className="error-container" style={{ 
      color: '#721c24',
      backgroundColor: '#f8d7da',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px',
      textAlign: 'center'
    }}>
      <h3>Error</h3>
      <p>{error}</p>
    </div>
  );
  
  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const totalValue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalPaid = filteredOrders.reduce((sum, order) => sum + order.totalPaid, 0);
  const totalRemaining = filteredOrders.reduce((sum, order) => sum + order.remainingAmount, 0);
  
  const countByStatus = {
    "Belum Dibayar": filteredOrders.filter(order => order.paymentStatus === "Belum Dibayar").length,
    "Dibayar Sebagian": filteredOrders.filter(order => order.paymentStatus === "Dibayar Sebagian").length,
    "Lunas": filteredOrders.filter(order => order.paymentStatus === "Lunas").length
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '24px' }}>📊 Daftar Pembayaran Order</h2>
      
      {/* Filter Section */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e3e6f0'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Filter</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <div>
            <label htmlFor="paymentStatus" style={{ marginRight: '10px' }}>Status Pembayaran:</label>
            <select
              id="paymentStatus"
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', marginLeft: '5px' }}
            >
              <option value="all">Semua</option>
              <option value="Belum Dibayar">Belum Dibayar</option>
              <option value="Dibayar Sebagian">Dibayar Sebagian</option>
              <option value="Lunas">Lunas</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="searchQuery" style={{ marginRight: '10px' }}>Cari:</label>
            <input
              id="searchQuery"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="No. Order / Nama Customer"
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd', width: '200px' }}
            />
          </div>
          
          <div>
            <label htmlFor="startDate" style={{ marginRight: '10px' }}>Dari Tanggal:</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <div>
            <label htmlFor="endDate" style={{ marginRight: '10px' }}>Sampai Tanggal:</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          
          <button
            onClick={resetFilters}
            style={{
              backgroundColor: '#6c757d',
              color: 'white',
              padding: '8px 15px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reset Filter
          </button>
        </div>
      </div>
      
      {/* Summary Statistics */}
      <div style={{
        backgroundColor: '#e9f7ef',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #d5f5e3'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Ringkasan</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px' }}>
          <div>
            <p style={{ margin: '5px 0' }}><strong>Total Order:</strong> {totalOrders}</p>
            <p style={{ margin: '5px 0' }}><strong>Nilai Total:</strong> {formatCurrency(totalValue)}</p>
          </div>
          <div>
            <p style={{ margin: '5px 0' }}><strong>Total Sudah Dibayar:</strong> {formatCurrency(totalPaid)}</p>
            <p style={{ margin: '5px 0' }}><strong>Total Sisa Pembayaran:</strong> {formatCurrency(totalRemaining)}</p>
          </div>
          <div>
            <p style={{ margin: '5px 0' }}><strong>Belum Dibayar:</strong> {countByStatus["Belum Dibayar"]} order</p>
            <p style={{ margin: '5px 0' }}><strong>Dibayar Sebagian:</strong> {countByStatus["Dibayar Sebagian"]} order</p>
            <p style={{ margin: '5px 0' }}><strong>Lunas:</strong> {countByStatus["Lunas"]} order</p>
          </div>
        </div>
      </div>
      
      {/* Order List */}
      {filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', backgroundColor: '#f9f9fa', borderRadius: '8px' }}>
          <p>Tidak ada data yang sesuai dengan filter.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>No. Order</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Tanggal</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Customer</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Sales</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status Order</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Total Order</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Total Dibayar</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Sisa</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status Bayar</th>
                <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{order.orderNumber}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{order.formattedOrderDate}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{order.customerName}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{order.salesPerson}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{ 
                      backgroundColor: order.statusColor, 
                      color: isLightColor(order.statusColor) ? '#000' : '#fff',
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.85em'
                    }}>
                      {order.statusText}
                    </span>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                    {formatCurrency(order.totalPaid)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>
                    {formatCurrency(order.remainingAmount)}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span style={{ 
                      backgroundColor: 
                        order.paymentStatus === "Lunas" ? "#28a745" : 
                        order.paymentStatus === "Dibayar Sebagian" ? "#ffc107" : "#dc3545",
                      color: 
                        order.paymentStatus === "Dibayar Sebagian" ? '#000' : '#fff',
                      padding: '3px 8px', 
                      borderRadius: '4px',
                      fontSize: '0.85em'
                    }}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <Link to={`/input-pembayaran/${order.id}`} style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: "4px",
                      textDecoration: "none",
                      fontSize: '0.85em',
                      display: 'inline-block'
                    }}>
                      Input Pembayaran
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DaftarPembayaranOrder;
