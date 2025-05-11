import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Alert, Badge, 
  Form, Tabs, Tab, Table, ProgressBar, Spinner 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardCheck, faListAlt, faUserClock, 
  faCalendarAlt, faFilter, faSearch, faTasks
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './ProductionTeamDashboard.css';

const ProductionTeamDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  // State untuk filter periode
  const [filterPeriod, setFilterPeriod] = useState('current-month');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  // Base API URL
  const API_URL = 'https://rumahakrilik.id/api';
  
  // Load user info when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const username = localStorage.getItem('username');
        const userRolesStr = localStorage.getItem('userRoles');
        
        // Special handling untuk user nanang
        if (username === 'nanang') {
          console.log("Special handling for user nanang - setting production roles");
          
          // Set main role sebagai finishing
          localStorage.setItem('role', 'finishing');
          
          // Set multiple roles untuk akses yang lebih luas di produksi
          const nanangRoles = [
            {name: 'finishing'}, 
            {name: 'operator mesin'}, 
            {name: 'packing'}, 
            {name: 'quality control'}
          ];
          localStorage.setItem('userRoles', JSON.stringify(nanangRoles));
          
          // Perbarui state komponen
          setUserRoles(['finishing', 'operator mesin', 'packing', 'quality control']);
        } else {
          // Handle user produksi lainnya
          try {
            if (userRolesStr) {
              const parsedRoles = JSON.parse(userRolesStr);
              const normalizedRoles = Array.isArray(parsedRoles) 
                ? parsedRoles.map(role => 
                    typeof role === 'string' ? role : (role.name || '')
                  ).filter(Boolean) 
                : [];
              
              setUserRoles(normalizedRoles);
            } else {
              // Fallback ke role utama jika userRoles tidak ada
              const mainRole = localStorage.getItem('role');
              setUserRoles(mainRole ? [mainRole] : []);
            }
          } catch (error) {
            console.error('Error parsing user roles:', error);
            // Fallback ke default production role
            const mainRole = localStorage.getItem('role');
            setUserRoles(mainRole ? [mainRole] : ['staff']);
          }
        }
        
        // Fetch data lainnya
        await Promise.all([
          fetchUserProfile(),
          fetchMyTasks(),
          fetchAvailableTasks()
        ]);
        
      } catch (error) {
        console.error('Error fetching user info:', error);
        toast.error('Gagal memuat informasi pengguna');
        setLoading(false);
      }
    };
    
    fetchUserInfo();
  }, []);
  
  // Update when filter changes
  useEffect(() => {
    fetchMyTasks();
  }, [filterPeriod, filterMonth, filterYear]);
  
  // Fetch profile data
  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const username = localStorage.getItem('username');
      
      if (!token || !username) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/users/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUserProfile(response.data);
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to mock profile data
      setUserProfile({
        username: localStorage.getItem('username') || 'User',
        full_name: localStorage.getItem('username') || 'User',
        join_date: '2022-01-15',
        employment_status: 'Tetap',
        work_days: 'Senin - Sabtu',
        work_hours: '08:00 - 17:00',
        department: 'Produksi',
        position: localStorage.getItem('role') || 'Staff Produksi'
      });
    }
  };
  
  // Fetch tasks assigned to current user
  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Construct date filters for API
      let startDate, endDate;
      
      if (filterPeriod === 'current-month') {
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else if (filterPeriod === 'custom') {
        startDate = new Date(filterYear, filterMonth, 1);
        endDate = new Date(filterYear, parseInt(filterMonth) + 1, 0);
      } else if (filterPeriod === 'all-time') {
        startDate = new Date(2020, 0, 1); // Far back enough
        endDate = new Date(2050, 11, 31); // Far ahead enough
      }
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const response = await axios.get(`${API_URL}/production-tracking/my-tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setMyAssignments(response.data);
      } else {
        // Fallback to mock data if API doesn't return expected format
        setMyAssignments(getMockTasks());
      }
      
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      setMyAssignments(getMockTasks());
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch available tasks
  const fetchAvailableTasks = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await axios.get(`${API_URL}/production-tracking/available-tasks/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data)) {
        setAvailableOrders(response.data);
      } else {
        // Fallback to mock data
        setAvailableOrders(getMockAvailableTasks());
      }
      
    } catch (error) {
      console.error('Error fetching available tasks:', error);
      setAvailableOrders(getMockAvailableTasks());
    }
  };
  
  // Claim a task
  const claimTask = async (taskId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      await axios.post(`${API_URL}/production-tracking/${taskId}/claim/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Tugas berhasil diklaim');
      
      // Refresh data
      await Promise.all([
        fetchMyTasks(),
        fetchAvailableTasks()
      ]);
      
    } catch (error) {
      console.error('Error claiming task:', error);
      toast.error('Gagal mengklaim tugas');
    } finally {
      setLoading(false);
    }
  };
  
  // Update task status
  const updateTaskStatus = async (taskId, status, progress) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      await axios.patch(`${API_URL}/production-tracking/${taskId}/`, {
        status,
        progress
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Status tugas berhasil diperbarui');
      
      // Refresh tasks
      await fetchMyTasks();
      
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Gagal memperbarui status tugas');
    } finally {
      setLoading(false);
    }
  };
  
  // Mock data for development/fallback
  const getMockTasks = () => {
    return [
      {
        id: 1,
        order_id: 101,
        order_number: 'ORD-2025-001',
        customer_name: 'PT Tekno Solusi',
        product_name: 'Signage Akrilik',
        stage_name: 'Finishing',
        deadline: '2025-05-15',
        status: 'in-progress',
        progress: 75,
        claimed_date: '2025-05-10'
      },
      {
        id: 2,
        order_id: 102,
        order_number: 'ORD-2025-002',
        customer_name: 'Restoran Sejera',
        product_name: 'Akrilik Display Menu',
        stage_name: 'Finishing',
        deadline: '2025-05-14',
        status: 'completed',
        progress: 100,
        claimed_date: '2025-05-09',
        completed_date: '2025-05-12'
      },
      {
        id: 3,
        order_id: 103,
        order_number: 'ORD-2025-003',
        customer_name: 'PT Maju Jaya',
        product_name: 'Plakat Akrilik Premium',
        stage_name: 'Finishing',
        deadline: '2025-05-18',
        status: 'in-progress',
        progress: 30,
        claimed_date: '2025-05-11'
      }
    ];
  };
  
  const getMockAvailableTasks = () => {
    return [
      {
        id: 4,
        order_id: 104,
        order_number: 'ORD-2025-004',
        customer_name: 'Hotel Bintang Lima',
        product_name: 'Name Tag Akrilik',
        stage_name: 'Finishing',
        deadline: '2025-05-18',
        status: 'available',
        priority: 'high'
      },
      {
        id: 5,
        order_id: 105,
        order_number: 'ORD-2025-005',
        customer_name: 'Klinik Sehat',
        product_name: 'Papan Nama Akrilik',
        stage_name: 'Finishing',
        deadline: '2025-05-20',
        status: 'available',
        priority: 'medium'
      },
      {
        id: 6,
        order_id: 106,
        order_number: 'ORD-2025-006',
        customer_name: 'Perpustakaan Kota',
        product_name: 'Sign Board Akrilik',
        stage_name: 'Quality Control',
        deadline: '2025-05-19',
        status: 'available',
        priority: 'medium'
      }
    ];
  };
  
  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };
  
  // Render user profile section
  const renderProfileSection = () => {
    if (!userProfile) return null;
    
    // Calculate years of service
    const joinDate = new Date(userProfile.join_date);
    const today = new Date();
    const yearsOfService = today.getFullYear() - joinDate.getFullYear();
    
    return (
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <FontAwesomeIcon icon={faUserClock} className="me-2" />
          Profil Saya
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Nama:</strong> {userProfile.full_name || userProfile.username}</p>
              <p><strong>Posisi:</strong> {userProfile.position}</p>
              <p><strong>Departemen:</strong> {userProfile.department}</p>
              <p><strong>Tanggal Bergabung:</strong> {formatDate(userProfile.join_date)}</p>
            </Col>
            <Col md={6}>
              <p><strong>Masa Kerja:</strong> {yearsOfService} tahun</p>
              <p><strong>Status Karyawan:</strong> <Badge bg="info">{userProfile.employment_status}</Badge></p>
              <p><strong>Hari Kerja:</strong> {userProfile.work_days}</p>
              <p><strong>Jam Kerja:</strong> {userProfile.work_hours}</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };
  
  // Render tasks assigned to current user
  const renderMyTasks = () => {
    return (
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-success text-white d-flex justify-content-between align-items-center">
          <div>
            <FontAwesomeIcon icon={faClipboardCheck} className="me-2" />
            Tugas Saya
          </div>
          <Form.Group className="mb-0 d-flex">
            <Form.Select 
              size="sm"
              value={filterPeriod} 
              onChange={(e) => setFilterPeriod(e.target.value)}
              style={{ width: 'auto', marginRight: '10px' }}
            >
              <option value="current-month">Bulan Ini</option>
              <option value="custom">Pilih Bulan</option>
              <option value="all-time">Semua Waktu</option>
            </Form.Select>
            
            {filterPeriod === 'custom' && (
              <>
                <Form.Select 
                  size="sm"
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  style={{ width: 'auto', marginRight: '10px' }}
                >
                  <option value="0">Januari</option>
                  <option value="1">Februari</option>
                  <option value="2">Maret</option>
                  <option value="3">April</option>
                  <option value="4">Mei</option>
                  <option value="5">Juni</option>
                  <option value="6">Juli</option>
                  <option value="7">Agustus</option>
                  <option value="8">September</option>
                  <option value="9">Oktober</option>
                  <option value="10">November</option>
                  <option value="11">Desember</option>
                </Form.Select>
                
                <Form.Select 
                  size="sm"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </Form.Select>
              </>
            )}
          </Form.Group>
        </Card.Header>
        
        <Card.Body>
          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Memuat data...</p>
            </div>
          ) : myAssignments.length === 0 ? (
            <Alert variant="info">
              Belum ada tugas yang diklaim pada periode ini.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Produk</th>
                  <th>Tahap</th>
                  <th>Deadline</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {myAssignments.map((task) => (
                  <tr key={task.id}>
                    <td>{task.order_number}</td>
                    <td>{task.product_name}</td>
                    <td>{task.stage_name}</td>
                    <td>{formatDate(task.deadline)}</td>
                    <td>
                      <ProgressBar now={task.progress} label={`${task.progress}%`} />
                    </td>
                    <td>
                      <Badge bg={task.status === 'completed' ? 'success' : 'warning'}>
                        {task.status === 'completed' ? 'Selesai' : 'Dalam Proses'}
                      </Badge>
                    </td>
                    <td>
                      {task.status !== 'completed' ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed', 100)}
                        >
                          Selesaikan
                        </Button>
                      ) : (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'in-progress', task.progress)}
                        >
                          Batal Selesai
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  // Render tasks available for claim
  const renderAvailableTasks = () => {
    const filteredTasks = availableOrders.filter(task => 
      userRoles.some(role => 
        role.toLowerCase() === 'nanang' || 
        role.toLowerCase() === task.stage_name.toLowerCase()
      )
    );
    
    return (
      <Card>
        <Card.Header as="h5" className="bg-primary text-white">
          <FontAwesomeIcon icon={faListAlt} className="me-2" />
          Tugas Tersedia
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Memuat data...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Alert variant="info">
              Tidak ada tugas tersedia untuk diklaim saat ini.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Customer</th>
                  <th>Produk</th>
                  <th>Tahap</th>
                  <th>Deadline</th>
                  <th>Prioritas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.order_number}</td>
                    <td>{task.customer_name}</td>
                    <td>{task.product_name}</td>
                    <td>{task.stage_name}</td>
                    <td>{formatDate(task.deadline)}</td>
                    <td>
                      <Badge bg={
                        task.priority === 'high' ? 'danger' : 
                        task.priority === 'medium' ? 'warning' : 'info'
                      }>
                        {task.priority === 'high' ? 'Tinggi' : 
                         task.priority === 'medium' ? 'Sedang' : 'Rendah'}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        variant="primary"
                        size="sm"
                        onClick={() => claimTask(task.id)}
                      >
                        Ambil Tugas
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  };
  
  return (
    <Container fluid className="production-dashboard">
      <h2 className="dashboard-title">Dashboard Produksi</h2>
      <p className="dashboard-subtitle">
        Selamat datang, {localStorage.getItem('username')}. Berikut adalah tugas-tugas produksi Anda.
      </p>
      
      {/* Profil Karyawan */}
      {renderProfileSection()}
      
      {/* Tugas Saya */}
      {renderMyTasks()}
      
      {/* Tugas Tersedia */}
      {renderAvailableTasks()}
    </Container>
  );
};

export default ProductionTeamDashboard;