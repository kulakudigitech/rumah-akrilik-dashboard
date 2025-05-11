import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Spinner, Form, Alert, Tab, Tabs } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxes, faExclamationTriangle, faWarehouse, faShippingFast,
  faClipboardCheck, faSearch, faSort, faSortUp, faSortDown
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { API_URL } from '../../config/constants';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { toast } from 'react-toastify';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './Dashboard.css';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const WarehouseDashboard = () => {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending'
  });
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockCount: 0,
    pendingRequestsCount: 0,
    movementsToday: 0
  });
  const [movementChartData, setMovementChartData] = useState({});
  const [categoryStatsData, setCategoryStatsData] = useState({});

  // Fetch data when component mounts
  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      setLoading(true);
      
      try {
        // Try to fetch from API
        const token = localStorage.getItem('jwtToken');
        const [inventoryResponse, lowStockResponse, movementsResponse, requestsResponse] = await Promise.all([
          axios.get(`${API_URL}/inventory/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/inventory/low-stock/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/inventory/movements/recent/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_URL}/inventory/requests/pending/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setInventoryItems(inventoryResponse.data);
        setLowStockItems(lowStockResponse.data);
        setRecentMovements(movementsResponse.data);
        setPendingRequests(requestsResponse.data);
        
        // Set statistics
        setStats({
          totalItems: inventoryResponse.data.length,
          lowStockCount: lowStockResponse.data.length,
          pendingRequestsCount: requestsResponse.data.length,
          movementsToday: movementsResponse.data.filter(m => 
            new Date(m.timestamp).toDateString() === new Date().toDateString()
          ).length
        });
        
        // Prepare chart data
        prepareMovementChartData(movementsResponse.data);
        prepareCategoryStatsData(inventoryResponse.data);
        
      } catch (apiError) {
        console.error('Error fetching from API, using dummy data:', apiError);
        loadDummyData();
      }
    } catch (error) {
      console.error('Error in fetchWarehouseData:', error);
      loadDummyData();
    } finally {
      setLoading(false);
    }
  };

  const loadDummyData = () => {
    // Dummy inventory items
    const dummyInventory = [
      { 
        id: 1, 
        name: 'Akrilik Bening 2mm', 
        sku: 'AKR-B-2MM', 
        category: 'Akrilik Bening',
        unit: 'Lembar',
        currentStock: 50, 
        minimumStock: 20, 
        location: 'Rak A-1', 
        price: 120000 
      },
      { 
        id: 2, 
        name: 'Akrilik Bening 3mm', 
        sku: 'AKR-B-3MM', 
        category: 'Akrilik Bening',
        unit: 'Lembar',
        currentStock: 30, 
        minimumStock: 15, 
        location: 'Rak A-2', 
        price: 175000 
      },
      { 
        id: 3, 
        name: 'Akrilik Susu 2mm', 
        sku: 'AKR-S-2MM', 
        category: 'Akrilik Susu',
        unit: 'Lembar',
        currentStock: 40, 
        minimumStock: 20, 
        location: 'Rak B-1', 
        price: 130000 
      },
      { 
        id: 4, 
        name: 'Akrilik Susu 3mm', 
        sku: 'AKR-S-3MM', 
        category: 'Akrilik Susu',
        unit: 'Lembar',
        currentStock: 25, 
        minimumStock: 15, 
        location: 'Rak B-2', 
        price: 185000 
      },
      { 
        id: 5, 
        name: 'Akrilik Warna Merah 3mm', 
        sku: 'AKR-WM-3MM', 
        category: 'Akrilik Warna',
        unit: 'Lembar',
        currentStock: 10, 
        minimumStock: 10, 
        location: 'Rak C-1', 
        price: 200000 
      },
      { 
        id: 6, 
        name: 'Akrilik Warna Biru 3mm', 
        sku: 'AKR-WB-3MM', 
        category: 'Akrilik Warna',
        unit: 'Lembar',
        currentStock: 8, 
        minimumStock: 10, 
        location: 'Rak C-2', 
        price: 200000 
      },
      { 
        id: 7, 
        name: 'Lem Akrilik', 
        sku: 'ACC-LEM-01', 
        category: 'Aksesoris',
        unit: 'Botol',
        currentStock: 15, 
        minimumStock: 20, 
        location: 'Rak D-1', 
        price: 85000 
      },
      { 
        id: 8, 
        name: 'LED Strip 5m', 
        sku: 'ACC-LED-01', 
        category: 'Aksesoris',
        unit: 'Roll',
        currentStock: 25, 
        minimumStock: 15, 
        location: 'Rak D-2', 
        price: 125000 
      },
    ];
    
    // Identify low stock items
    const dummyLowStock = dummyInventory.filter(item => item.currentStock <= item.minimumStock);
    
    // Generate dummy movements
    const dummyMovements = [
      { 
        id: 1, 
        itemName: 'Akrilik Bening 3mm', 
        type: 'out', 
        quantity: 5, 
        timestamp: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
        requestedBy: 'Tim Produksi',
        handledBy: 'Admin Gudang',
        reference: 'ORD-2025001' 
      },
      { 
        id: 2, 
        itemName: 'Akrilik Susu 2mm', 
        type: 'out', 
        quantity: 3, 
        timestamp: new Date().toISOString(),
        requestedBy: 'Tim Produksi',
        handledBy: 'Admin Gudang',
        reference: 'ORD-2025002' 
      },
      { 
        id: 3, 
        itemName: 'Akrilik Bening 2mm', 
        type: 'in', 
        quantity: 20, 
        timestamp: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
        requestedBy: '-',
        handledBy: 'Admin Gudang',
        reference: 'PO-2025005' 
      },
      { 
        id: 4, 
        itemName: 'LED Strip 5m', 
        type: 'out', 
        quantity: 2, 
        timestamp: new Date().toISOString(),
        requestedBy: 'Tim Produksi',
        handledBy: 'Admin Gudang',
        reference: 'ORD-2025003' 
      },
      { 
        id: 5, 
        itemName: 'Lem Akrilik', 
        type: 'out', 
        quantity: 3, 
        timestamp: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
        requestedBy: 'Tim Produksi',
        handledBy: 'Admin Gudang',
        reference: 'ORD-2025001' 
      },
    ];
    
    // Generate dummy requests
    const dummyRequests = [
      {
        id: 1,
        itemName: 'Akrilik Bening 3mm',
        quantity: 2,
        requestedBy: 'Tim Produksi - Budi',
        status: 'pending',
        requestDate: new Date().toISOString(),
        orderId: 'ORD-2025004'
      },
      {
        id: 2,
        itemName: 'Akrilik Warna Biru 3mm',
        quantity: 1,
        requestedBy: 'Tim Produksi - Andi',
        status: 'pending',
        requestDate: new Date(new Date().setHours(new Date().getHours() - 3)).toISOString(),
        orderId: 'ORD-2025005'
      },
      {
        id: 3,
        itemName: 'LED Strip 5m',
        quantity: 1,
        requestedBy: 'Tim Produksi - Siti',
        status: 'pending',
        requestDate: new Date(new Date().setHours(new Date().getHours() - 5)).toISOString(),
        orderId: 'ORD-2025006'
      }
    ];
    
    // Set the dummy data to state
    setInventoryItems(dummyInventory);
    setLowStockItems(dummyLowStock);
    setRecentMovements(dummyMovements);
    setPendingRequests(dummyRequests);
    
    // Update stats
    setStats({
      totalItems: dummyInventory.length,
      lowStockCount: dummyLowStock.length,
      pendingRequestsCount: dummyRequests.length,
      movementsToday: dummyMovements.filter(m => 
        new Date(m.timestamp).toDateString() === new Date().toDateString()
      ).length
    });
    
    // Prepare chart data
    prepareMovementChartData(dummyMovements);
    prepareCategoryStatsData(dummyInventory);
  };
  
  // Prepare movement chart data
  const prepareMovementChartData = (movements) => {
    // Get the last 7 days
    const dates = [];
    const inData = [];
    const outData = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      dates.push(dateString);
      
      // Count in/out for this date
      const dateMovements = movements.filter(m => 
        new Date(m.timestamp).toDateString() === date.toDateString()
      );
      
      inData.push(dateMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.quantity, 0));
      outData.push(dateMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.quantity, 0));
    }
    
    setMovementChartData({
      labels: dates,
      datasets: [
        {
          label: 'Barang Masuk',
          data: inData,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          tension: 0.4
        },
        {
          label: 'Barang Keluar',
          data: outData,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    });
  };
  
  // Prepare category stats data
  const prepareCategoryStatsData = (inventory) => {
    // Group by category
    const categories = {};
    inventory.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = 0;
      }
      categories[item.category] += item.currentStock;
    });
    
    // Convert to chart data
    const labels = Object.keys(categories);
    const data = Object.values(categories);
    
    setCategoryStatsData({
      labels,
      datasets: [
        {
          label: 'Stok per Kategori',
          data,
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
          borderWidth: 1
        }
      ]
    });
  };

  // Sort function for inventory table
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter function for search
  const filteredInventory = inventoryItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Apply sorting
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  // Handle request approval
  const handleApproveRequest = (requestId) => {
    // In a real app, this would call an API
    toast.success(`Permintaan #${requestId} telah disetujui`);
    setPendingRequests(pendingRequests.filter(request => request.id !== requestId));
    setStats(prevStats => ({
      ...prevStats,
      pendingRequestsCount: prevStats.pendingRequestsCount - 1
    }));
  };

  // Function to render sort icon
  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? 
        <FontAwesomeIcon icon={faSortUp} className="ms-1" /> : 
        <FontAwesomeIcon icon={faSortDown} className="ms-1" />;
    }
    return <FontAwesomeIcon icon={faSort} className="ms-1 text-muted" />;
  };

  // Function to get badge variant based on stock level
  const getStockBadgeVariant = (currentStock, minimumStock) => {
    if (currentStock <= minimumStock * 0.5) return 'danger';
    if (currentStock <= minimumStock) return 'warning';
    return 'success';
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Gudang</h1>
      <p className="dashboard-subtitle">Manajemen stok dan aktivitas gudang</p>

      <Row className="mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faBoxes} />
              </div>
              <div className="stat-details">
                <h3>{stats.totalItems}</h3>
                <p>Total Item Inventaris</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon red">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="stat-details">
                <h3>{stats.lowStockCount}</h3>
                <p>Stok Menipis</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon orange">
                <FontAwesomeIcon icon={faClipboardCheck} />
              </div>
              <div className="stat-details">
                <h3>{stats.pendingRequestsCount}</h3>
                <p>Permintaan Tertunda</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faShippingFast} />
              </div>
              <div className="stat-details">
                <h3>{stats.movementsToday}</h3>
                <p>Pergerakan Hari Ini</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h3 className="m-0">Aktivitas Barang (7 Hari Terakhir)</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <Line 
                  data={movementChartData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${context.raw} unit`;
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header className="bg-success text-white">
              <h3 className="m-0">Distribusi Stok per Kategori</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : (
                <Bar 
                  data={categoryStatsData}
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          precision: 0
                        }
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.label}: ${context.raw} unit`;
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="inventory" className="mb-4">
        <Tab eventKey="inventory" title="Inventaris">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="m-0">Daftar Inventaris</h3>
              <div className="search-container">
                <Form.Control
                  type="text"
                  placeholder="Cari item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th onClick={() => requestSort('name')}>
                          Nama Item {renderSortIcon('name')}
                        </th>
                        <th onClick={() => requestSort('sku')}>
                          SKU {renderSortIcon('sku')}
                        </th>
                        <th onClick={() => requestSort('category')}>
                          Kategori {renderSortIcon('category')}
                        </th>
                        <th onClick={() => requestSort('currentStock')}>
                          Stok Tersedia {renderSortIcon('currentStock')}
                        </th>
                        <th onClick={() => requestSort('location')}>
                          Lokasi {renderSortIcon('location')}
                        </th>
                        <th onClick={() => requestSort('price')}>
                          Harga {renderSortIcon('price')}
                        </th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedInventory.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.sku}</td>
                          <td>{item.category}</td>
                          <td>{item.currentStock} {item.unit}</td>
                          <td>{item.location}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            <Badge bg={getStockBadgeVariant(item.currentStock, item.minimumStock)}>
                              {item.currentStock <= item.minimumStock * 0.5 ? 'Kritis' : 
                               item.currentStock <= item.minimumStock ? 'Stok Menipis' : 'Stok Baik'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="low-stock" title={`Stok Menipis (${lowStockItems.length})`}>
          <Card>
            <Card.Header>
              <h3 className="m-0">Item dengan Stok Menipis</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="warning" />
                </div>
              ) : lowStockItems.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>Nama Item</th>
                        <th>SKU</th>
                        <th>Kategori</th>
                        <th>Stok Saat Ini</th>
                        <th>Stok Minimum</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map(item => (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{item.sku}</td>
                          <td>{item.category}</td>
                          <td>{item.currentStock} {item.unit}</td>
                          <td>{item.minimumStock} {item.unit}</td>
                          <td>
                            <Badge bg={getStockBadgeVariant(item.currentStock, item.minimumStock)}>
                              {item.currentStock <= item.minimumStock * 0.5 ? 'Kritis' : 'Stok Menipis'}
                            </Badge>
                          </td>
                          <td>
                            <Button size="sm" variant="outline-primary">
                              Buat PO
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="success">
                  Tidak ada item dengan stok menipis. Semua stok dalam kondisi baik.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="requests" title={`Permintaan (${pendingRequests.length})`}>
          <Card>
            <Card.Header>
              <h3 className="m-0">Permintaan Barang dari Produksi</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="info" />
                </div>
              ) : pendingRequests.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Jumlah</th>
                        <th>Pemohon</th>
                        <th>Untuk Order</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingRequests.map(request => (
                        <tr key={request.id}>
                          <td>#{request.id}</td>
                          <td>{request.itemName}</td>
                          <td>{request.quantity}</td>
                          <td>{request.requestedBy}</td>
                          <td>{request.orderId}</td>
                          <td>{new Date(request.requestDate).toLocaleDateString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="success"
                              onClick={() => handleApproveRequest(request.id)}
                            >
                              Setujui
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  Tidak ada permintaan barang yang tertunda.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="movements" title="Aktivitas Terakhir">
          <Card>
            <Card.Header>
              <h3 className="m-0">Pergerakan Barang Terakhir</h3>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center p-5">
                  <Spinner animation="border" variant="danger" />
                </div>
              ) : recentMovements.length > 0 ? (
                <div className="table-responsive">
                  <Table striped hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Item</th>
                        <th>Tipe</th>
                        <th>Jumlah</th>
                        <th>Waktu</th>
                        <th>Permintaan</th>
                        <th>Referensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMovements.map(movement => (
                        <tr key={movement.id}>
                          <td>#{movement.id}</td>
                          <td>{movement.itemName}</td>
                          <td>
                            <Badge bg={movement.type === 'in' ? 'success' : 'danger'}>
                              {movement.type === 'in' ? 'Masuk' : 'Keluar'}
                            </Badge>
                          </td>
                          <td>{movement.quantity}</td>
                          <td>{new Date(movement.timestamp).toLocaleDateString('id-ID', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}</td>
                          <td>{movement.requestedBy}</td>
                          <td>{movement.reference}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <Alert variant="info">
                  Belum ada aktivitas pergerakan barang yang tercatat.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
};

export default WarehouseDashboard;