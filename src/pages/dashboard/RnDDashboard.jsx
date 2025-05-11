import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, ProgressBar, Tabs, Tab } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFlask, faClock, faCheckCircle, faBullseye } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL, CURRENCY_OPTIONS } from '../../config/constants';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const RnDDashboard = () => {
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    prototypes: 0,
    upcomingProjects: 0
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // API call here
        // Gunakan data dummy untuk sementara
        setStats({
          activeProjects: 5,
          completedProjects: 12,
          prototypes: 3,
          upcomingProjects: 2
        });
        
        setProjects([
          { 
            id: 'PRJ001', 
            name: 'Trophy Akrilik LED', 
            lead: 'Andi Wijaya', 
            startDate: '2025-03-15', 
            dueDate: '2025-06-20', 
            progress: 75, 
            status: 'active',
            description: 'Pengembangan trophy akrilik dengan LED yang dapat diprogram'
          },
          { 
            id: 'PRJ002', 
            name: 'Sign Akrilik Solar', 
            lead: 'Budi Santoso', 
            startDate: '2025-04-01', 
            dueDate: '2025-07-15', 
            progress: 30, 
            status: 'active',
            description: 'Sign akrilik dengan panel surya untuk penghematan energi'
          },
          { 
            id: 'PRJ003', 
            name: 'Stand Display Interaktif', 
            lead: 'Citra Dewi', 
            startDate: '2025-02-10', 
            dueDate: '2025-05-20', 
            progress: 90, 
            status: 'active',
            description: 'Stand display dengan layar sentuh untuk interaksi'
          },
          { 
            id: 'PRJ004', 
            name: 'Plakat Akrilik Sustainable', 
            lead: 'Deni Pratama', 
            startDate: '2025-01-05', 
            dueDate: '2025-04-15', 
            progress: 100, 
            status: 'completed',
            description: 'Plakat akrilik dengan bahan ramah lingkungan'
          },
          { 
            id: 'PRJ005', 
            name: 'Box Akrilik Modular', 
            lead: 'Eva Susanti', 
            startDate: '2025-06-01', 
            dueDate: '2025-09-15', 
            progress: 0, 
            status: 'upcoming',
            description: 'Box akrilik yang dapat disusun modular sesuai kebutuhan'
          }
        ]);
      } catch (error) {
        console.error('Error fetching RnD dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <Badge bg="primary">Aktif</Badge>;
      case 'completed':
        return <Badge bg="success">Selesai</Badge>;
      case 'upcoming':
        return <Badge bg="info">Akan Datang</Badge>;
      case 'on-hold':
        return <Badge bg="warning">Tertunda</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getProgressVariant = (progress) => {
    if (progress < 25) return 'danger';
    if (progress < 50) return 'warning';
    if (progress < 75) return 'info';
    return 'success';
  };

  const filteredProjects = projects.filter(project => {
    if (activeTab === 'active') return project.status === 'active';
    if (activeTab === 'completed') return project.status === 'completed';
    if (activeTab === 'upcoming') return project.status === 'upcoming';
    return true;
  });

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Research & Development</h1>
      <p className="dashboard-subtitle">Pengembangan produk dan inovasi</p>

      <Row className="stat-cards">
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faFlask} />
              </div>
              <div className="stat-details">
                <h3>{stats.activeProjects}</h3>
                <p>Proyek Aktif</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="stat-details">
                <h3>{stats.completedProjects}</h3>
                <p>Proyek Selesai</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon purple">
                <FontAwesomeIcon icon={faBullseye} />
              </div>
              <div className="stat-details">
                <h3>{stats.prototypes}</h3>
                <p>Prototype</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon orange">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="stat-details">
                <h3>{stats.upcomingProjects}</h3>
                <p>Proyek Akan Datang</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="active" title="Proyek Aktif" />
                <Tab eventKey="completed" title="Proyek Selesai" />
                <Tab eventKey="upcoming" title="Akan Datang" />
              </Tabs>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nama Proyek</th>
                    <th>PIC</th>
                    <th>Mulai</th>
                    <th>Target Selesai</th>
                    <th>Progress</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr key={project.id}>
                      <td>{project.id}</td>
                      <td>{project.name}</td>
                      <td>{project.lead}</td>
                      <td>{new Date(project.startDate).toLocaleDateString('id-ID')}</td>
                      <td>{new Date(project.dueDate).toLocaleDateString('id-ID')}</td>
                      <td style={{ width: '15%' }}>
                        <ProgressBar 
                          now={project.progress} 
                          label={`${project.progress}%`}
                          variant={getProgressVariant(project.progress)}
                        />
                      </td>
                      <td>{getStatusBadge(project.status)}</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          href={`/rnd/projects/${project.id}`}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" href="/rnd/projects">Lihat Semua Proyek</Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Kalender Milestone</Card.Header>
            <Card.Body>
              <div className="calendar-placeholder" style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '5px' }}>
                <p className="text-muted">Kalender milestone akan ditampilkan di sini</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Ide & Inovasi Terbaru</Card.Header>
            <Card.Body>
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Akrilik dengan LED RGB
                  <Badge bg="primary" pill>New</Badge>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Stand Akrilik Lipat
                  <Badge bg="primary" pill>New</Badge>
                </li>
                <li className="list-group-item">Plakat Akrilik dengan Material Daur Ulang</li>
                <li className="list-group-item">Box Display Interaktif</li>
                <li className="list-group-item">Trophy Akrilik dengan Suara</li>
              </ul>
            </Card.Body>
            <Card.Footer>
              <Button variant="primary" href="/rnd/ideas">Tambah Ide Baru</Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RnDDashboard;