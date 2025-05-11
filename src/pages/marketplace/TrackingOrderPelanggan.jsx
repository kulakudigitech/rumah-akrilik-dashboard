import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import axios from 'axios';

const TrackingOrderPelanggan = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [stages, setStages] = useState({
    desain: false,
    operator_mesin: false,
    finishing: false,
    quality_control: false,
    packing: false,
    siap_kirim_pasang: false,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('jwtToken');
      if (!token) throw new Error("Authentication required");

      // Create payload for updating production stages 
      const payload = {
        order: parseInt(orderNumber),
        notes: notes,
        stages: {
          1: stages.desain ? "completed" : "pending",
          2: stages.operator_mesin ? "completed" : "pending", 
          3: stages.finishing ? "completed" : "pending",
          4: stages.quality_control ? "completed" : "pending",
          5: stages.packing ? "completed" : "pending",
          6: stages.siap_kirim_pasang ? "completed" : "pending"
        }
      };
      
      console.log("Sending payload:", payload);
      
      // Use the dedicated endpoint for updating production stages
      const response = await axios({
        method: 'post',
        url: `https://rumahakrilik.id/api/production-tracking/update/`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: payload
      });
      
      console.log("Update response:", response.data);
      toast.success("Status produksi berhasil diperbarui");
      
      // Refresh data
      const updatedOrder = await axios.get(`https://rumahakrilik.id/api/orders/${orderNumber}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setOrder(updatedOrder.data);
    } catch (err) {
      console.error("Error updating production stages:", err);
      
      // More detailed error message
      let errorMsg = err.message;
      if (err.response?.data) {
        errorMsg = typeof err.response.data === 'object' ? 
          JSON.stringify(err.response.data) : err.response.data;
      }
      
      setError(`Gagal memperbarui status: ${errorMsg}`);
      toast.error("Terjadi kesalahan saat memperbarui status produksi");
    } finally {
      setSubmitting(false);
    }
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

  // Helper function untuk menampilkan badge status
  const getStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    let badgeColor = 'secondary';
    switch(status.toLowerCase()) {
      case 'baru':
        badgeColor = 'primary';
        break;
      case 'diproses':
      case 'processing':
        badgeColor = 'info';
        break;
      case 'dikirim':
      case 'shipped':
        badgeColor = 'warning';
        break;
      case 'selesai':
      case 'completed':
        badgeColor = 'success';
        break;
      case 'dibatalkan':
      case 'cancelled':
        badgeColor = 'danger';
        break;
      default:
        badgeColor = 'secondary';
    }
    
    return <Badge bg={badgeColor}>{status}</Badge>;
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Tracking Order</h2>
      
      <Card className="mb-4">
        <Card.Body>
          <h5>Lacak Status Pesanan Anda</h5>
          <p className="text-muted">Masukkan nomor order untuk melihat status pesanan Anda</p>
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Masukkan nomor order (contoh: ORD-12345)"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={loading}
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Mencari...</span>
                </>
              ) : (
                'Lacak Pesanan'
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {order && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Hasil Pencarian</h5>
          </Card.Header>
          <Card.Body>
            <div className="row mb-4">
              <div className="col-md-6">
                <h6>Detail Pesanan</h6>
                <p><strong>No. Order:</strong> {order.order_number || `#${order.id}`}</p>
                <p><strong>Tanggal Order:</strong> {formatDate(order.order_date)}</p>
                <p><strong>Status:</strong> {getStatusBadge(order.status?.name)}</p>
                <p><strong>Customer:</strong> {order.customer?.name || 'N/A'}</p>
              </div>
              <div className="col-md-6">
                <h6>Informasi Pengiriman</h6>
                <p><strong>Alamat:</strong> {order.alamat_jalan || 'N/A'}</p>
                <p><strong>Kota:</strong> {order.kota || 'N/A'}</p>
                <p><strong>No. Resi:</strong> {order.resi || 'Belum tersedia'}</p>
                <p><strong>Kurir:</strong> {order.kurir || 'Belum ditentukan'}</p>
              </div>
            </div>
            
            <h6>Produk yang Dipesan</h6>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nama Produk</th>
                    <th>Jumlah</th>
                    <th>Harga</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.nama_produk}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center">Tidak ada data produk</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                    <td>{formatCurrency(order.total_amount)}</td>
                  </tr>
                </tfoot>
              </Table>
            </div>
            
            {order.timeline && order.timeline.length > 0 && (
              <>
                <h6 className="mt-4">Riwayat Status</h6>
                <ul className="list-group">
                  {order.timeline.map((log, index) => (
                    <li key={index} className="list-group-item">
                      <div className="d-flex justify-content-between">
                        <div>
                          <Badge bg="info" className="me-2">{log.status}</Badge>
                          {log.notes}
                        </div>
                        <small className="text-muted">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </small>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default TrackingOrderPelanggan;