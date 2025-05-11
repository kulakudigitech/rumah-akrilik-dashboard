import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form, Tab, Tabs, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faUserCheck, faCalendarAlt, faFileAlt, 
  faChartLine, faSearch, faFileUpload, faSort, faSortUp, faSortDown
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL, CURRENCY_OPTIONS } from '../../config/constants';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const HRDDashboard = () => {
  // States untuk data karyawan
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daftar-karyawan');

  // State untuk absensi
  const [attendance, setAttendance] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  // State untuk penilaian kinerja
  const [performanceReviews, setPerformanceReviews] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch data dari API - gunakan data dummy untuk development
        const dummyEmployees = [
          {
            id: 1,
            name: 'Budi Santoso',
            position: 'Designer Senior',
            department: 'Design',
            joinDate: '2022-03-15',
            status: 'active',
            performanceRating: 4.5,
            documents: ['cv', 'ktp', 'ijazah', 'sertifikat']
          },
          {
            id: 2,
            name: 'Andi Wijaya',
            position: 'Operator Mesin',
            department: 'Produksi',
            joinDate: '2021-06-20',
            status: 'active',
            performanceRating: 4.2,
            documents: ['cv', 'ktp', 'ijazah']
          },
          {
            id: 3,
            name: 'Siti Rahayu',
            position: 'Staff Admin',
            department: 'Admin',
            joinDate: '2023-01-10',
            status: 'active',
            performanceRating: 3.8,
            documents: ['cv', 'ktp', 'ijazah']
          },
          {
            id: 4,
            name: 'Deni Pratama',
            position: 'Marketing Officer',
            department: 'Marketing',
            joinDate: '2022-10-05',
            status: 'active',
            performanceRating: 4.0,
            documents: ['cv', 'ktp', 'ijazah', 'portofolio']
          },
          {
            id: 5,
            name: 'Citra Dewi',
            position: 'Finishing Staff',
            department: 'Produksi',
            joinDate: '2023-04-12',
            status: 'active',
            performanceRating: 3.7,
            documents: ['cv', 'ktp']
          },
        ];

        // Data absensi dummy
        const dummyAttendance = [
          { id: 1, employeeId: 1, name: 'Budi Santoso', date: '2025-05-11', checkIn: '07:55', checkOut: '17:05', status: 'present' },
          { id: 2, employeeId: 2, name: 'Andi Wijaya', date: '2025-05-11', checkIn: '08:02', checkOut: '17:00', status: 'present' },
          { id: 3, employeeId: 3, name: 'Siti Rahayu', date: '2025-05-11', checkIn: '07:50', checkOut: '17:15', status: 'present' },
          { id: 4, employeeId: 4, name: 'Deni Pratama', date: '2025-05-11', checkIn: '08:15', checkOut: '17:10', status: 'late' },
          { id: 5, employeeId: 5, name: 'Citra Dewi', date: '2025-05-11', checkIn: '', checkOut: '', status: 'absent' },
        ];

        // Data penilaian kinerja dummy
        const dummyPerformance = [
          { 
            id: 1, 
            employeeId: 1, 
            name: 'Budi Santoso',
            period: 'Q1 2025',
            ratings: {
              productivity: 4.5,
              quality: 4.7,
              teamwork: 4.2,
              initiative: 4.5,
              punctuality: 4.6
            },
            averageRating: 4.5,
            comments: 'Kinerja sangat baik, konsisten menghasilkan desain berkualitas tinggi.',
            reviewedBy: 'Supervisor Design',
            reviewDate: '2025-03-30'
          },
          { 
            id: 2, 
            employeeId: 2, 
            name: 'Andi Wijaya',
            period: 'Q1 2025',
            ratings: {
              productivity: 4.3,
              quality: 4.0,
              teamwork: 4.5,
              initiative: 3.8,
              punctuality: 4.4
            },
            averageRating: 4.2,
            comments: 'Bekerja dengan baik dan efisien, perlu peningkatan dalam inisiatif.',
            reviewedBy: 'Supervisor Produksi',
            reviewDate: '2025-03-28'
          },
          { 
            id: 3, 
            employeeId: 3, 
            name: 'Siti Rahayu',
            period: 'Q1 2025',
            ratings: {
              productivity: 3.8,
              quality: 3.7,
              teamwork: 4.0,
              initiative: 3.7,
              punctuality: 3.8
            },
            averageRating: 3.8,
            comments: 'Bekerja dengan baik, masih perlu bimbingan dalam beberapa tugas administratif.',
            reviewedBy: 'Kepala Admin',
            reviewDate: '2025-03-29'
          }
        ];

        setEmployees(dummyEmployees);
        setFilteredEmployees(dummyEmployees);
        setAttendance(dummyAttendance);
        setPerformanceReviews(dummyPerformance);
        
      } catch (error) {
        console.error('Error fetching HRD data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Hitung masa kerja dalam tahun dan bulan
  const calculateServicePeriod = (joinDate) => {
    const join = new Date(joinDate);
    const today = new Date();
    
    let years = today.getFullYear() - join.getFullYear();
    let months = today.getMonth() - join.getMonth();
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return `${years} tahun ${months} bulan`;
  };

  // Handle pencarian karyawan
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    const filtered = employees.filter(employee => 
      employee.name.toLowerCase().includes(term) || 
      employee.position.toLowerCase().includes(term) ||
      employee.department.toLowerCase().includes(term)
    );
    
    setFilteredEmployees(filtered);
  };

  // Sort data karyawan
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
    
    const sortedData = [...filteredEmployees].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredEmployees(sortedData);
  };

  // Render icon for current sort direction
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FontAwesomeIcon icon={faSort} className="ms-1 text-muted" />;
    if (sortConfig.direction === 'ascending') return <FontAwesomeIcon icon={faSortUp} className="ms-1" />;
    return <FontAwesomeIcon icon={faSortDown} className="ms-1" />;
  };

  // Get badge untuk status karyawan
  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <Badge bg="success">Aktif</Badge>;
      case 'inactive':
        return <Badge bg="danger">Tidak Aktif</Badge>;
      case 'leave':
        return <Badge bg="warning">Cuti</Badge>;
      case 'probation':
        return <Badge bg="info">Masa Percobaan</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Get status absensi
  const getAttendanceStatusBadge = (status) => {
    switch(status) {
      case 'present':
        return <Badge bg="success">Hadir</Badge>;
      case 'late':
        return <Badge bg="warning">Terlambat</Badge>;
      case 'absent':
        return <Badge bg="danger">Tidak Hadir</Badge>;
      case 'leave':
        return <Badge bg="info">Cuti</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Format rating dengan stars
  const formatRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return (
      <div>
        {[...Array(fullStars)].map((_, i) => <span key={`full-${i}`} className="text-warning">★</span>)}
        {halfStar && <span className="text-warning">★</span>}
        {[...Array(emptyStars)].map((_, i) => <span key={`empty-${i}`} className="text-muted">☆</span>)}
        <span className="ms-1">({rating})</span>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard HRD</h1>
      <p className="dashboard-subtitle">Manajemen sumber daya manusia</p>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="daftar-karyawan" title="Daftar Karyawan">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faUsers} className="me-2" /> 
                    Daftar Karyawan
                  </h5>
                </div>
                <div className="d-flex">
                  <Form.Control
                    type="search"
                    placeholder="Cari karyawan..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="me-2"
                    style={{ width: '250px' }}
                  />
                  <Button variant="primary">
                    <FontAwesomeIcon icon={faUserCheck} className="me-2" /> 
                    Tambah Karyawan
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('name')}>
                      Nama {getSortIcon('name')}
                    </th>
                    <th onClick={() => requestSort('position')}>
                      Jabatan {getSortIcon('position')}
                    </th>
                    <th onClick={() => requestSort('department')}>
                      Departemen {getSortIcon('department')}
                    </th>
                    <th onClick={() => requestSort('joinDate')}>
                      Tanggal Bergabung {getSortIcon('joinDate')}
                    </th>
                    <th>Masa Kerja</th>
                    <th onClick={() => requestSort('status')}>
                      Status {getSortIcon('status')}
                    </th>
                    <th>Penilaian</th>
                    <th>Dokumen</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(employee => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{employee.position}</td>
                      <td>{employee.department}</td>
                      <td>{new Date(employee.joinDate).toLocaleDateString('id-ID')}</td>
                      <td>{calculateServicePeriod(employee.joinDate)}</td>
                      <td>{getStatusBadge(employee.status)}</td>
                      <td>{formatRating(employee.performanceRating)}</td>
                      <td>
                        <Button variant="outline-secondary" size="sm">
                          <FontAwesomeIcon icon={faFileAlt} className="me-1" /> 
                          {employee.documents.length}
                        </Button>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-1">Detail</Button>
                        <Button variant="outline-success" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="absensi" title="Absensi Karyawan">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" /> 
                  Absensi Karyawan
                </h5>
                <div className="d-flex">
                  <Form.Control
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="me-2"
                  />
                  <Button variant="primary">
                    Export Data
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Departemen</th>
                    <th>Tanggal</th>
                    <th>Jam Masuk</th>
                    <th>Jam Keluar</th>
                    <th>Status</th>
                    <th>Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map(record => (
                    <tr key={record.id}>
                      <td>{record.name}</td>
                      <td>{employees.find(emp => emp.id === record.employeeId)?.department || '-'}</td>
                      <td>{new Date(record.date).toLocaleDateString('id-ID')}</td>
                      <td>{record.checkIn || '-'}</td>
                      <td>{record.checkOut || '-'}</td>
                      <td>{getAttendanceStatusBadge(record.status)}</td>
                      <td>
                        <Button variant="link" size="sm">Tambah Catatan</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="penilaian-kinerja" title="Penilaian Kinerja">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faChartLine} className="me-2" /> 
                  Penilaian Kinerja Karyawan
                </h5>
                <div>
                  <Button variant="primary">
                    Tambah Penilaian
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {performanceReviews.map(review => (
                <Card key={review.id} className="mb-3">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">{review.name} - {review.period}</h6>
                      <div>
                        {formatRating(review.averageRating)}
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <h6>Aspek Penilaian:</h6>
                        <Table size="sm">
                          <tbody>
                            <tr>
                              <td>Produktivitas</td>
                              <td>{review.ratings.productivity}</td>
                            </tr>
                            <tr>
                              <td>Kualitas Kerja</td>
                              <td>{review.ratings.quality}</td>
                            </tr>
                            <tr>
                              <td>Kerja Tim</td>
                              <td>{review.ratings.teamwork}</td>
                            </tr>
                            <tr>
                              <td>Inisiatif</td>
                              <td>{review.ratings.initiative}</td>
                            </tr>
                            <tr>
                              <td>Kedisiplinan</td>
                              <td>{review.ratings.punctuality}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <h6>Komentar:</h6>
                        <p>{review.comments}</p>
                        <div className="text-muted small">
                          Dinilai oleh: {review.reviewedBy}<br />
                          Tanggal: {new Date(review.reviewDate).toLocaleDateString('id-ID')}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="text-end">
                    <Button variant="outline-primary" size="sm">Detail</Button>
                  </Card.Footer>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="dokumen" title="Dokumen Karyawan">
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FontAwesomeIcon icon={faFileAlt} className="me-2" /> 
                  Dokumen Karyawan
                </h5>
                <Form.Control
                  type="search"
                  placeholder="Cari dokumen..."
                  style={{ width: '250px' }}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                {employees.map(employee => (
                  <Col lg={4} md={6} className="mb-3" key={employee.id}>
                    <Card>
                      <Card.Header>
                        <h6 className="mb-0">{employee.name}</h6>
                        <small className="text-muted">{employee.position}</small>
                      </Card.Header>
                      <Card.Body>
                        <div className="document-list">
                          {employee.documents.includes('cv') && (
                            <div className="document-item">
                              <FontAwesomeIcon icon={faFileAlt} className="me-2 text-primary" />
                              CV
                              <Button variant="link" size="sm" className="ms-2">Lihat</Button>
                            </div>
                          )}
                          {employee.documents.includes('ktp') && (
                            <div className="document-item">
                              <FontAwesomeIcon icon={faFileAlt} className="me-2 text-danger" />
                              KTP
                              <Button variant="link" size="sm" className="ms-2">Lihat</Button>
                            </div>
                          )}
                          {employee.documents.includes('ijazah') && (
                            <div className="document-item">
                              <FontAwesomeIcon icon={faFileAlt} className="me-2 text-success" />
                              Ijazah
                              <Button variant="link" size="sm" className="ms-2">Lihat</Button>
                            </div>
                          )}
                          {employee.documents.includes('sertifikat') && (
                            <div className="document-item">
                              <FontAwesomeIcon icon={faFileAlt} className="me-2 text-warning" />
                              Sertifikat
                              <Button variant="link" size="sm" className="ms-2">Lihat</Button>
                            </div>
                          )}
                          {employee.documents.includes('portofolio') && (
                            <div className="document-item">
                              <FontAwesomeIcon icon={faFileAlt} className="me-2 text-info" />
                              Portofolio
                              <Button variant="link" size="sm" className="ms-2">Lihat</Button>
                            </div>
                          )}
                        </div>
                      </Card.Body>
                      <Card.Footer>
                        <Button variant="outline-primary" size="sm">
                          <FontAwesomeIcon icon={faFileUpload} className="me-1" /> 
                          Upload Dokumen
                        </Button>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default HRDDashboard;