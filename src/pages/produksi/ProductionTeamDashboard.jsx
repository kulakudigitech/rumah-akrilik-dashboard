import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Alert, Badge, 
  Form, Table, ProgressBar, Spinner 
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardCheck, faListAlt, faUserClock, 
  faCalendarAlt, faExclamationTriangle, faCheckCircle
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ProductionTeamDashboard.css';
import TaskStatusManager from '../../utils/TaskStatusManager';

const ProductionTeamDashboard = () => {
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
  
  // Fungsi untuk memuat data tugas dari API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const username = localStorage.getItem('username');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Coba mendapatkan data dari API
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.results) {
        // Konversi data API ke format yang dibutuhkan
        const myTasks = mapOrdersToAssignments(response.data.results, username);
        setMyAssignments(myTasks);
      } else {
        // Jika tidak ada data, gunakan data mock
        setMyAssignments([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setMyAssignments([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load user info when component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const username = localStorage.getItem('username');
        const userRolesStr = localStorage.getItem('userRoles');
        
        // Special handling untuk user nanang
        if (username === 'nanang') {
          console.log("Special handling for user nanang - setting production roles");
          localStorage.setItem('role', 'finishing');
          localStorage.setItem('userRoles', JSON.stringify(['finishing', 'operator mesin', 'packing', 'quality control']));
          
          // Set state pada komponen juga
          setUserRoles(['finishing', 'operator mesin', 'packing', 'quality control']);
        } else {
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
        
        setLoading(false);
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
      
      // Use mock profile data for now since it's not in the endpoint
      setUserProfile({
        username: localStorage.getItem('username') || 'User',
        full_name: username === 'nanang' ? 'Nanang Finishing' : (localStorage.getItem('username') || 'User'),
        join_date: '2022-01-15',
        employment_status: 'Tetap',
        work_days: 'Senin - Sabtu',
        work_hours: '08:00 - 17:00',
        department: 'Produksi',
        position: localStorage.getItem('role') || 'Staff Produksi'
      });
      
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
      const username = localStorage.getItem('username');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Use real API data
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.results) {
        // Convert API data to the format expected by the dashboard
        // Find orders that have any tracking assigned to the current user or in a state that matches user roles
        const userAssignments = mapOrdersToAssignments(response.data.results, username);
        setMyAssignments(userAssignments);
      }
      
    } catch (error) {
      console.error('Error fetching my tasks:', error);
      // Fallback to empty array
      setMyAssignments([]);
      toast.error('Gagal memuat daftar tugas');
    } finally {
      setLoading(false);
    }
  };
  
  // Convert API orders to assignments format
  const mapOrdersToAssignments = (orders, username) => {
    const assignments = [];
    
    orders.forEach(order => {
      // First check if any tracking is assigned to this user or completed
      order.production_trackings.forEach(tracking => {
        // Skip if not in user's roles
        if (!userRoles.some(role => role.toLowerCase() === tracking.stage_name.toLowerCase())) {
          return;
        }
        
        // If tracking is assigned to the current user or is completed
        if ((tracking.assigned_to === username || tracking.status === "completed") && 
            tracking.is_active) {
          
          const progress = tracking.status === "completed" ? 100 : 
                          tracking.status === "in-progress" ? 50 : 0;
          
          assignments.push({
            id: tracking.id,
            order_id: order.id,
            order_number: order.order_number,
            customer_name: order.customer?.name || 'Unknown Customer',
            product_name: order.items && order.items.length > 0 ? 
                        order.items[0].nama_produk : 'Unknown Product',
            stage_name: tracking.stage_name,
            deadline: order.due_date || '',
            status: tracking.status,
            progress: progress,
            claimed_date: tracking.start_time || '',
            completed_date: tracking.end_time || '',
            specifications: order.items && order.items.length > 0 ? 
                          order.items[0].specifications : {},
            notes: order.items && order.items.length > 0 ? 
                 order.items[0].notes : '',
          });
        }
      });
    });
    
    return assignments;
  };
  
  // Fetch available tasks
  const fetchAvailableTasks = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      // Use real API data
      const response = await axios.get(`${API_URL}/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data && response.data.results) {
        // Convert API data to the format expected by the dashboard
        const availableTasks = getAvailableTasks(response.data.results);
        setAvailableOrders(availableTasks);
      }
      
    } catch (error) {
      console.error('Error fetching available tasks:', error);
      // Fallback to empty array
      setAvailableOrders([]);
      toast.error('Gagal memuat daftar tugas tersedia');
    }
  };
  
  // Get tasks available for claiming
  const getAvailableTasks = (orders) => {
    const availableTasks = [];
    
    orders.forEach(order => {
      // Look for production trackings that are pending and match user roles
      order.production_trackings.forEach(tracking => {
        // Only add if status is pending and matches user role
        if (tracking.status === 'pending' && 
            userRoles.some(role => role.toLowerCase() === tracking.stage_name.toLowerCase()) &&
            tracking.is_active) {
          
          // Check if previous stage is completed
          const stageNumber = tracking.stage;
          const previousStage = order.production_trackings.find(t => t.stage === stageNumber - 1);
          const previousStageCompleted = !previousStage || previousStage.status === 'completed';
          
          // Only include if previous stage is completed
          if (previousStageCompleted) {
            // Calculate priority based on how many other stages are completed
            const completedStages = order.production_trackings.filter(t => t.status === 'completed').length;
            const totalStages = order.production_trackings.length;
            let priority = 'low';
            
            if (completedStages > totalStages * 0.7) priority = 'high';
            else if (completedStages > totalStages * 0.3) priority = 'medium';
            
            availableTasks.push({
              id: tracking.id,
              order_id: order.id,
              order_number: order.order_number,
              customer_name: order.customer?.name || 'Unknown Customer',
              product_name: order.items && order.items.length > 0 ? 
                          order.items[0].nama_produk : 'Unknown Product',
              stage_name: tracking.stage_name,
              deadline: order.due_date || '',
              status: 'available',
              priority: priority,
              specifications: order.items && order.items.length > 0 ? 
                            order.items[0].specifications : {},
              notes: order.items && order.items.length > 0 ? 
                   order.items[0].notes : '',
            });
          }
        }
      });
    });
    
    return availableTasks;
  };
  
  // Claim a task
  const claimTask = async (taskId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      await axios.patch(`${API_URL}/production-trackings/${taskId}/`, {
        status: 'in-progress',
        assigned_to: localStorage.getItem('username'),
        start_time: new Date().toISOString()
      }, {
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
      
      // Simulate success in case API doesn't support this yet
      setTimeout(async () => {
        await Promise.all([
          fetchMyTasks(),
          fetchAvailableTasks()
        ]);
      }, 1000);
    } finally {
      setLoading(false);
    }
  };
  
  // Update task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      
      const updateData = {
        status: status,
      };
      
      if (status === 'completed') {
        updateData.end_time = new Date().toISOString();
      }
      
      await axios.patch(`${API_URL}/production-trackings/${taskId}/`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Status tugas berhasil diperbarui');
      
      // Refresh tasks
      await fetchMyTasks();
      
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Gagal memperbarui status tugas');
      
      // Simulate success in case API doesn't support this yet
      setTimeout(() => {
        fetchMyTasks();
      }, 1000);
    } finally {
      setLoading(false);
    }
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
  
  // Tambah fungsi untuk memuat data dashboard
  const loadDashboardData = () => {
    try {
      // Cek tasks dari TaskStatusManager
      const allTasks = TaskStatusManager.getTasksFromStore();
      const username = localStorage.getItem('username');
      
      // Filter tugas yang diambil oleh user ini
      const myTasks = Object.keys(allTasks)
        .filter(taskId => allTasks[taskId].assignedTo === username)
        .map(taskId => ({
          id: taskId,
          status: allTasks[taskId].status,
          // tambahkan property lain yang diperlukan
        }));
      
      // Set ke state
      setMyAssignments(myTasks);
      
      // Jika tidak ada data, coba ambil dari API
      if (myTasks.length === 0) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      fetchTasks(); // fallback ke API
    }
  };
  
  // Render user profile section
  const renderProfileSection = () => {
    if (!userProfile) return null;
    
    // Calculate years of service
    const joinDate = new Date(userProfile.join_date);
    const today = new Date();
    const yearsOfService = today.getFullYear() - joinDate.getFullYear() - 
                         (today.getMonth() < joinDate.getMonth() || 
                          (today.getMonth() === joinDate.getMonth() && today.getDate() < joinDate.getDate()) ? 1 : 0);
    
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
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Belum ada tugas yang diklaim pada periode ini.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Produk</th>
                  <th>Spesifikasi</th>
                  <th>Tahap</th>
                  <th>Status</th>
                  <th>Catatan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {myAssignments.map((task) => (
                  <tr key={task.id}>
                    <td>{task.order_number}</td>
                    <td>{task.product_name}</td>
                    <td>
                      {Object.entries(task.specifications || {}).map(([key, value]) => (
                        <div key={key}><strong>{key}:</strong> {value}</div>
                      ))}
                      {Object.keys(task.specifications || {}).length === 0 && '-'}
                    </td>
                    <td>{task.stage_name}</td>
                    <td>
                      <Badge bg={
                        task.status === 'completed' ? 'success' : 
                        task.status === 'in-progress' ? 'warning' : 'secondary'
                      }>
                        {task.status === 'completed' ? 'Selesai' : 
                         task.status === 'in-progress' ? 'Dalam Proses' : 'Belum Dimulai'}
                      </Badge>
                    </td>
                    <td>{task.notes || '-'}</td>
                    <td>
                      {task.status !== 'completed' ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'completed')}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="me-1" />
                          Selesaikan
                        </Button>
                      ) : (
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => updateTaskStatus(task.id, 'in-progress')}
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
          ) : availableOrders.length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Tidak ada tugas tersedia untuk diklaim saat ini.
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Customer</th>
                  <th>Produk</th>
                  <th>Spesifikasi</th>
                  <th>Tahap</th>
                  <th>Catatan</th>
                  <th>Prioritas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {availableOrders.map((task) => (
                  <tr key={task.id}>
                    <td>{task.order_number}</td>
                    <td>{task.customer_name}</td>
                    <td>{task.product_name}</td>
                    <td>
                      {Object.entries(task.specifications || {}).map(([key, value]) => (
                        <div key={key}><strong>{key}:</strong> {value}</div>
                      ))}
                      {Object.keys(task.specifications || {}).length === 0 && '-'}
                    </td>
                    <td>{task.stage_name}</td>
                    <td>{task.notes || '-'}</td>
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
        Selamat datang, {userProfile?.full_name || localStorage.getItem('username')}. Berikut adalah tugas-tugas produksi Anda.
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