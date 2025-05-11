import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyBillWave, faArrowUp, faArrowDown, faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { Line, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import { API_URL, CURRENCY_OPTIONS } from '../../config/constants';
import { formatCurrency } from '../../utils/formatters';
import './Dashboard.css';

const FinanceDashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    pendingInvoices: 0,
    profitMargin: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [financialData, setFinancialData] = useState({});
  const [expenseBreakdown, setExpenseBreakdown] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // API call here
        // Gunakan data dummy untuk sementara
        setStats({
          totalRevenue: 45000000,
          totalExpenses: 28000000,
          pendingInvoices: 6,
          profitMargin: 37.8 // (45M - 28M) / 45M * 100
        });
        
        setRecentTransactions([
          { 
            id: 'TRX001', 
            date: '2025-05-10', 
            description: 'Pembayaran INV-20250510-0002', 
            amount: 3000000, 
            type: 'income',
            customer: 'Andi Santoso'
          },
          { 
            id: 'TRX002', 
            date: '2025-05-09', 
            description: 'Pembayaran Supplier Bahan Akrilik', 
            amount: 5000000, 
            type: 'expense',
            customer: 'PT Akrilik Jaya'
          },
          { 
            id: 'TRX003', 
            date: '2025-05-08', 
            description: 'Pembayaran INV-20250508-0001', 
            amount: 2500000, 
            type: 'income',
            customer: 'Budi Santoso'
          },
          { 
            id: 'TRX004', 
            date: '2025-05-07', 
            description: 'Pembayaran Listrik', 
            amount: 1500000, 
            type: 'expense',
            customer: 'PLN'
          }
        ]);
        
        // Data for revenue chart
        setFinancialData({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              label: 'Revenue',
              data: [30000000, 35000000, 42000000, 38000000, 45000000],
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.4
            },
            {
              label: 'Expenses',
              data: [20000000, 22000000, 25000000, 26000000, 28000000],
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              tension: 0.4
            }
          ]
        });
        
        // Data for expense breakdown
        setExpenseBreakdown({
          labels: ['Bahan Baku', 'Gaji', 'Operasional', 'Marketing', 'Lain-lain'],
          datasets: [
            {
              data: [40, 25, 15, 10, 10],
              backgroundColor: [
                'rgba(75, 192, 192, 0.7)',
                'rgba(255, 99, 132, 0.7)',
                'rgba(255, 205, 86, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(153, 102, 255, 0.7)'
              ],
              hoverOffset: 4
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching finance dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTransactionBadge = (type) => {
    switch(type) {
      case 'income':
        return <Badge bg="success">Pemasukan</Badge>;
      case 'expense':
        return <Badge bg="danger">Pengeluaran</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Dashboard Keuangan</h1>
      <p className="dashboard-subtitle">Analisis keuangan dan laporan</p>

      <Row className="stat-cards">
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon green">
                <FontAwesomeIcon icon={faArrowUp} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.totalRevenue)}</h3>
                <p>Total Pemasukan</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon red">
                <FontAwesomeIcon icon={faArrowDown} />
              </div>
              <div className="stat-details">
                <h3>{formatCurrency(stats.totalExpenses)}</h3>
                <p>Total Pengeluaran</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon orange">
                <FontAwesomeIcon icon={faFileInvoice} />
              </div>
              <div className="stat-details">
                <h3>{stats.pendingInvoices}</h3>
                <p>Invoice Tertunda</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} sm={6}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-icon blue">
                <FontAwesomeIcon icon={faMoneyBillWave} />
              </div>
              <div className="stat-details">
                <h3>{stats.profitMargin}%</h3>
                <p>Profit Margin</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={8}>
          <Card>
            <Card.Header as="h5">Tren Keuangan (2025)</Card.Header>
            <Card.Body>
              <Line 
                data={financialData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return 'Rp ' + value.toLocaleString('id-ID');
                        }
                      }
                    }
                  }
                }}
                height={300}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Header as="h5">Breakdown Pengeluaran</Card.Header>
            <Card.Body>
              <Doughnut 
                data={expenseBreakdown}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
                height={250}
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
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tanggal</th>
                    <th>Deskripsi</th>
                    <th>Customer/Vendor</th>
                    <th>Jumlah</th>
                    <th>Tipe</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td>{transaction.id}</td>
                      <td>{new Date(transaction.date).toLocaleDateString('id-ID')}</td>
                      <td>{transaction.description}</td>
                      <td>{transaction.customer}</td>
                      <td className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td>{getTransactionBadge(transaction.type)}</td>
                      <td>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          href={`/keuangan/transactions/${transaction.id}`}
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
              <Button variant="primary" href="/keuangan/transactions">Lihat Semua Transaksi</Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Invoice Tertunda</Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <strong>6 invoice</strong> dengan total nilai <strong>{formatCurrency(8500000)}</strong> menunggu pembayaran.
              </div>
              <Button variant="outline-primary" href="/keuangan/invoices">Lihat Invoice</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Header as="h5">Aksi Cepat</Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="primary" href="/keuangan/transactions/create">Catat Transaksi Baru</Button>
                <Button variant="success" href="/keuangan/reports/generate">Generate Laporan Bulanan</Button>
                <Button variant="info" href="/keuangan/cash-flow">Lihat Cash Flow</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FinanceDashboard;