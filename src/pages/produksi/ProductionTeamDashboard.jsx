import React, { useState, useEffect, useMemo } from 'react';
import { Card, Row, Col, Alert, Button, Spinner, ListGroup, Badge, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTasks, faCheck } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './ProductionTeamDashboard.css';
import { API_URL } from '../../config/constants';

// Registrasi komponen Chart.js yang diperlukan
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProductionTeamDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [filterStage, setFilterStage] = useState('all');
  const [sortBy, setSortBy] = useState('deadline'); // 'deadline', 'priority', 'customer'
  const [performanceData, setPerformanceData] = useState({
    labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    datasets: [
      {
        label: 'Tugas Diselesaikan',
        data: [5, 7, 4, 6, 8, 3],
        borderColor: '#4e73df',
        backgroundColor: 'rgba(78, 115, 223, 0.1)',
      }
    ]
  });
  const [taskNotes, setTaskNotes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          setError('Anda perlu login untuk mengakses halaman ini');
          toast.error("Sesi login Anda telah berakhir. Silakan login kembali.");
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        const userRolesStr = localStorage.getItem('userRoles');
        let roles = [];
        
        try {
          if (userRolesStr) {
            const parsedRoles = JSON.parse(userRolesStr);
            
            if (Array.isArray(parsedRoles)) {
              roles = parsedRoles.map(role => {
                if (typeof role === 'string') return role;
                if (role && typeof role === 'object' && role.name) return role.name;
                return '';
              }).filter(Boolean);
            } else if (typeof parsedRoles === 'string') {
              roles = [parsedRoles];
            } else if (parsedRoles && typeof parsedRoles === 'object' && parsedRoles.name) {
              roles = [parsedRoles.name];
            }
          }
        } catch (parseError) {
          console.error('Error parsing user roles:', parseError);
          const role = localStorage.getItem('role');
          if (role) roles = [role];
        }
        
        setUserRoles(roles);
        console.log("Loaded user roles:", roles);
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
    fetchProductionData();
  }, [navigate]);

  useEffect(() => {
    // Cek pekerjaan dengan deadline mendekati
    const nearDeadlineTasks = myAssignments.filter(task => {
      const deadline = new Date(task.deadline);
      const today = new Date();
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 2 && task.status !== 'completed';
    });
    
    // Tampilkan notifikasi
    nearDeadlineTasks.forEach(task => {
      toast.warning(`Deadline mendekati: ${task.productName} (${new Date(task.deadline).toLocaleDateString('id-ID')})`);
    });
  }, [myAssignments]);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      // Coba ambil dari production-tracking API
      try {
        const taskResponse = await axios.get(`${API_URL}/production-tracking/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (taskResponse.data && Array.isArray(taskResponse.data)) {
          // Format data dari API untuk digunakan di UI
          const formattedTasks = taskResponse.data.map(task => ({
            id: task.order_id || task.id,
            trackingId: task.id,
            customerName: task.customer_name || 'Unknown Customer',
            productName: task.product_name || 'Unknown Product',
            stageName: task.stage_name || 'Unspecified',
            deadline: task.deadline || new Date().toISOString(),
            priority: task.priority || 'medium',
            status: task.status || 'pending',
            progress: task.progress || 0
          }));
          
          // Pisahkan tugas yang tersedia dan tugas yang diklaim
          const available = formattedTasks.filter(task => 
            task.status === 'pending' || task.status === 'available'
          );
          
          const assigned = formattedTasks.filter(task => 
            task.status === 'in-progress' || task.status === 'claimed' || task.status === 'completed'
          );
          
          setAvailableOrders(available);
          setMyAssignments(assigned);
        }
      } catch (apiError) {
        console.error('Error fetching from production-tracking API:', apiError);
        // Jika API gagal, gunakan dummy data
        fetchDummyData();
      }
    } catch (error) {
      console.error('Error in fetchProductionData:', error);
      fetchDummyData();
    } finally {
      setLoading(false);
    }
  };

  const claimTask = async (trackingId, orderId) => {
    try {
      setLoading(true);
      
      // Panggil API untuk klaim tugas
      await axios.post(`${API_URL}/production-tracking/${trackingId}/claim/`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      toast.success('Tugas berhasil diklaim!');
      
      // Update state lokal
      setAvailableOrders(prevOrders => 
        prevOrders.filter(order => order.trackingId !== trackingId)
      );
      
      const claimedOrder = availableOrders.find(order => order.trackingId === trackingId);
      if (claimedOrder) {
        setMyAssignments(prev => [...prev, {
          ...claimedOrder,
          claimedAt: new Date().toISOString(),
          status: 'in-progress',
          progress: 0
        }]);
      }
      
    } catch (error) {
      console.error('Error claiming task:', error);
      toast.error('Gagal mengklaim tugas, silakan coba lagi');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchDummyData = () => {
    setTimeout(() => {
      const dummyAvailableTasks = [
        {
          id: 'ORD-001',
          trackingId: 'TRK-001',
          customerName: 'PT Maju Jaya',
          productName: 'Plakat Akrilik Premium',
          stageName: 'Finishing',
          deadline: '2025-05-20',
          priority: 'high'
        },
        {
          id: 'ORD-002',
          trackingId: 'TRK-002',
          customerName: 'Toko Berkah',
          productName: 'Neon Box Akrilik',
          stageName: 'Quality Control',
          deadline: '2025-05-18',
          priority: 'medium'
        },
        {
          id: 'ORD-003',
          trackingId: 'TRK-003',
          customerName: 'Restoran Selera',
          productName: 'Akrilik Display Menu',
          stageName: 'Finishing',
          deadline: '2025-05-15',
          priority: 'high'
        }
      ];
      
      const dummyMyAssignments = [
        {
          id: 'ORD-005',
          trackingId: 'TRK-005',
          customerName: 'Hotel Grand',
          productName: 'Signage Akrilik',
          stageName: 'Finishing',
          deadline: '2025-05-14',
          claimedAt: '2025-05-10T09:30:00',
          status: 'in-progress',
          progress: 60
        },
        {
          id: 'ORD-006',
          trackingId: 'TRK-006',
          customerName: 'Klinik Sehat',
          productName: 'Logo 3D Akrilik',
          stageName: 'Quality Control',
          deadline: '2025-05-12',
          claimedAt: '2025-05-09T14:20:00',
          status: 'in-progress',
          progress: 85
        }
      ];
      
      setAvailableOrders(dummyAvailableTasks);
      setMyAssignments(dummyMyAssignments);
      setLoading(false);
    }, 800);
  };

  const markAsCompleted = (trackingId) => {
    setMyAssignments(prev => 
      prev.map(assignment => 
        assignment.trackingId === trackingId 
          ? { ...assignment, status: 'completed', progress: 100 } 
          : assignment
      )
    );
    toast.success('Tugas berhasil diselesaikan!');
  };

  const updateProgress = async (trackingId, newProgress) => {
    try {
      setLoading(true);
      await axios.patch(`${API_URL}/production-tracking/${trackingId}/`, {
        progress: newProgress
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` }
      });
      
      // Update local state
      setMyAssignments(prev => 
        prev.map(assignment => 
          assignment.trackingId === trackingId 
            ? { ...assignment, progress: newProgress } 
            : assignment
        )
      );
      
      toast.success('Progress berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Gagal memperbarui progress');
    } finally {
      setLoading(false);
    }
  };

  const addTaskNote = (trackingId, note) => {
    setTaskNotes(prev => ({
      ...prev,
      [trackingId]: [...(prev[trackingId] || []), {
        text: note,
        timestamp: new Date().toISOString(),
        user: localStorage.getItem('username')
      }]
    }));
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...availableOrders];
    
    // Filter by stage
    if (filterStage !== 'all') {
      filtered = filtered.filter(order => order.stageName === filterStage);
    }
    
    // Sort orders
    return filtered.sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (sortBy === 'priority') {
        const priorityValue = { high: 3, medium: 2, low: 1 };
        return priorityValue[b.priority] - priorityValue[a.priority];
      } else if (sortBy === 'customer') {
        return a.customerName.localeCompare(b.customerName);
      }
      return 0;
    });
  }, [availableOrders, filterStage, sortBy]);

  const renderPriorityBadge = (priority) => {
    switch(priority) {
      case 'high':
        return <Badge bg="danger">Prioritas Tinggi</Badge>;
      case 'medium':
        return <Badge bg="warning">Prioritas Sedang</Badge>;
      case 'low':
        return <Badge bg="info">Prioritas Rendah</Badge>;
      default:
        return <Badge bg="secondary">Normal</Badge>;
    }
  };
  
  const renderStatusBadge = (status) => {
    switch(status) {
      case 'completed':
        return <Badge bg="success">Selesai</Badge>;
      case 'in-progress':
        return <Badge bg="primary">Sedang Dikerjakan</Badge>;
      case 'pending':
        return <Badge bg="warning">Menunggu</Badge>;
      case 'delayed':
        return <Badge bg="danger">Terlambat</Badge>;
      default:
        return <Badge bg="secondary">Belum Mulai</Badge>;
    }
  };

  return (
    <div className="production-dashboard">
      <h1 className="dashboard-title">Dashboard Produksi</h1>
      <p className="dashboard-subtitle">Selamat datang di dashboard produksi. Di sini Anda dapat melihat dan mengklaim tugas produksi.</p>
      
      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}
      
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filter Tahap:</Form.Label>
            <Form.Select value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
              <option value="all">Semua Tahap</option>
              <option value="Desain">Desain</option>
              <option value="Cutting">Cutting</option>
              <option value="Finishing">Finishing</option>
              <option value="Quality Control">Quality Control</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Urutkan Berdasarkan:</Form.Label>
            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="deadline">Deadline (Terdekat)</option>
              <option value="priority">Prioritas (Tertinggi)</option>
              <option value="customer">Customer (A-Z)</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="task-section">
            <Card.Header className="bg-primary text-white">
              <h3 className="m-0">Tugas yang tersedia untuk Anda</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Memuat tugas yang tersedia...</p>
                </div>
              ) : (
                filteredAndSortedOrders.length > 0 ? (
                  <ListGroup>
                    {filteredAndSortedOrders.map((order) => (
                      <ListGroup.Item key={order.trackingId} className="mb-3 border rounded">
                        <Row>
                          <Col md={8}>
                            <h5>{order.productName}</h5>
                            <p className="mb-1"><strong>Customer:</strong> {order.customerName}</p>
                            <p className="mb-1"><strong>Order ID:</strong> {order.id}</p>
                            <p className="mb-1"><strong>Tahap:</strong> {order.stageName}</p>
                            <p className="mb-1">
                              <strong>Deadline:</strong> {new Date(order.deadline).toLocaleDateString('id-ID')}
                            </p>
                            <div className="mt-2">
                              {renderPriorityBadge(order.priority)}
                            </div>
                          </Col>
                          <Col md={4} className="d-flex align-items-center justify-content-end">
                            <Button 
                              variant="primary"
                              onClick={() => claimTask(order.trackingId, order.id)}
                              disabled={loading}
                            >
                              <FontAwesomeIcon icon={faTasks} className="me-2" />
                              Klaim Tugas
                            </Button>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info">
                    Tidak ada tugas yang tersedia untuk Anda saat ini.
                  </Alert>
                )
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col>
          <Card className="task-section">
            <Card.Header className="bg-success text-white">
              <h3 className="m-0">Tugas yang sedang Anda kerjakan</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-4">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                  <p className="mt-2">Memuat tugas Anda...</p>
                </div>
              ) : (
                myAssignments.length > 0 ? (
                  <ListGroup>
                    {myAssignments.map((assignment) => (
                      <ListGroup.Item key={assignment.trackingId} className="mb-3 border rounded">
                        <Row>
                          <Col md={8}>
                            <h5>{assignment.productName}</h5>
                            <p className="mb-1"><strong>Customer:</strong> {assignment.customerName}</p>
                            <p className="mb-1"><strong>Order ID:</strong> {assignment.id}</p>
                            <p className="mb-1"><strong>Tahap:</strong> {assignment.stageName}</p>
                            <p className="mb-1">
                              <strong>Deadline:</strong> {new Date(assignment.deadline).toLocaleDateString('id-ID')}
                            </p>
                            <div className="mt-2">
                              {renderStatusBadge(assignment.status)}
                            </div>
                            <div className="progress mt-3" style={{ height: '20px' }}>
                              <div 
                                className="progress-bar" 
                                role="progressbar" 
                                style={{ width: `${assignment.progress}%` }}
                                aria-valuenow={assignment.progress} 
                                aria-valuemin="0" 
                                aria-valuemax="100"
                              >
                                {assignment.progress}%
                              </div>
                            </div>
                            <Form.Group className="mt-2">
                              <Form.Label>Update Progress:</Form.Label>
                              <div className="d-flex align-items-center">
                                <Form.Range
                                  value={assignment.progress}
                                  onChange={(e) => updateProgress(assignment.trackingId, parseInt(e.target.value))}
                                  min="0"
                                  max="100"
                                  className="me-2 flex-grow-1"
                                />
                                <span>{assignment.progress}%</span>
                              </div>
                            </Form.Group>
                            <Form onSubmit={(e) => {
                              e.preventDefault();
                              const note = e.target.elements.note.value;
                              addTaskNote(assignment.trackingId, note);
                              e.target.elements.note.value = '';
                            }}>
                              <Form.Group className="mt-3">
                                <Form.Label>Tambahkan Catatan:</Form.Label>
                                <div className="d-flex">
                                  <Form.Control name="note" required placeholder="Catatan produksi..." className="me-2" />
                                  <Button type="submit" variant="outline-primary">Tambah</Button>
                                </div>
                              </Form.Group>
                            </Form>
                            {(taskNotes[assignment.trackingId] || []).map((note, i) => (
                              <div key={i} className="mt-2 p-2 border-left border-info bg-light">
                                <small className="text-muted">{new Date(note.timestamp).toLocaleString('id-ID')}</small>
                                <p className="mb-0">{note.text}</p>
                                <small className="text-muted">Oleh: {note.user}</small>
                              </div>
                            ))}
                          </Col>
                          <Col md={4} className="d-flex align-items-center justify-content-end">
                            {assignment.status !== 'completed' && (
                              <Button 
                                variant="success"
                                onClick={() => markAsCompleted(assignment.trackingId)}
                              >
                                <FontAwesomeIcon icon={faCheck} className="me-2" />
                                Tandai Selesai
                              </Button>
                            )}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                ) : (
                  <Alert variant="info">
                    Anda belum mengklaim tugas apapun.
                  </Alert>
                )
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              Performa Tim Produksi (7 Hari Terakhir)
            </Card.Header>
            <Card.Body>
              <Line 
                data={performanceData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    title: {
                      display: true,
                      text: 'Jumlah Tugas Diselesaikan per Hari'
                    }
                  }
                }} 
                height={300} 
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProductionTeamDashboard;