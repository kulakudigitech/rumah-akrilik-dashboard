import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Button, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaUser, FaBuilding, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import axios from 'axios';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('jwtToken');
        
        // Fetch customer details
        const customerResponse = await axios.get(`https://rumahakrilik.id/api/customers/${id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setCustomer(customerResponse.data);
        
        // Fetch customer orders
        try {
          const ordersResponse = await axios.get(`https://rumahakrilik.id/api/orders/?customer=${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          setOrders(ordersResponse.data.results || []);
        } catch (orderErr) {
          console.error('Error fetching customer orders:', orderErr);
          setOrders([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching customer details:', err);
        setError('Gagal memuat data pelanggan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomerData();
  }, [id]);
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error}
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/customers')}>
              <FaArrowLeft className="me-1" /> Kembali ke Daftar Pelanggan
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
  
  if (!customer) {
    return (
      <Container className="py-4">
        <Alert variant="warning">
          Pelanggan tidak ditemukan.
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate('/customers')}>
              <FaArrowLeft className="me-1" /> Kembali ke Daftar Pelanggan
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detail Pelanggan</h2>
        <div>
          <Button 
            as={Link} 
            to="/customers" 
            variant="outline-secondary"
            className="me-2"
            size="sm"
          >
            <FaArrowLeft className="me-1" /> Kembali ke Daftar
          </Button>
          <Button 
            as={Link} 
            to={`/customers/edit/${id}`} 
            variant="primary"
            size="sm"
          >
            <FaEdit className="me-1" /> Edit
          </Button>
        </div>
      </div>
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Informasi Pelanggan</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p className="mb-2">
                <FaUser className="me-2 text-primary" />
                <strong>Nama:</strong> {customer.name}
              </p>
              <p className="mb-2">
                <FaPhone className="me-2 text-primary" />
                <strong>Telepon:</strong> {customer.phone || '-'}
              </p>
              <p className="mb-2">
                <FaEnvelope className="me-2 text-primary" />
                <strong>Email:</strong> {customer.email || '-'}
              </p>
              {customer.company_name && (
                <p className="mb-2">
                  <FaBuilding className="me-2 text-primary" />
                  <strong>Perusahaan:</strong> {customer.company_name}
                </p>
              )}
            </Col>
            <Col md={6}>
              <p className="mb-2">
                <FaMapMarkerAlt className="me-2 text-primary" />
                <strong>Alamat:</strong> {customer.address || '-'}
              </p>
              <p className="mb-2">
                <strong>Kota:</strong> {customer.city || '-'}
              </p>
              <p className="mb-2">
                <strong>Provinsi:</strong> {customer.province || '-'}
              </p>
              <p className="mb-2">
                <strong>Kode Pos:</strong> {customer.postal_code || '-'}
              </p>
              <p className="mb-2">
                <strong>Status:</strong>{' '}
                <Badge bg={customer.is_active ? 'success' : 'secondary'}>
                  {customer.is_active ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
              </p>
            </Col>
          </Row>
          
          {customer.notes && (
            <div className="mt-3">
              <strong>Catatan:</strong>
              <p className="mb-0">{customer.notes}</p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">Riwayat Order</h5>
        </Card.Header>
        <Card.Body>
          {orders.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead className="table-light">
                  <tr>
                    <th>No. Order</th>
                    <th>Tanggal</th>
                    <th>Status</th>
                    <th>Total</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number || `#${order.id}`}</td>
                      <td>{new Date(order.order_date).toLocaleDateString()}</td>
                      <td>
                        <Badge bg={
                          order.status?.name === 'Selesai' ? 'success' :
                          order.status?.name === 'Proses' ? 'primary' :
                          order.status?.name === 'Batal' ? 'danger' :
                          'secondary'
                        }>
                          {order.status?.name || 'Pending'}
                        </Badge>
                      </td>
                      <td>
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        }).format(order.total || 0)}
                      </td>
                      <td>
                        <Link to={`/order/${order.id}`} className="btn btn-sm btn-outline-primary">
                          Lihat Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-3">Pelanggan belum memiliki riwayat order.</p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerDetail;