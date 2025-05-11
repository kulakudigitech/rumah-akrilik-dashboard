// /root/rumah-akrilik/rumah-akrilik-dashboard/src/pages/produksi/ProductionOrderList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { FaSync, FaEdit, FaEye } from 'react-icons/fa';

const ProductionOrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('jwtToken') || localStorage.getItem('token');
      
      const response = await fetch('https://rumahakrilik.id/api/order/?status__name__icontains=produksi', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error (Status ${response.status}):`, errorText);
        throw new Error(`API responded with status code ${response.status}`);
      }

      const data = await response.json();
      console.log("Production orders loaded:", data);
      
      // Handle both array and object with results array
      const ordersList = Array.isArray(data) ? data : (data.results || []);
      setOrders(ordersList);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError(`Failed to load production orders: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  if (loading && !refreshing) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading production orders...</p>
      </div>
    );
  }

  return (
    <Container fluid className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Daftar Order Produksi</h2>
        <Button
          onClick={handleRefresh}
          variant="primary"
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              <span className="ms-2">Refreshing...</span>
            </>
          ) : (
            <>
              <FaSync className="me-2" /> Refresh
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={handleRefresh}>
            Try Again
          </Button>
        </Alert>
      )}

      {!error && orders.length === 0 && (
        <Alert variant="info">
          <p>No production orders found.</p>
        </Alert>
      )}

      {orders.length > 0 && (
        <Card>
          <Card.Body className="p-0">
            <Table striped hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.order_number}</td>
                    <td>{order.customer?.name || 'N/A'}</td>
                    <td>{new Date(order.order_date).toLocaleDateString()}</td>
                    <td>
                      <Badge bg="info">{order.status?.name || 'Produksi'}</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Link to={`/produksi/${order.id}`} className="btn btn-sm btn-outline-primary">
                          <FaEye className="me-1" /> View
                        </Link>
                        <Link to={`/produksi/${order.id}`} className="btn btn-sm btn-outline-secondary">
                          <FaEdit className="me-1" /> Update
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default ProductionOrderList;
