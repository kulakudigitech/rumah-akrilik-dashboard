import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge, Table, Form } from 'react-bootstrap';
import { FaArrowLeft, FaEdit, FaFileInvoice, FaPrint } from 'react-icons/fa';
import axios from 'axios';
import { sendOrderStatusUpdate } from '../../utils/whatsappUtil';
import { toast } from 'react-toastify';

const OrderDetail = () => {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [notifyCustomer, setNotifyCustomer] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('jwtToken');
        const baseURL = 'https://rumahakrilik.id';
        const response = await axios.get(`${baseURL}/api/orders/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log("Fetched order data:", response.data);
        setOrderData(response.data);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(
          err.response?.data?.detail || 
          `Failed to load order details. Error: ${err.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0';
    
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;
    
    let variant = "secondary";
    const statusName = status.toLowerCase();
    
    if (statusName.includes('baru')) variant = "info";
    else if (statusName.includes('produksi')) variant = "primary";
    else if (statusName.includes('siap')) variant = "warning";
    else if (statusName.includes('selesai')) variant = "success";
    else if (statusName.includes('batal')) variant = "danger";
    
    return <Badge bg={variant}>{status}</Badge>;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      
      // Update status order di server
      const token = localStorage.getItem('jwtToken');
      const baseURL = 'https://rumahakrilik.id';
      
      await axios.patch(`${baseURL}/api/orders/${id}/`, 
        { status: newStatus },
        { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update state lokal
      setOrderData({
        ...orderData,
        status: newStatus
      });
      
      toast.success('Status order berhasil diperbarui');
      
      // Kirim notifikasi WhatsApp jika diaktifkan
      if (notifyCustomer && orderData?.customer?.phone) {
        try {
          const result = await sendOrderStatusUpdate(orderData, newStatus);
          
          if (result.success) {
            toast.success('Notifikasi WhatsApp berhasil dikirim');
          } else {
            toast.warning(`Gagal mengirim WhatsApp: ${result.error}`);
          }
        } catch (whatsappError) {
          console.error('WhatsApp notification error:', whatsappError);
          toast.error('Terjadi kesalahan saat mengirim notifikasi WhatsApp');
        }
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Gagal memperbarui status order');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading order details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" as={Link} to="/order-list">
            <FaArrowLeft /> Back to Orders
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!orderData) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          <Alert.Heading>Order Not Found</Alert.Heading>
          <p>The requested order could not be found.</p>
          <Button variant="outline-warning" as={Link} to="/order-list">
            <FaArrowLeft /> Back to Orders
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Button variant="outline-secondary" as={Link} to="/order-list" className="mb-3">
        <FaArrowLeft /> Kembali ke Daftar Order
      </Button>

      <h2>Detail Order: {orderData.order_number || `#${orderData.id}`}</h2>

      <Row className="mb-4">
        <Col lg={8}>
          <Card>
            <Card.Header>Informasi Order</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Customer:</strong> {orderData.customer?.name || '-'}</p>
                  <p><strong>Phone:</strong> {orderData.customer?.phone || '-'}</p>
                  <p><strong>Email:</strong> {orderData.customer?.email || '-'}</p>
                  <p><strong>Order Date:</strong> {new Date(orderData.order_date).toLocaleDateString('id-ID')}</p>
                </Col>
                <Col md={6}>
                  <p><strong>Status:</strong> {getStatusBadge(orderData.status?.name)}</p>
                  <p><strong>Sales:</strong> {orderData.sales_person?.username || '-'}</p>
                  <p><strong>Payment Method:</strong> {orderData.payment_method || '-'}</p>
                  <p><strong>Source:</strong> {orderData.sumber_order || '-'}</p>
                </Col>
              </Row>
              
              <hr />
              
              <Row>
                <Col md={12}>
                  <p><strong>Notes:</strong> {orderData.notes || '-'}</p>
                  <p><strong>Terms:</strong> {orderData.terms || '-'}</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card>
            <Card.Header>Informasi Pembayaran</Card.Header>
            <Card.Body>
              <p><strong>Subtotal:</strong> {formatCurrency(orderData.calculated_total)}</p>
              <p><strong>Biaya Pasang:</strong> {formatCurrency(orderData.biaya_pasang || 0)}</p>
              <p><strong>Biaya Survey:</strong> {formatCurrency(orderData.biaya_survey || 0)}</p>
              <p><strong>Total:</strong> {formatCurrency(orderData.total || orderData.calculated_total)}</p>
            </Card.Body>
            <Card.Footer className="d-flex justify-content-between align-items-center">
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  id="notify-customer"
                  label="Kirim notifikasi WhatsApp ke pelanggan saat status berubah"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                />
              </Form.Group>
              <div>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="me-2"
                  as={Link}
                  to={`/input-pembayaran/${orderData.id}`}
                >
                  <FaFileInvoice /> Input Pembayaran
                </Button>
                <Button variant="outline-secondary" size="sm">
                  <FaPrint /> Print
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4">
        <Card.Header>Order Items</Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th>Specification</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.items && orderData.items.length > 0 ? (
                orderData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <div>{item.nama_produk || item.product?.name}</div>
                      <small className="text-muted">{item.notes}</small>
                    </td>
                    <td>
                      {item.specifications?.bahan && <div>Bahan: {item.specifications.bahan}</div>}
                      {item.specifications?.ukuran && <div>Ukuran: {item.specifications.ukuran}</div>}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.total_price)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">Tidak ada item dalam order ini</td>
                </tr>
              )}
            </tbody>
            {orderData.items && orderData.items.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan="5" className="text-end"><strong>Total:</strong></td>
                  <td>{formatCurrency(orderData.total || orderData.calculated_total)}</td>
                </tr>
              </tfoot>
            )}
          </Table>
        </Card.Body>
      </Card>
      
      {orderData.alamat_jalan && (
        <Card>
          <Card.Header>Informasi Pengiriman</Card.Header>
          <Card.Body>
            <p><strong>Alamat:</strong> {orderData.alamat_jalan}</p>
            <p>
              {orderData.kelurahan && `${orderData.kelurahan}, `}
              {orderData.kecamatan && `${orderData.kecamatan}, `}
              {orderData.kota && `${orderData.kota}, `}
              {orderData.provinsi && `${orderData.provinsi} `}
              {orderData.kode_pos && `${orderData.kode_pos}`}
            </p>
            <p><strong>No HP:</strong> {orderData.nomor_hp || orderData.customer?.phone}</p>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default OrderDetail;
