import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Button, Alert, Badge, 
  Form, ListGroup, Spinner, Modal, Row, Col
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faClipboardCheck, faExclamationTriangle, faCheckCircle, 
  faArrowLeft, faChevronRight, faBoxOpen, faTools, faSearch
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './ProductionTeamDashboard.css';
import TaskStatusManager from '../../utils/TaskStatusManager';
import ProductionDatabase from '../../utils/productionDatabase';
import ApiStatusChecker from '../../utils/apiStatusChecker';
import DummyDataManager from '../../utils/dummyDataManager';
import ApiStatusBadge from '../../components/common/ApiStatusBadge';
import { generateDummyTasks } from '../../utils/dummyDataGenerator';

const timeoutPromise = (promise, timeoutMs = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

const MyTasksPage = () => {
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);
  const [myAssignments, setMyAssignments] = useState([]);
  const [apiAvailable, setApiAvailable] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('current-month');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  
  const API_URL = 'https://rumahakrilik.id/api';

  const saveTaskStatusToLocalStorage = (taskId, status) => {
    try {
      const savedStatuses = JSON.parse(localStorage.getItem('taskStatuses') || '{}');
      const task = myAssignments.find(t => t.id === taskId);
      savedStatuses[taskId] = {
        status,
        updatedAt: new Date().toISOString(),
        stageName: task?.stage_name || '',
        orderNumber: task?.order_number || '',
        orderid: task?.order_id || '',
        productName: task?.product_name || '',
        customerName: task?.customer_name || '',
        assignedTo: localStorage.getItem('username'),
        notes: task?.notes || ''
      };
      localStorage.setItem('taskStatuses', JSON.stringify(savedStatuses));
      console.log(`Status task ${taskId} disimpan ke localStorage: ${status} dengan tahapan ${task?.stage_name}`);
      TaskStatusManager.updateTaskStatus(taskId, status, localStorage.getItem('username'), task?.stage_name);
    } catch (error) {
      console.error('Error menyimpan status ke localStorage:', error);
    }
  };

  const updateTaskInApi = async (taskId, progress) => {
    try {
      const token = localStorage.getItem('jwtToken');
      const task = myAssignments.find(t => t.id === taskId);
      if (!task) return;
      const status = progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'pending';
      ProductionDatabase.saveStageProgress(
        task.order_id,
        task.stage_name,
        progress,
        localStorage.getItem('username')
      );
      const apiAvailable = await ApiStatusChecker.isApiAvailable();
      if (!apiAvailable) {
        console.log('API tidak tersedia, perubahan disimpan secara lokal');
        toast.info('Perubahan disimpan secara lokal (server tidak tersedia)');
        return;
      }
      const endpoints = [
        `https://rumahakrilik.id/api/production-trackings/${taskId}/`,
        `https://rumahakrilik.id/api/production-tracking/${taskId}/update/`,
        `https://rumahakrilik.id/api/orders/${task.order_id}/production-status`
      ];
      for (const endpoint of endpoints) {
        try {
          const response = await axios({
            method: 'patch',
            url: endpoint,
            data: {
              status,
              progress,
              stage_name: task.stage_name
            },
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 5000
          });
          if (response.status >= 200 && response.status < 300) {
            console.log(`Successfully updated task ${taskId} via API to ${progress}%`);
            toast.success(`Progress diperbarui: ${progress}%`);
            return true;
          }
        } catch (endpointError) {
          console.warn(`Error with endpoint ${endpoint}:`, endpointError.message);
        }
      }
      console.warn('API available but all endpoints failed');
      toast.warning('Server merespon namun gagal memperbarui data. Progress disimpan secara lokal.');
      return false;
    } catch (error) {
      console.error("Error updating task in API:", error);
      toast.warning('Gagal memperbarui status di server, tersimpan secara lokal');
      return false;
    }
  };

  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskStatusChange = (taskId, stageName, isCompleted) => {
    const progress = isCompleted ? 100 : 0;
    const updatedAssignments = myAssignments.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: isCompleted ? 'completed' : 'pending',
          progress
        };
      }
      return task;
    });
    setMyAssignments(updatedAssignments);
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({
        ...selectedTask,
        status: isCompleted ? 'completed' : 'pending',
        progress
      });
    }
    saveTaskStatusToLocalStorage(taskId, isCompleted ? 'completed' : 'pending');
    updateTaskInApi(taskId, progress);
    toast.success(`Status tugas berhasil ${isCompleted ? 'diselesaikan' : 'diatur sebagai belum selesai'}`);
  };

  const getFilteredTasks = () => {
    let filtered = [...myAssignments];
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.order_number?.toLowerCase().includes(term) ||
        task.product_name?.toLowerCase().includes(term) ||
        task.customer_name?.toLowerCase().includes(term) ||
        task.stage_name?.toLowerCase().includes(term)
      );
    }
    return filtered;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const username = localStorage.getItem('username');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      try {
        const apiAvailable = await timeoutPromise(
          ApiStatusChecker.isApiAvailable(), 
          3000
        );
        
        if (!apiAvailable) {
          throw new Error('API not available');
        }
      } catch (apiCheckError) {
        console.warn("API check failed:", apiCheckError);
        throw new Error('API not available');
      }
      
      const endpoints = [
        `${API_URL}/production-trackings/my-tasks/`,
        `${API_URL}/production-tracking/my-tasks/`,
        `${API_URL}/production-tracking/assignments/`
      ];
      
      let tasksData = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await timeoutPromise(axios.get(endpoint, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
            }
          }), 4000);
          
          if (response.data && Array.isArray(response.data)) {
            tasksData = response.data;
            break;
          }
        } catch (endpointError) {
          console.warn(`Error with endpoint ${endpoint}:`, endpointError.message);
        }
      }
      
      if (tasksData && tasksData.length > 0) {
        const formattedTasks = tasksData.map(task => ({
          ...task,
          status: task.status || 'in_progress',
          progress: task.status === 'completed' ? 100 : task.status === 'in_progress' ? 50 : 0,
          specifications: task.specifications || {},
          isDummy: false
        }));
        
        ProductionDatabase.saveMyTasks(username, formattedTasks);
        
        setMyAssignments(formattedTasks);
        setLoading(false);
        return;
      }
      
      const localTasks = ProductionDatabase.getMyTasks(username);
      
      if (localTasks && localTasks.length > 0) {
        setMyAssignments(localTasks);
        setLoading(false);
        return;
      }
      
      const dummyTasks = generateDummyTasks(username, 3);
      setMyAssignments(dummyTasks);
      
      ProductionDatabase.saveMyTasks(username, dummyTasks);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      
      const username = localStorage.getItem('username');
      const dummyTasks = generateDummyTasks(username, 3);
      setMyAssignments(dummyTasks);
      setLoading(false);
      setApiAvailable(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        timeoutId = setTimeout(() => {
          if (isMounted && loading) {
            console.log("Loading timeout reached, using fallback data");
            
            const username = localStorage.getItem('username');
            const dummyTasks = generateDummyTasks(username, 3);
            setMyAssignments(dummyTasks);
            setLoading(false);
            
            setApiAvailable(false);
            
            toast.warning("Server tidak merespons, menggunakan data offline", {
              autoClose: 5000
            });
          }
        }, 8000);
        
        await fetchMyTasks();
        
        clearTimeout(timeoutId);
      } catch (error) {
        console.error("Error in main data fetching:", error);
        
        if (isMounted) {
          const username = localStorage.getItem('username');
          const dummyTasks = generateDummyTasks(username, 3);
          setMyAssignments(dummyTasks);
          setLoading(false);
          
          setApiAvailable(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const renderLoadingOrContent = () => {
    if (loading) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Memuat daftar tugas...</p>
          <p className="text-muted small">
            Jika loading terlalu lama, akan menggunakan data offline
          </p>
        </div>
      );
    }
    
    return (
      <>
        {!apiAvailable && (
          <Alert variant="warning" className="mb-3">
            <div className="d-flex align-items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              <span>
                <strong>Server tidak tersedia:</strong> Menampilkan data lokal/dummy
              </span>
              <Button 
                variant="outline-secondary" 
                size="sm" 
                className="ms-auto"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const status = await timeoutPromise(
                      ApiStatusChecker.isApiAvailable(true), 
                      3000
                    );
                    setApiAvailable(status);
                    toast.info(status ? 'Server tersedia' : 'Server masih tidak tersedia');
                    if (status) {
                      fetchMyTasks();
                    } else {
                      setLoading(false);
                    }
                  } catch (error) {
                    console.error("Error checking API status:", error);
                    setApiAvailable(false);
                    setLoading(false);
                    toast.error("Gagal terhubung dengan server");
                  }
                }}
              >
                Coba Lagi
              </Button>
            </div>
          </Alert>
        )}
        
        {myAssignments.length === 0 ? (
          <Alert variant="info">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            Belum ada tugas yang ditugaskan kepada Anda.
          </Alert>
        ) : (
          <ListGroup>
            {myAssignments.map((task) => (
              <ListGroup.Item 
                key={task.id} 
                action 
                onClick={() => showTaskDetails(task)}
                className={task.isDummy ? 'bg-light' : ''}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="d-flex align-items-center">
                      <strong className="me-2">{task.order_number || `Order-${task.order_id}`}</strong>
                      {task.isDummy && (
                        <Badge bg="warning" className="me-2" style={{fontSize: '0.7rem'}}>
                          Dummy
                        </Badge>
                      )}
                      <Badge bg={
                        task.status === 'completed' ? 'success' : 
                        task.status === 'in_progress' ? 'warning' : 'secondary'
                      }>
                        {task.status === 'completed' ? 'Selesai' : 
                         task.status === 'in_progress' ? 'Dalam Proses' : 'Belum Dimulai'}
                      </Badge>
                    </div>
                    <div className="text-muted small mt-1">
                      <span className="me-3">Produk: {task.product_name || "N/A"}</span>
                      <span className="me-3">Pelanggan: {task.customer_name || "N/A"}</span>
                      <span>Tahap: <strong>{task.stage_name || "Produksi"}</strong></span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center">
                    <small className="text-muted me-3">
                      Deadline: {formatDate(task.deadline || task.due_date) || "N/A"}
                    </small>
                    <FontAwesomeIcon icon={faChevronRight} className="ms-2 text-muted" />
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </>
    );
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Tugas Saya</h2>
        <Link to="/produksi/dashboard" className="btn btn-outline-secondary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali ke Dashboard
        </Link>
      </div>
      
      <Card.Body>
        {/* Filter Status dan Pencarian */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group className="d-flex align-items-center">
              <Form.Label className="me-2 mb-0">Status:</Form.Label>
              <Form.Select 
                size="sm" 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: 'auto' }}
                disabled={loading}
              >
                <option value="all">Semua Status</option>
                <option value="completed">Selesai</option>
                <option value="in_progress">Dalam Proses</option>
                <option value="pending">Belum Dimulai</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="position-relative">
              <FontAwesomeIcon icon={faSearch} className="position-absolute" style={{ left: '10px', top: '9px', color: '#aaa' }} />
              <Form.Control
                size="sm"
                type="text"
                placeholder="Cari order, produk atau pelanggan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '30px' }}
                disabled={loading}
              />
            </Form.Group>
          </Col>
        </Row>
        
        {/* Render loading atau content */}
        {renderLoadingOrContent()}
      </Card.Body>
      
      <Modal
        show={showTaskDetail}
        onHide={() => setShowTaskDetail(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Detail Tugas {selectedTask?.order_number}
            {selectedTask?.isDummy && (
              <Badge bg="warning" className="ms-2" style={{fontSize: '0.8rem'}}>
                Data Dummy
              </Badge>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTask && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Informasi Order</h5>
                  <table className="table table-borderless table-sm">
                    <tbody>
                      <tr>
                        <td style={{ width: '40%' }}><strong>No. Order:</strong></td>
                        <td>{selectedTask.order_number}</td>
                      </tr>
                      <tr>
                        <td><strong>Pelanggan:</strong></td>
                        <td>{selectedTask.customer_name}</td>
                      </tr>
                      <tr>
                        <td><strong>Produk:</strong></td>
                        <td>{selectedTask.product_name}</td>
                      </tr>
                      <tr>
                        <td><strong>Tanggal Ambil:</strong></td>
                        <td>{formatDate(selectedTask.claimed_date)}</td>
                      </tr>
                      <tr>
                        <td><strong>Deadline:</strong></td>
                        <td>{formatDate(selectedTask.deadline || selectedTask.due_date)}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
                <Col md={6}>
                  <h5>Spesifikasi</h5>
                  {Object.keys(selectedTask.specifications || {}).length > 0 ? (
                    <table className="table table-borderless table-sm">
                      <tbody>
                        {Object.entries(selectedTask.specifications).map(([key, value]) => (
                          <tr key={key}>
                            <td style={{ width: '40%' }}><strong>{key}:</strong></td>
                            <td>{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-muted">Tidak ada spesifikasi khusus</p>
                  )}
                  
                  {selectedTask.notes && (
                    <>
                      <h5 className="mt-3">Catatan</h5>
                      <p>{selectedTask.notes}</p>
                    </>
                  )}
                </Col>
              </Row>
              
              <hr />
              
              <h5>Status Produksi</h5>
              <Card className="border-primary mb-3">
                <Card.Header className="bg-primary text-white">
                  Tahap: {selectedTask.stage_name}
                </Card.Header>
                <Card.Body>
                  <Form.Check
                    type="checkbox"
                    id={`checkbox-${selectedTask.id}`}
                    label={`Tandai tahap ${selectedTask.stage_name} sebagai selesai`}
                    checked={selectedTask.status === 'completed'}
                    onChange={(e) => handleTaskStatusChange(
                      selectedTask.id,
                      selectedTask.stage_name,
                      e.target.checked
                    )}
                    className="mb-0 fs-5"
                  />
                </Card.Body>
              </Card>
              
              <div className="text-center mt-3">
                <Link 
                  to={`/produksi/detail/${selectedTask.order_id}`}
                  className="btn btn-outline-primary"
                >
                  <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
                  Lihat Detail Order Lengkap
                </Link>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTaskDetail(false)}>
            Tutup
          </Button>
          {selectedTask && selectedTask.status === 'completed' && (
            <Button 
              variant="success"
              disabled
              className="d-flex align-items-center"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="me-2" />
              Tugas Selesai
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      
    </Container>
  );
};

export default MyTasksPage;