import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faMoneyBillWave, faChartLine, 
  faMapMarkerAlt, faCalendarCheck, faPhoneAlt, faBuilding
} from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import axios from 'axios';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const RetailRepDashboard = () => {
  const [stats, setStats] = useState({
    totalVisits: 0,
    completedVisits: 0,
    closingRate: 0,
    totalOmset: 0
  });
  const [chartData, setChartData] = useState({});
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitFormVisible, setVisitFormVisible] = useState(false);

  useEffect(() => {
    // Fetch data when component mounts
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, these would be API calls
        // For now we'll use dummy data
        
        // Fetch stats
        setStats({
          totalVisits: 28,
          completedVisits: 22,
          closingRate: 32.14,
          totalOmset: 24750000
        });
        
        // Fetch chart data
        setChartData({
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
          datasets: [
            {
              label: 'Visits',
              data: [5, 8, 6, 7, 2],
              borderColor: '#007bff',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Closing',
              data: [1, 3, 2, 2, 1],
              borderColor: '#28a745',
              backgroundColor: 'rgba(40, 167, 69, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        });
        
        // Fetch visits
        setVisits([
          { 
            id: 1, 
            date: '2025-05-12', 
            time: '09:30', 
            companyName: 'PT Global Express',
            contactPerson: 'Budi Santoso',
            contactPhone: '081234567890',
            status: 'completed',
            result: 'Order Placed'
          },
          { 
            id: 2, 
            date: '2025-05-13', 
            time: '11:00', 
            companyName: 'Martabak Manis Co',
            contactPerson: 'Anita Wijaya',
            contactPhone: '082345678901',
            status: 'completed',
            result: 'Follow Up Next Week'
          },
          { 
            id: 3, 
            date: '2025-05-14', 
            time: '14:00', 
            companyName: 'Klinik Sehat',
            contactPerson: 'Dr. Hendra',
            contactPhone: '083456789012',
            status: 'planned',
            result: null
          },
          { 
            id: 4, 
            date: '2025-05-15', 
            time: '10:30', 
            companyName: 'CV Maju Jaya',
            contactPerson: 'Dewi Susanti',
            contactPhone: '084567890123',
            status: 'planned',
            result: null
          }
        ]);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Terjadi kesalahan saat mengambil data. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Toggle visit plan form
  const toggleVisitPlanForm = () => {
    setVisitFormVisible(!visitFormVisible);
  };
  
  // Handle form reset
  const handleResetVisitPlan = () => {
    setVisitDate('');
    setVisitTime('');
    setCompanyName('');
    setAddress('');
    setContactPerson('');
    setContactPhone('');
    setVisitPurpose('');
  };
  
  // Handle form submit
  const handleSubmitVisitPlan = (e) => {
    e.preventDefault();
    // In a real implementation, this would be an API call
    alert('Plan kunjungan berhasil disimpan!');
    handleResetVisitPlan();
    setVisitFormVisible(false);
  };
  
  // Handle visit completion
  const handleCompleteVisit = (id) => {
    // In a real implementation, this would be an API call
    alert(`Visit ID ${id} ditandai selesai`);
  };
  
  // Handle WhatsApp click
  const handleWhatsAppClick = (phone) => {
    window.open(`https://wa.me/${phone.replace(/^0/, '62')}`, '_blank');
  };
  
  // Get status badge
  const getStatusBadge = (status) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'planned':
        return <Badge bg="primary">Planned</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  // Calculate filtered visits
  const plannedVisits = visits.filter(visit => visit.status === 'planned');
  const completedVisits = visits.filter(visit => visit.status === 'completed');
  
  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }
  
  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Retail Representative</h1>
      <p className="dashboard-subtitle">Manajemen kunjungan dan lead retail</p>

      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Plan Kunjungan Minggu Depan</h5>
          <Button variant="primary" size="sm" onClick={toggleVisitPlanForm}>
            {visitFormVisible ? 'Tutup Form' : 'Tambah Plan'}
          </Button>
        </Card.Header>
        
        {visitFormVisible && (
          <Card.Body>
            <Form onSubmit={handleSubmitVisitPlan}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tanggal Kunjungan</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Waktu</Form.Label>
                    <Form.Control 
                      type="time" 
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Nama Perusahaan/Toko</Form.Label>
                <Form.Control 
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Alamat</Form.Label>
                <Form.Control 
                  as="textarea"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Kontak Person</Form.Label>
                    <Form.Control 
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nomor HP</Form.Label>
                    <Form.Control 
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Catatan/Tujuan Kunjungan</Form.Label>
                <Form.Control 
                  as="textarea"
                  rows={2}
                  value={visitPurpose}
                  onChange={(e) => setVisitPurpose(e.target.value)}
                  required
                />
              </Form.Group>
              
              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={handleResetVisitPlan}>
                  Reset
                </Button>
                <Button variant="success" type="submit">
                  Simpan Plan Kunjungan
                </Button>
              </div>
            </Form>
          </Card.Body>
        )}
      </Card>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </div>
              <div className="stat-details">
                <h3>{stats.totalVisits}</h3>
                <p>Total Kunjungan</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faCalendarCheck} />
              </div>
              <div className="stat-details">
                <h3>{stats.completedVisits}</h3>
                <p>Kunjungan Selesai</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon yellow">
                <FontAwesomeIcon icon={faChartLine} />
              </div>
              <div className="stat-details">
                <h3>{stats.closingRate}%</h3>
                <p>Closing Rate</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon purple">
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.totalOmset)}</h3>
                <p>Total Omset</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Statistik Kunjungan & Closing</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '300px' }}>
                <Line 
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { beginAtZero: true }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Kunjungan Dijadwalkan</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Perusahaan</th>
                      <th>Kontak</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedVisits.map(visit => (
                      <tr key={visit.id}>
                        <td>{visit.date} {visit.time}</td>
                        <td>{visit.companyName}</td>
                        <td>{visit.contactPerson}</td>
                        <td>
                          <Button variant="success" size="sm" className="me-1" onClick={() => handleCompleteVisit(visit.id)}>
                            Selesai
                          </Button>
                          <Button variant="info" size="sm" onClick={() => handleWhatsAppClick(visit.contactPhone)}>
                            <FontAwesomeIcon icon={faPhoneAlt} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {plannedVisits.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center">Tidak ada kunjungan terjadwal</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Kunjungan Selesai</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Perusahaan</th>
                      <th>Hasil</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedVisits.map(visit => (
                      <tr key={visit.id}>
                        <td>{visit.date}</td>
                        <td>{visit.companyName}</td>
                        <td>{visit.result || '-'}</td>
                        <td>
                          <Button variant="info" size="sm" className="me-1">Detail</Button>
                          <Button variant="success" size="sm" href="/form-input-order">
                            Order
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {completedVisits.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center">Tidak ada kunjungan selesai</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" href="/tools/form-realisasi-kunjungan">Input Realisasi Kunjungan</Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RetailRepDashboard;