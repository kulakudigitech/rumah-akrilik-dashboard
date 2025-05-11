import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button, Form, ProgressBar } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBoxes, faExclamationTriangle, faSync, faClipboardCheck,
  faArrowDown, faArrowUp, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const WarehouseDashboard = () => {
  // States
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStockItems: 0,
    stockValue: 0,
    incomingDeliveries: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [inventoryMovement, setInventoryMovement] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Dummy data
        setStats({
          totalItems: 152,
          lowStockItems: 8,
          stockValue: 75650000,
          incomingDeliveries: 3
        });
        
        // Low stock items
        setLowStockItems([
          { id: 1, code: 'AKR-001', name: 'Lembaran Akrilik Bening 3mm', stock: 5, minimum: 10, unit: 'lembar', supplier: 'PT Plastik Jaya' },
          { id: 2, code: 'AKR-008', name: 'Lembaran Akrilik Putih 5mm', stock: 3, minimum: 8, unit: 'lembar', supplier: 'PT Plastik Jaya' },
          { id: 3, code: 'LED-005', name: 'LED Strip 5050 Putih', stock: 25, minimum: 50, unit: 'meter', supplier: 'Cahaya LED' },
          { id: 4, code: 'CTR-002', name: 'Cutting Laser 100W', stock: 1, minimum: 2, unit: 'buah', supplier: 'Toko Mesin Jaya' },
          { id: 5, code: 'PLA-012', name: 'Lem Khusus Akrilik', stock: 8, minimum: 15, unit: 'botol', supplier: 'PT Kimia Adhesi' },
          { id: 6, code: 'CAT-007', name: 'Cat UV Print Cyan', stock: 2, minimum: 5, unit: 'liter', supplier: 'Tinta Cemerlang' },
          { id: 7, code: 'PKG-003', name: 'Kardus Packaging 60x40', stock: 32, minimum: 50, unit: 'pcs', supplier: 'Packindo' },
          { id: 8, code: 'ALM-002', name: 'Profil Aluminium 1 inch', stock: 12, minimum: 20, unit: 'batang', supplier: 'Alumina Metal' },
        ]);
        
        // Inventory movement data for chart
        const inventoryData = {
          labels: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
          datasets: [
            {
              label: 'Barang Masuk',
              data: [8, 12, 5, 10, 15, 7],
              backgroundColor: 'rgba(0, 123, 255, 0.5)',
            },
            {
              label: 'Barang Keluar',
              data: [5, 8, 12, 7, 11, 9],
              backgroundColor: 'rgba(220, 53, 69, 0.5)',
            }
          ]
        };
        setInventoryMovement(inventoryData);
        
        // Recent transactions
        setRecentTransactions([
          { id: 1, date: '2025-05-11', type: 'in', item: 'Lembaran Akrilik Bening 2mm', quantity: 20, reference: 'PO-2025050001', person: 'Ahmad (Gudang)' },
          { id: 2, date: '2025-05-11', type: 'out', item: 'LED Strip 5050 RGB', quantity: 12, reference: 'INV-20250510-004', person: 'Budi (Produksi)' },
          { id: 3, date: '2025-05-10', type: 'in', item: 'Cat UV Print CMYK Set', quantity: 4, reference: 'PO-2025050002', person: 'Ahmad (Gudang)' },
          { id: 4, date: '2025-05-10', type: 'out', item: 'Lembaran Akrilik Putih 3mm', quantity: 5, reference: 'INV-20250509-007', person: 'Citra (Produksi)' },
          { id: 5, date: '2025-05-09', type: 'out', item: 'Profil Aluminium 1 inch', quantity: 8, reference: 'INV-20250508-002', person: 'Deni (Produksi)' },
        ]);
        
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Filter low stock items based on search term
  const filteredLowStockItems = lowStockItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get transaction type badge
  const getTransactionBadge = (type) => {
    switch(type) {
      case 'in':
        return <Badge bg="success"><FontAwesomeIcon icon={faArrowDown} className="me-1" /> Masuk</Badge>;
      case 'out':
        return <Badge bg="danger"><FontAwesomeIcon icon={faArrowUp} className="me-1" /> Keluar</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Gudang</h1>
      <p className="dashboard-subtitle">Monitoring stok dan pengiriman</p>

      <Row className="stat-cards">
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faBoxes} />
              </div>
              <div className="stat-details">
                <h3>{stats.totalItems}</h3>
                <p>Total Item</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon red">
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <div className="stat-details">
                <h3>{stats.lowStockItems}</h3>
                <p>Stok Menipis</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon orange">
                <FontAwesomeIcon icon={faSync} />
              </div>
              <div className="stat-details">
                <h3>{stats.incomingDeliveries}</h3>
                <p>Pengiriman Masuk</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faClipboardCheck} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.stockValue)}</h3>
                <p>Nilai Stok</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Stok Menipis</Card.Header>
            <Card.Body>
              <Form className="mb-3">
                <Form.Control 
                  type="text" 
                  placeholder="Cari item..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Form>
              {filteredLowStockItems.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Kode</th>
                      <th>Item</th>
                      <th>Stok</th>
                      <th>Minimum</th>
                      <th>Unit</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLowStockItems.map(item => (
                      <tr key={item.id}>
                        <td>{item.code}</td>
                        <td>{item.name}</td>
                        <td className="text-danger">{item.stock}</td>
                        <td>{item.minimum}</td>
                        <td>{item.unit}</td>
                        <td>{item.supplier}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center">Tidak ada item yang sesuai.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Pergerakan Inventaris</Card.Header>
            <Card.Body>
              <Bar 
                data={inventoryMovement} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header as="h5">Transaksi Terbaru</Card.Header>
            <Card.Body>
              {recentTransactions.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Jenis</th>
                      <th>Item</th>
                      <th>Jumlah</th>
                      <th>Referensi</th>
                      <th>Person</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.date).toLocaleDateString('id-ID')}</td>
                        <td>{getTransactionBadge(transaction.type)}</td>
                        <td>{transaction.item}</td>
                        <td>{transaction.quantity}</td>
                        <td>{transaction.reference}</td>
                        <td>{transaction.person}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center">Tidak ada transaksi terbaru.</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseDashboard;