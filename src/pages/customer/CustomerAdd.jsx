import React, { useState } from 'react';
import { Container, Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const CustomerAdd = () => {
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    notes: '',
    company_name: '',
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCustomer({
      ...customer,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem('jwtToken');
      
      await axios.post('https://rumahakrilik.id/api/customers/', customer, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Data pelanggan baru berhasil disimpan');
      navigate('/customers');
    } catch (err) {
      console.error('Error creating customer:', err);
      setError('Gagal menyimpan data pelanggan. Silakan coba lagi.');
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Tambah Pelanggan Baru</h2>
        <Button 
          as={Link} 
          to="/customers" 
          variant="outline-secondary"
          size="sm"
        >
          <FaArrowLeft className="me-1" /> Kembali ke Daftar
        </Button>
      </div>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Pelanggan *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={customer.name}
                    onChange={handleChange}
                    required
                    placeholder="Masukkan nama pelanggan"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nomor Telepon *</Form.Label>
                  <Form.Control
                    type="text"
                    name="phone"
                    value={customer.phone}
                    onChange={handleChange}
                    required
                    placeholder="Contoh: 08123456789"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={customer.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                  />
                  <Form.Text className="text-muted">
                    Opsional, namun membantu untuk komunikasi
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Perusahaan</Form.Label>
                  <Form.Control
                    type="text"
                    name="company_name"
                    value={customer.company_name}
                    onChange={handleChange}
                    placeholder="Kosongkan jika pelanggan individu"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Alamat</Form.Label>
              <Form.Control
                as="textarea"
                name="address"
                value={customer.address}
                onChange={handleChange}
                rows={2}
                placeholder="Alamat lengkap"
              />
            </Form.Group>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kota</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={customer.city}
                    onChange={handleChange}
                    placeholder="Nama kota"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Provinsi</Form.Label>
                  <Form.Control
                    type="text"
                    name="province"
                    value={customer.province}
                    onChange={handleChange}
                    placeholder="Nama provinsi"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kode Pos</Form.Label>
                  <Form.Control
                    type="text"
                    name="postal_code"
                    value={customer.postal_code}
                    onChange={handleChange}
                    placeholder="Contoh: 12345"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Catatan</Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                value={customer.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Catatan tambahan (opsional)"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Pelanggan Aktif"
                name="is_active"
                checked={customer.is_active}
                onChange={handleChange}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/customers')}
                disabled={saving}
              >
                <FaTimes className="me-1" /> Batal
              </Button>
              <Button 
                type="submit" 
                variant="success"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <FaSave className="me-1" /> Simpan
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerAdd;