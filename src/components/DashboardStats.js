import React from 'react';
import { Row, Col, Card, Spinner } from 'react-bootstrap';

const DashboardStats = ({ loading = false, data = {} }) => {
  // Format angka ke format mata uang Rupiah
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Row>
        {[1, 2, 3, 4].map(i => (
          <Col key={i} lg={3} md={6} className="mb-4">
            <Card className="h-100 dashboard-card">
              <Card.Body className="d-flex justify-content-center align-items-center" style={{ minHeight: '150px' }}>
                <Spinner animation="border" variant="secondary" />
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  // Ekstrak data dari props, dengan nilai default
  const orderBaru = data.order_baru || 0;
  const orderProses = data.order_proses || 0;
  const orderSelesai = data.order_selesai || 0;
  const pendapatanBulanIni = data.pendapatan_bulan_ini || 0;

  return (
    <Row>
      <Col lg={3} md={6} className="mb-4">
        <Card className="h-100 dashboard-card border-left-primary">
          <Card.Body>
            <h6 className="card-subtitle mb-2 text-muted">Order Baru</h6>
            <h2 className="card-title">{orderBaru}</h2>
            <p className="card-text text-muted small">Perlu diproses segera</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={3} md={6} className="mb-4">
        <Card className="h-100 dashboard-card border-left-info">
          <Card.Body>
            <h6 className="card-subtitle mb-2 text-muted">Sedang Diproses</h6>
            <h2 className="card-title">{orderProses}</h2>
            <p className="card-text text-muted small">Order dalam pengerjaan</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={3} md={6} className="mb-4">
        <Card className="h-100 dashboard-card border-left-success">
          <Card.Body>
            <h6 className="card-subtitle mb-2 text-muted">Order Selesai</h6>
            <h2 className="card-title">{orderSelesai}</h2>
            <p className="card-text text-muted small">Bulan ini</p>
          </Card.Body>
        </Card>
      </Col>
      
      <Col lg={3} md={6} className="mb-4">
        <Card className="h-100 dashboard-card border-left-warning">
          <Card.Body>
            <h6 className="card-subtitle mb-2 text-muted">Pendapatan</h6>
            <h2 className="card-title">{formatCurrency(pendapatanBulanIni)}</h2>
            <p className="card-text text-muted small">Bulan ini</p>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default DashboardStats;