import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Badge, Table, Button } from 'react-bootstrap';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import axios from 'axios';

const RealTimeDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0
  });
  
  const [chartData, setChartData] = useState({
    hourlyOrdersData: null,
    sourcesData: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Function to fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const response = await axios.get('https://rumahakrilik.id/api/dashboard/realtime/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data) {
        // Update stats
        setStats({
          totalOrders: response.data.total_orders || 0,
          todayOrders: response.data.today_orders || 0,
          pendingOrders: response.data.pending_orders || 0,
          totalRevenue: response.data.total_revenue || 0,
          todayRevenue: response.data.today_revenue || 0
        });
        
        // Update chart data
        setChartData({
          hourlyOrdersData: {
            labels: response.data.hourly_data.map(h => h.hour),
            datasets: [
              {
                label: 'Orders',
                data: response.data.hourly_data.map(h => h.orders),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          },
          sourcesData: {
            labels: response.data.sources.map(s => s.source),
            datasets: [
              {
                data: response.data.sources.map(s => s.count),
                backgroundColor: [
                  'rgba(255, 99, 132, 0.7)',
                  'rgba(54, 162, 235, 0.7)',
                  'rgba(255, 206, 86, 0.7)',
                  'rgba(75, 192, 192, 0.7)',
                  'rgba(153, 102, 255, 0.7)',
                  'rgba(255, 159, 64, 0.7)'
                ],
                borderWidth: 1
              }
            ]
          }
        });
        
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching real-time dashboard data:", err);
      setError("Gagal memuat data real-time. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Initial fetch and setup interval
  useEffect(() => {
    fetchDashboardData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchDashboardData]);
  
  return (
    <div>
      <h4 className="mb-4">Real-Time Marketing Dashboard</h4>
      
      {/* Stats Row */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted mb-2">Total Orders</h6>
              <h2>{stats.totalOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted mb-2">Today's Orders</h6>
              <h2>{stats.todayOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted mb-2">Pending Orders</h6>
              <h2>{stats.pendingOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
              <h6 className="text-muted mb-2">Today's Revenue</h6>
              <h2>{formatCurrency(stats.todayRevenue)}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Charts Row */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Hourly Order Trends</h5>
            </Card.Header>
            <Card.Body>
              {chartData.hourlyOrdersData ? (
                <Line
                  data={chartData.hourlyOrdersData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center py-5">Loading data...</div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">Order Sources</h5>
            </Card.Header>
            <Card.Body>
              {chartData.sourcesData ? (
                <Doughnut
                  data={chartData.sourcesData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              ) : (
                <div className="text-center py-5">Loading data...</div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default RealTimeDashboard;