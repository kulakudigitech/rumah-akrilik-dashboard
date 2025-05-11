import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Badge, Row, Col, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ProductionTeamDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const navigate = useNavigate();

  // Fetch user roles on component mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        
        if (!token) {
          setError('Autentikasi diperlukan. Silahkan login kembali.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        const response = await axios.get('/api/user/me/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.data) {
          const roles = response.data.roles || [];
          setUserRoles(roles);
          localStorage.setItem('userRoles', JSON.stringify(roles));
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('Gagal memuat informasi pengguna');
      }
    };

    fetchUserInfo();
    fetchAvailableOrders();
    fetchMyAssignments();
  }, [navigate]);

  // Fungsi untuk mengklaim tugas produksi
  const claimTask = async (trackingId, orderId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        setError('Autentikasi diperlukan. Silahkan login kembali.');
        return;
      }
      
      const response = await axios.post(
        `/api/production-tracking/${trackingId}/claim/`,
        { order_id: orderId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Tugas berhasil diklaim!');
        fetchAvailableOrders();
        fetchMyAssignments();
      }
    } catch (error) {
      console.error('Error claiming task:', error);
      toast.error(error.response?.data?.message || 'Gagal mengklaim tugas');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil daftar pekerjaan yang tersedia
  const fetchAvailableOrders = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        setError('Autentikasi diperlukan. Silahkan login kembali.');
        return;
      }

      // Ambil role dari localStorage
      const userRolesString = localStorage.getItem('userRoles');
      const roles = userRolesString ? JSON.parse(userRolesString) : [];
      
      // Map role ke stage (tahap produksi)
      const roleStageMap = {
        'finishing': 3,
        'quality control': 4,
        'staff finishing': 3,
        'staff packing': 5,
      };
      
      // Tentukan stage IDs berdasarkan role user
      const stageIds = [];
      roles.forEach(role => {
        const roleLower = role.toLowerCase();
        if (roleStageMap[roleLower]) {
          stageIds.push(roleStageMap[roleLower]);
        }
      });

      if (stageIds.length === 0) {
        setError('Tidak ada tahapan produksi yang cocok dengan role Anda');
        setLoading(false);
        return;
      }

      // Buat query parameter untuk stages
      const stageQuery = stageIds.map(id => `stage=${id}`).join('&');
      console.log('Fetching available orders with query:', stageQuery);
      
      const response = await axios.get(
        `/api/production-tracking/by-stage/?${stageQuery}&status=pending`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data && Array.isArray(response.data)) {
        setAvailableOrders(response.data);
      } else {
        console.warn('Unexpected response format:', response.data);
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error('Error fetching available orders:', error);
      setError('Gagal memuat daftar pekerjaan yang tersedia');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengambil tugas yang sudah diklaim
  const fetchMyAssignments = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) return;
      
      const response = await axios.get('/api/production-tracking/my-assignments/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setMyAssignments(response.data);
      } else {
        setMyAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching my assignments:', error);
      // Tidak perlu menampilkan error untuk ini
    }
  };

  // Fungsi untuk pergi ke halaman detail produksi
  const goToProductionDetail = (orderId) => {
    navigate(`/produksi/order/${orderId}`);
  };

  return (
    <Container className="mt-4">
      <h2>Dashboard Produksi</h2>
      <p>Selamat datang di dashboard produksi. Di sini Anda dapat melihat dan mengklaim tugas produksi.</p>

      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header as="h5">
              Tugas yang tersedia untuk Anda
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : availableOrders.length === 0 ? (
                <Alert variant="info">
                  Tidak ada tugas yang tersedia untuk Anda saat ini.
                </Alert>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Pelanggan</th>
                      <th>Produk</th>
                      <th>Tahap</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableOrders.map((task) => (
                      <tr key={task.id}>
                        <td>{task.order.order_number}</td>
                        <td>{task.order.customer?.name || 'N/A'}</td>
                        <td>
                          {task.order.items?.length > 0
                            ? `${task.order.items[0].nama_produk} ${task.order.items.length > 1 ? `+${task.order.items.length - 1}` : ''}`
                            : 'N/A'}
                        </td>
                        <td>
                          <Badge bg="info">{task.stage.name}</Badge>
                        </td>
                        <td>
                          <Button 
                            size="sm"
                            onClick={() => claimTask(task.id, task.order.id)}
                            disabled={loading}
                          >
                            Klaim
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header as="h5">
              Tugas yang sedang Anda kerjakan
            </Card.Header>
            <Card.Body>
              {myAssignments.length === 0 ? (
                <Alert variant="info">
                  Anda belum mengklaim tugas apapun.
                </Alert>
              ) : (
                <Table striped hover responsive>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Tahap</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAssignments.map((task) => (
                      <tr key={task.id}>
                        <td>{task.order.order_number}</td>
                        <td>{task.stage.name}</td>
                        <td>
                          <Badge bg={task.status === 'in_progress' ? 'warning' : 'success'}>
                            {task.status === 'in_progress' ? 'Dikerjakan' : 'Selesai'}
                          </Badge>
                        </td>
                        <td>
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => goToProductionDetail(task.order.id)}
                          >
                            Lihat Detail
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductionTeamDashboard;