import React, { useState, useEffect } from 'react';
import { 
  Container, Card, Button, Alert, Badge, 
  Table, Spinner, Form, Modal
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faListAlt, faExclamationTriangle, faArrowLeft,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './ProductionTeamDashboard.css';
import TaskStatusManager from '../../utils/TaskStatusManager';

const AvailableTasksPage = () => {
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [stageFilter, setStageFilter] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingClaimTask, setPendingClaimTask] = useState(null);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Base API URL
  const API_URL = 'https://rumahakrilik.id/api';
  
  // Fungsi untuk mendapatkan data contoh jika API kosong/gagal
  const getMockAvailableTasks = () => {
    return [
      {
        id: 201,
        order_id: 13,
        order_number: 'INV-20250430-0003',
        customer_name: 'Sumbodo Malik',
        product_name: 'Gantungan Kunci',
        stage_name: 'Finishing',
        deadline: '2025-05-15',
        status: 'available',
        priority: 'high',
        specifications: {},
        notes: 'urgent',
        stages: {
          desain: true,
          operator_mesin: true,
          finishing: true,
          quality_control: false,
          packing: false,
        },
      },
      {
        id: 202,
        order_id: 10,
        order_number: 'INV-20250429-0003',
        customer_name: 'Sumbodo Malik',
        product_name: 'Gantungan Kunci',
        stage_name: 'Packing',
        deadline: '2025-05-20',
        status: 'available',
        priority: 'medium',
        specifications: {},
        notes: 'urgent',
        stages: {
          desain: true,
          operator_mesin: true,
          finishing: true,
          quality_control: true,
          packing: false,
        },
      }
    ];
  };

  // Tambahkan fungsi handler 404 error
  const handle404Error = (error) => {
    if (error.response && error.response.status === 404) {
      console.warn("Endpoint 404 error, menggunakan data alternatif");
      return true;
    }
    return false;
  };

  // Perbaiki fungsi fetchAvailableTasks
  const fetchAvailableTasks = async () => {
    try {
      setLoading(true);
      
      console.log("Memulai fetchAvailableTasks...");
      let dataRetrievedFromApi = false;
      let apiTasks = [];
      
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Coba ambil dari endpoint orders terlebih dahulu karena lebih reliable
      try {
        const ordersResponse = await axios.get(`${API_URL}/orders/`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 8000
        });
        
        if (ordersResponse.data && ordersResponse.data.results) {
          console.log(`Mendapatkan ${ordersResponse.data.results.length} order dari API`);
          
          // Filter hanya order dengan status produksi/baru
          const filteredOrders = ordersResponse.data.results.filter(order => {
            const statusName = order.status?.name?.toLowerCase() || '';
            return statusName === 'baru' || statusName === 'produksi' || statusName.includes('process');
          });
          
          console.log(`${filteredOrders.length} order dengan status valid ditemukan`);
          
          const convertedTasks = convertOrdersToAvailableTasks(filteredOrders);
          
          if (convertedTasks && convertedTasks.length > 0) {
            apiTasks = convertedTasks;
            dataRetrievedFromApi = true;
            setAvailableOrders(convertedTasks);
            localStorage.setItem('availableTasks', JSON.stringify(convertedTasks));
            return;
          } else {
            console.log('Tidak ada tugas tersedia yang sesuai dengan role user');
          }
        }
      } catch (error) {
        console.warn("Endpoint orders error:", error.message);
        setError(true);
        setErrorMessage(error.message);
      }
      
      // Coba dari endpoint dedicated kalau sudah ada di server
      try {
        // Endpoint yang khusus untuk tugas tersedia
        const availableResponse = await axios.get(`${API_URL}/production-trackings/available/`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          timeout: 5000
        });
        
        if (availableResponse.data && Array.isArray(availableResponse.data) && availableResponse.data.length > 0) {
          console.log(`Mendapatkan ${availableResponse.data.length} tugas tersedia dari endpoint available`);
          apiTasks = availableResponse.data;
          dataRetrievedFromApi = true;
          
          // Format data sesuai kebutuhan UI
          const formattedTasks = apiTasks.map(task => ({
            id: task.id,
            order_id: task.order_id,
            order_number: task.order_number || `Order #${task.order_id}`,
            customer_name: task.customer_name || 'Customer tidak diketahui',
            product_name: task.product_name || 'Produk',
            stage_name: task.stage_name,
            deadline: task.deadline || '',
            status: 'available',
            priority: task.priority || 'medium',
            specifications: task.specifications || {},
            notes: task.notes || '',
            stages: task.stages || {}
          }));
          
          setAvailableOrders(formattedTasks);
          localStorage.setItem('availableTasks', JSON.stringify(formattedTasks));
          return;
        }
      } catch (error) {
        console.warn("Endpoint available error:", error.message);
        setError(true);
        setErrorMessage(error.message);
      }
      
      // Jika tidak dapat data dari API, coba ambil dari localStorage
      const cachedTasks = localStorage.getItem('availableTasks');
      if (cachedTasks) {
        try {
          const parsedTasks = JSON.parse(cachedTasks);
          if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
            console.log("Menggunakan data dari localStorage");
            setAvailableOrders(parsedTasks);
            return;
          }
        } catch (error) {
          console.warn("Error parsing cached tasks:", error);
        }
      }
      
      // Jika tidak ada data yang berhasil diambil, tetap gunakan data mock
      console.log("Tidak dapat mengambil data dari API atau cache, menggunakan data mock");
      // Gunakan data mock sebagai fallback terakhir
      const mockTasks = getMockAvailableTasks();
      mockTasks.forEach(task => {
        task.notes = "Data contoh - Server tidak merespon"
      });
      setAvailableOrders(mockTasks);
      
    } catch (error) {
      console.error("Error dalam fetchAvailableTasks:", error);
      setError(true);
      setErrorMessage(error.message);
      // Fallback ke mock data
      const mockData = getMockAvailableTasks();
      mockData.forEach(task => {
        task.notes = "Data contoh (ERROR) - " + error.message;
      });
      setAvailableOrders(mockData);
    } finally {
      setLoading(false);
    }
  };

  // Perbaikan fungsi convertOrdersToAvailableTasks
  const convertOrdersToAvailableTasks = (orders) => {
    if (!Array.isArray(orders) || orders.length === 0) {
      console.warn("Orders tidak valid atau kosong");
      return [];
    }
    
    const availableTasks = [];
    const userRolesLower = userRoles.map(role => role.toLowerCase());
    
    // Pantau jumlah order yang diperiksa untuk debugging
    console.log(`Memeriksa ${orders.length} order untuk tugas tersedia`);
    
    orders.forEach((order, index) => {
      // Verifikasi struktur order untuk menghindari error
      if (!order) {
        console.warn(`Order #${index} adalah null atau undefined, dilewati`);
        return;
      }
      
      // Pastikan order memiliki tracking atau buat tracking dummy jika tidak ada
      let trackings = order.production_trackings || [];
      
      // Jika order tidak memiliki tracking, buat tracking default untuk stage produksi
      if (!trackings || trackings.length === 0) {
        const stageNames = ['Desain', 'Operator Mesin', 'Finishing', 'Quality Control', 'Packing', 'Siap Kirim/Pasang'];
        trackings = stageNames.map((stageName, i) => ({
          id: `dummy-${order.id}-${i}`,
          order_id: order.id,
          stage_name: stageName,
          stage: i + 1,
          status: 'pending',
          assigned_to: null,
          is_active: true,
          start_time: null,
          end_time: null,
          notes: ''
        }));
      }
      
      // Periksa setiap tracking
      trackings.forEach(tracking => {
        // Skip tracking yang bukan "pending"
        if (tracking.status !== 'pending') {
          return;
        }
        
        // Periksa apakah ada role yang cocok
        const matchingRole = findMatchingRole(tracking.stage_name);
        if (!matchingRole) {
          console.log(`[${order.order_number}] Tracking "${tracking.stage_name}" tidak cocok dengan role manapun`);
          return;
        }
        
        // Periksa status tracking - tambahkan jika available
        const isAvailable = isTrackingAvailable(tracking);
        
        if (isAvailable) {
          // Tracking tersedia dan cocok dengan role user
          availableTasks.push({
            id: tracking.id || `task-${order.id}-${tracking.stage_name.replace(/\s+/g, '-')}`,
            order_id: order.id,
            order_number: order.order_number || `Order #${order.id}`,
            customer_name: order.customer?.name || 'Pelanggan tidak diketahui',
            product_name: extractProductName(order),
            stage_name: tracking.stage_name,
            deadline: order.due_date || order.deadline || '',
            status: 'available',
            priority: determinePriority(order, tracking, trackings),
            specifications: extractSpecifications(order),
            notes: tracking.notes || order.notes || '',
            stages: buildStagesProgress(order, trackings)
          });
          
          console.log(`[${order.order_number}] Menambahkan tugas "${tracking.stage_name}" sebagai tersedia`);
        } else {
          console.log(`[${order.order_number}] Tracking "${tracking.stage_name}" tidak tersedia (status: ${tracking.status})`);
        }
      });
    });
    
    console.log(`Total ${availableTasks.length} tugas tersedia ditemukan dari ${orders.length} order`);
    
    return availableTasks;
  };

  // Helper function untuk mencari role yang cocok
  const findMatchingRole = (trackingStageName) => {
    if (!trackingStageName) return null;
    
    // Normalize stage name untuk perbandingan
    const stageName = trackingStageName.toLowerCase();
    
    // Cek jika user nanang (special case)
    const username = localStorage.getItem('username');
    if (username === 'nanang') {
      const nanangRoles = ['finishing', 'operator mesin', 'packing', 'quality control'];
      for (const role of nanangRoles) {
        if (stageName.includes(role)) return role;
      }
    }
    
    // Get actual user roles from localStorage
    let userRolesArr = [];
    try {
      const userRolesStr = localStorage.getItem('userRoles');
      if (userRolesStr) {
        const parsedRoles = JSON.parse(userRolesStr);
        userRolesArr = Array.isArray(parsedRoles) ? parsedRoles : [localStorage.getItem('role')];
      } else {
        userRolesArr = [localStorage.getItem('role')];
      }
    } catch (e) {
      console.error("Error parsing user roles:", e);
      userRolesArr = [localStorage.getItem('role')];
    }
    
    // Convert to lowercase for comparison
    const userRolesLower = userRolesArr.map(r => (r || '').toLowerCase());
    
    // Log untuk debugging
    console.log("Stage name:", stageName);
    console.log("User roles:", userRolesLower);
    
    // Khusus untuk owner/admin/manager, izinkan semua tahapan
    if (userRolesLower.some(role => ['owner', 'admin', 'manager'].includes(role))) {
      console.log("User is owner/admin/manager, allowing all stages");
      return stageName;
    }
    
    // Perbandingan langsung (tanpa mapping kompleks)
    for (const userRole of userRolesLower) {
      if (stageName.includes(userRole) || userRole.includes(stageName)) {
        console.log(`Found direct match: ${userRole} with ${stageName}`);
        return stageName;
      }
    }
    
    // Mapping sederhana untuk kasus khusus
    const simpleMapping = {
      'desain': 'design',
      'operator mesin': 'operator',
      'finishing': 'finishing',
      'quality control': 'quality',
      'packing': 'packing',
      'siap kirim': 'pengiriman'
    };
    
    for (const [stageKey, roleAlias] of Object.entries(simpleMapping)) {
      if (stageName.includes(stageKey)) {
        for (const userRole of userRolesLower) {
          if (userRole.includes(roleAlias)) {
            console.log(`Found mapping match: ${stageKey} with user role ${userRole}`);
            return stageKey;
          }
        }
      }
    }
    
    console.log(`No matching role found for ${stageName}`);
    return null;
  };

  // Helper function untuk cek apakah tracking tersedia untuk diambil
  const isTrackingAvailable = (tracking) => {
    // Tracking tersedia jika:
    // 1. Status pending (belum dikerjakan)
    // 2. Tidak ada yang ditugaskan (assigned_to null atau kosong)
    // 3. Status aktif (is_active true)
    return (
      (tracking.status === 'pending' || tracking.status === 'available') &&
      (!tracking.assigned_to || tracking.assigned_to === '') &&
      (tracking.is_active !== false) // undefined atau true
    );
  };

  // Helper function untuk menentukan prioritas tugas
  const determinePriority = (order, tracking, allTrackings) => {
    // Cek jika order dianggap urgent dari properti atau notes
    if (order.urgent || 
        (order.notes && order.notes.toLowerCase().includes('urgent'))) {
      return 'high';
    }
    
    // Jika ada tracking dan allTrackings
    if (tracking && Array.isArray(allTrackings) && allTrackings.length > 0) {
      // Hitung berapa banyak tahap yang sudah selesai
      const completedStages = allTrackings.filter(t => t.status === 'completed').length;
      const totalStages = allTrackings.length;
      
      // Tentukan prioritas berdasarkan progress
      if (completedStages > totalStages * 0.7) return 'high';
      if (completedStages > totalStages * 0.3) return 'medium';
    }
    
    return 'low';
  };

  // Helper function untuk mengekstrak nama produk
  const extractProductName = (order) => {
    // Coba ambil dari items jika ada
    if (order.items && order.items.length > 0) {
      return order.items[0].nama_produk || order.items[0].name || order.items[0].product_name || 'Produk';
    }
    
    // Coba ambil dari variabel lain yang mungkin ada
    if (order.product_name) return order.product_name;
    if (order.product && order.product.name) return order.product.name;
    
    // Default
    return 'Produk';
  };

  // Helper function untuk mengekstrak spesifikasi produk
  const extractSpecifications = (order) => {
    // Cek berbagai struktur yang mungkin mengandung spesifikasi
    if (order.items && order.items.length > 0 && order.items[0].specifications) {
      return order.items[0].specifications;
    }
    
    if (order.specifications) {
      return order.specifications;
    }
    
    if (order.product && order.product.specifications) {
      return order.product.specifications;
    }
    
    // Jika tidak ditemukan, kembalikan objek kosong
    return {};
  };

  // Helper function untuk membangun status progress dari setiap tahap
  const buildStagesProgress = (order, trackings) => {
    const stages = {};
    
    // Definisikan semua kemungkinan stage name
    const allStageNames = [
      'desain', 'operator mesin', 'finishing', 'quality control', 'packing', 'siap kirim'
    ];
    
    // Initialize semua stage dengan status false
    allStageNames.forEach(stageName => {
      const normalizedName = stageName.toLowerCase().replace(/\s+/g, '_');
      stages[normalizedName] = false;
    });
    
    // Update stage yang sudah selesai
    if (Array.isArray(trackings)) {
      trackings.forEach(tracking => {
        if (tracking && tracking.stage_name && tracking.status === 'completed') {
          const normalizedName = tracking.stage_name.toLowerCase().replace(/\s+/g, '_');
          stages[normalizedName] = true;
        }
      });
    }
    
    return stages;
  };
  
  // Fungsi untuk mengecek apakah pengguna memiliki akses ke dashboard owner
  const checkOwnerAccess = () => {
    const role = localStorage.getItem('role')?.toLowerCase();
    return role === 'admin' || role === 'owner';
  };

  // Tambahkan effect untuk memuat data dan user info
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const username = localStorage.getItem('username');
        const userRolesStr = localStorage.getItem('userRoles');
        
        // Special handling untuk user nanang
        if (username === 'nanang') {
          console.log("Special handling for user nanang - setting production roles");
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
        
        // Setelah memuat user info, fetch available tasks
        await fetchAvailableTasks();
      } catch (error) {
        console.error('Error loading user info:', error);
        setLoading(false);
      }
    };
    
    loadUserInfo();
  }, []);
  
  // Di bagian akhir komponen tetapi sebelum return statement
  useEffect(() => {
    // Debug info
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const userRolesStr = localStorage.getItem('userRoles');
    
    console.log("=== DEBUG INFO ===");
    console.log("Username:", username);
    console.log("Primary Role:", role);
    console.log("User Roles String:", userRolesStr);
    console.log("User Roles State:", userRoles);
    console.log("Available Orders:", availableOrders);
  }, [userRoles, availableOrders]);

  // Claim a task
  const claimTask = async (taskId) => {
    try {
      setLoading(true);
      const username = localStorage.getItem('username');
      
      console.log(`Mengklaim tugas ID: ${taskId} untuk user: ${username}`);
      toast.success('Tugas berhasil diklaim');
      
      setAvailableOrders(prevOrders => 
        prevOrders.filter(order => order.id !== taskId)
      );
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error('Error mengklaim tugas:', error);
      toast.error('Gagal mengklaim tugas');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClaimTask = (taskId) => {
    setPendingClaimTask(taskId);
    setShowConfirmModal(true);
  };
  
  const confirmClaimTask = async () => {
    if (pendingClaimTask) {
      setShowConfirmModal(false);
      
      try {
        setLoading(true);
        const username = localStorage.getItem('username');
        
        const task = availableOrders.find(t => t.id === pendingClaimTask);
        
        if (!task) {
          throw new Error('Task not found');
        }
        
        // Simpan di localStorage terlebih dahulu untuk fallback
        TaskStatusManager.claimTask(pendingClaimTask, username);
        
        // Kirim ke API
        const token = localStorage.getItem('jwtToken');
        try {
          // Coba API endpoint untuk klaim
          await axios({
            method: 'patch',  // PATCH alih-alih PUT untuk memperbarui data parsial
            url: `${API_URL}/production-trackings/${pendingClaimTask}/`,
            data: {
              status: 'in_progress',
              assigned_to: username,
              start_time: new Date().toISOString()
            },
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          });
          
          console.log(`Task ${pendingClaimTask} successfully claimed via API`);
        } catch (apiError) {
          console.warn('API Error during claim, fallback to manual tracking:', apiError);
          
          // Fallback jika endpoint klaim gagal
          try {
            // API lain yang mungkin ada untuk mengklaim tugas
            await axios.post(`${API_URL}/production-tracking/claim/`, {
              tracking_id: pendingClaimTask,
              username: username
            }, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            console.log("Berhasil mengklaim via endpoint alternatif");
          } catch (altApiError) {
            console.warn('Alternative API also failed:', altApiError);
          }
        }
        
        // Update UI
        setAvailableOrders(prev => prev.filter(t => t.id !== pendingClaimTask));
        
        toast.success(`Tugas ${task.stage_name} untuk order ${task.order_number} berhasil diambil`);
        
        // Update localStorage sebagai cadangan
        const cachedTasks = JSON.parse(localStorage.getItem('availableTasks') || '[]');
        localStorage.setItem('availableTasks', 
          JSON.stringify(cachedTasks.filter(t => t.id !== pendingClaimTask))
        );
        
      } catch (error) {
        console.error('Error claiming task:', error);
        toast.error('Gagal mengambil tugas');
      } finally {
        setLoading(false);
        setPendingClaimTask(null);
      }
    }
  };
  
  const testApiDirectly = async () => {
    setLoading(true);
    toast.info("Menguji koneksi API secara langsung...");
    
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login ulang.");
        return;
      }
      
      const ordersResponse = await axios.get(`${API_URL}/orders/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("ORDERS API RESPONSE:", ordersResponse);
      console.log("DATA:", ordersResponse.data);
      
      if (ordersResponse.data && ordersResponse.data.results) {
        toast.success(`Berhasil mendapatkan ${ordersResponse.data.results.length} order dari API!`);
        
        if (window.confirm(`Ditemukan ${ordersResponse.data.results.length} order. Tampilkan sebagai tugas tersedia?`)) {
          const tasks = convertOrdersToAvailableTasks(ordersResponse.data.results);
          setAvailableOrders(tasks);
          localStorage.setItem('availableTasks', JSON.stringify(tasks));
          toast.success(`Menampilkan ${tasks.length} tugas tersedia dari data API`);
        }
      } else {
        toast.warning("API berhasil diakses tetapi tidak mengembalikan data yang valid.");
      }
    } catch (error) {
      console.error("ERROR TESTING API:", error);
      toast.error(`Error saat mengakses API: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = () => {
    if (stageFilter === 'all') {
      return availableOrders;
    }
    return availableOrders.filter(task => task.stage_name.toLowerCase() === stageFilter.toLowerCase());
  };
  
  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Tugas Tersedia</h2>
        <Link to="/produksi/dashboard" className="btn btn-outline-secondary">
          <FontAwesomeIcon icon={faArrowLeft} className="me-2" />
          Kembali ke Dashboard
        </Link>
      </div>
      
      <Card>
        <Card.Header as="h5" className="bg-primary text-white d-flex justify-content-between align-items-center">
          <div>
            <FontAwesomeIcon icon={faListAlt} className="me-2" />
            Daftar Tugas Tersedia
          </div>
          <Form.Group className="mb-0 d-flex">
            <FontAwesomeIcon icon={faFilter} className="me-2 mt-2 text-white" />
            <Form.Select 
              size="sm"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="all">Semua Tahap</option>
              {userRoles.map((role, index) => (
                <option key={index} value={role}>{role}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-3">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Memuat daftar tugas tersedia...</p>
            </div>
          ) : getFilteredTasks().length === 0 ? (
            <Alert variant="info">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              Tidak ada tugas tersedia untuk diklaim saat ini.
              {stageFilter !== 'all' && (
                <> Coba pilih tahap yang berbeda atau pilih "Semua Tahap".</>
              )}
            </Alert>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Customer</th>
                  <th>Produk</th>
                  <th>Spesifikasi</th>
                  <th>Tahapan</th>
                  <th>Progress</th>
                  <th>Catatan</th>
                  <th>Prioritas</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredTasks().map((task) => (
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
                    <td>
                      <div className="production-stages">
                        <div className="stage-pills">
                          <span className={`stage-pill ${task.stages?.desain ? 'completed' : ''}`} 
                            title="Desain">D</span>
                          <span className={`stage-pill ${task.stages?.operator_mesin ? 'completed' : ''}`} 
                            title="Operator Mesin">OM</span>
                          <span className={`stage-pill ${task.stages?.finishing ? 'completed' : ''}`} 
                            title="Finishing">F</span>
                          <span className={`stage-pill ${task.stages?.quality_control ? 'completed' : ''}`} 
                            title="Quality Control">QC</span>
                          <span className={`stage-pill ${task.stages?.packing ? 'completed' : ''}`} 
                            title="Packing">P</span>
                        </div>
                      </div>
                    </td>
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
                        onClick={() => handleClaimTask(task.id)}
                      >
                        Ambil Tugas
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          {error && (
            <Alert variant="warning" className="mt-3">
              <Alert.Heading>Informasi</Alert.Heading>
              <p>
                Endpoint API untuk tugas tersedia masih dalam pengembangan.
                Sistem menggunakan data yang diproses dari API orders.
              </p>
              <p className="mb-0">
                Pesan error: {errorMessage}
              </p>
            </Alert>
          )}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-3 p-3 border rounded bg-light">
              <h6>Debug Tools:</h6>
              <p>
                <strong>User:</strong> {localStorage.getItem('username')} | 
                <strong>Roles:</strong> {userRoles.join(', ')}
              </p>
              <div className="d-flex flex-wrap gap-2 mt-2">
                <Button 
                  variant="warning" 
                  size="sm" 
                  onClick={() => {
                    localStorage.removeItem('availableTasks');
                    toast.info('Cache tugas tersedia dihapus');
                  }}
                >
                  Clear Cache
                </Button>
                
                <Button 
                  variant="info" 
                  size="sm" 
                  onClick={() => {
                    const mockData = getMockAvailableTasks();
                    setAvailableOrders(mockData);
                    toast.info(`Loaded ${mockData.length} mock tasks`);
                  }}
                >
                  Load Mock Data
                </Button>
                
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => {
                    setLoading(true);
                    fetchAvailableTasks().finally(() => setLoading(false));
                  }}
                >
                  Refresh Data
                </Button>

                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={testApiDirectly}
                >
                  Test API Directly
                </Button>

                {checkOwnerAccess() && (
                  <Button 
                    variant="success" 
                    size="sm" 
                    onClick={() => {
                      window.open('https://rumahakrilik.id/produksi', '_blank');
                    }}
                  >
                    Buka Dashboard Admin
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <div className="mt-4 bg-light p-3 rounded border">
        <h5>Keterangan Prioritas:</h5>
        <div className="d-flex flex-column gap-2">
          <div>
            <Badge bg="danger" className="me-2">Tinggi</Badge>
            <span>Order yang sebagian besar tahapan produksinya sudah selesai</span>
          </div>
          <div>
            <Badge bg="warning" className="me-2">Sedang</Badge>
            <span>Order yang beberapa tahapan produksinya sudah selesai</span>
          </div>
          <div>
            <Badge bg="info" className="me-2">Rendah</Badge>
            <span>Order yang baru memulai proses produksi</span>
          </div>
        </div>
      </div>
      
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Ambil Tugas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Apakah Anda yakin ingin mengambil tugas ini?</p>
          <p>Anda akan bertanggung jawab untuk menyelesaikan tahapan produksi ini.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={confirmClaimTask}>
            Ya, Ambil Tugas
          </Button>
        </Modal.Footer>
      </Modal>

      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-4 p-3 bg-light border rounded">
          <h6>Debug Tools:</h6>
          <div className="d-flex flex-wrap gap-2 mt-2">
            <Button 
              variant="danger" 
              size="sm" 
              onClick={testApiDirectly}
            >
              Test API Connection
            </Button>
            
            <Button 
              variant="warning" 
              size="sm" 
              onClick={() => {
                localStorage.removeItem('availableTasks');
                toast.info('Cache tugas tersedia dihapus');
              }}
            >
              Hapus Cache Tugas
            </Button>
            
            <Button 
              variant="info" 
              size="sm" 
              onClick={() => {
                setAvailableOrders(getMockAvailableTasks());
                toast.info('Data contoh dimuat');
              }}
            >
              Muat Data Contoh
            </Button>
            
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => fetchAvailableTasks()}
            >
              Refresh Data dari API
            </Button>

            {checkOwnerAccess() && (
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => {
                  window.open('https://rumahakrilik.id/produksi', '_blank');
                }}
              >
                Buka Dashboard Admin
              </Button>
            )}
          </div>
          
          <div className="mt-3 small">
            <p><strong>Token:</strong> {localStorage.getItem('jwtToken') ? 
              `${localStorage.getItem('jwtToken').substring(0, 15)}...` : 'Tidak ada'}</p>
            <p><strong>User Roles:</strong> {userRoles.join(', ')}</p>
            <p><strong>API URL:</strong> {API_URL}</p>
          </div>
        </div>
      )}
    </Container>
  );
};

export default AvailableTasksPage;