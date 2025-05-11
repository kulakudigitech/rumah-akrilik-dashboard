import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Form, Button, InputGroup, Pagination, Badge, Row, Col, Dropdown, Spinner, Alert, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaSort, FaEye, FaPencilAlt, FaTrash, FaFileInvoice, FaEllipsisV } from 'react-icons/fa';
import axios from 'axios';

const OrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Add state for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  // Fetch data from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('jwtToken');
      const baseURL = 'https://rumahakrilik.id';

      // Build query parameters
      let queryParams = `page_size=10&page=${page}`;
      if (searchTerm) queryParams += `&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter !== 'all') queryParams += `&status=${encodeURIComponent(statusFilter)}`;
      if (dateRange.startDate) queryParams += `&start_date=${dateRange.startDate}`;
      if (dateRange.endDate) queryParams += `&end_date=${dateRange.endDate}`;

      const response = await axios.get(`${baseURL}/api/orders/?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Store the next/previous URLs for direct use
      const nextPageUrl = response.data.next;
      const prevPageUrl = response.data.previous;
      console.log("Next Page URL:", nextPageUrl);
      console.log("Previous Page URL:", prevPageUrl);
      console.log("API Response:", response.data);

      setOrders(response.data.results || []);
      setTotalItems(response.data.count || 0);
      setTotalPages(Math.ceil((response.data.count || 0) / 10));

    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.detail || `Failed to load orders: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [page]);

  // Handler for search form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    setPage(1); // Reset to first page
    fetchOrders();
  };

  // Handler for pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handler for delete confirmation
  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const baseURL = 'https://rumahakrilik.id';

      await axios.delete(`${baseURL}/api/orders/${orderToDelete}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Refresh order list
      fetchOrders();

      // Close modal and reset order to delete
      setShowDeleteModal(false);
      setOrderToDelete(null);

    } catch (err) {
      console.error("Error deleting order:", err);
      setError(`Failed to delete order: ${err.response?.data?.detail || err.message}`);
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  // Format currency helper function
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Rp 0';

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return '-';

    try {
      return new Date(dateString).toLocaleDateString('id-ID');
    } catch (e) {
      console.error("Date format error:", e);
      return dateString;
    }
  };

  // Status badge helper function
  const getStatusBadge = (status) => {
    if (!status) return <Badge bg="secondary">Unknown</Badge>;

    let variant = 'secondary';
    const statusName = status.toLowerCase();

    if (statusName.includes('baru')) variant = 'info';
    else if (statusName.includes('produksi')) variant = 'primary';
    else if (statusName.includes('siap')) variant = 'warning';
    else if (statusName.includes('selesai')) variant = 'success';
    else if (statusName.includes('batal')) variant = 'danger';

    return <Badge bg={variant}>{status}</Badge>;
  };

  // Pagination component
  const renderPagination = () => {
    const items = [];
    const maxVisiblePages = 5;

    // Always show first page
    items.push(
      <Pagination.Item 
        key="first"
        onClick={() => handlePageChange(1)}
        active={page === 1}
      >
        1
      </Pagination.Item>
    );

    // Calculate range of pages to show
    let startPage = Math.max(2, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3);

    // Adjust if we're near the beginning or end
    if (startPage > 2) {
      items.push(<Pagination.Ellipsis key="ellipsis-start" />);
    }

    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          onClick={() => handlePageChange(i)}
          active={page === i}
        >
          {i}
        </Pagination.Item>
      );
    }

    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      items.push(<Pagination.Ellipsis key="ellipsis-end" />);
    }

    // Always show last page if we have more than 1 page
    if (totalPages > 1) {
      items.push(
        <Pagination.Item
          key="last"
          onClick={() => handlePageChange(totalPages)}
          active={page === totalPages}
        >
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination>
        <Pagination.Prev 
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={page === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
        />
      </Pagination>
    );
  };

  return (
    <Container fluid className="py-4">
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0">Daftar Order</h5>
          <Button 
            variant="primary" 
            size="sm"
            as={Link}
            to="/form-input-order"
          >
            Tambah Order Baru
          </Button>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSubmit} className="mb-4">
            <Row className="g-3">
              <Col md={4}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Cari order, customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button type="submit" variant="outline-secondary">
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Col>
              
              <Col md={3}>
                <Form.Select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Semua Status</option>
                  <option value="baru">Baru</option>
                  <option value="produksi">Produksi</option>
                  <option value="siap kirim">Siap Kirim</option>
                  <option value="selesai">Selesai</option>
                  <option value="batal">Batal</option>
                </Form.Select>
              </Col>
              
              <Col md={2}>
                <Form.Control
                  type="date"
                  placeholder="From"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                />
              </Col>
              
              <Col md={2}>
                <Form.Control
                  type="date"
                  placeholder="To"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                />
              </Col>
              
              <Col md={1}>
                <Button type="submit" variant="primary" className="w-100">
                  <FaFilter /> Filter
                </Button>
              </Col>
            </Row>
          </Form>
          
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading orders...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>No. Order</th>
                      <th>Tanggal</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Sumber</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.order_number || `#${order.id}`}</td>
                          <td>{formatDate(order.order_date)}</td>
                          <td>{order.customer?.name || '-'}</td>
                          <td>{formatCurrency(order.total || order.calculated_total)}</td>
                          <td>{getStatusBadge(order.status?.name)}</td>
                          <td>{order.sumber_order || '-'}</td>
                          <td>
                            <div className="d-flex justify-content-center gap-2">
                              <Button 
                                variant="outline-info" 
                                size="sm" 
                                title="View"
                                as={Link}
                                to={`/order-detail/${order.id}`}
                              >
                                <FaEye />
                              </Button>
                              <Button 
                                variant="outline-primary" 
                                size="sm" 
                                title="Edit"
                                as={Link}
                                to={`/form-input-order/${order.id}`}
                              >
                                <FaPencilAlt />
                              </Button>
                              <Button 
                                variant="outline-danger" 
                                size="sm" 
                                title="Delete"
                                onClick={() => {
                                  setOrderToDelete(order.id);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <FaTrash />
                              </Button>
                              <Button 
                                variant="outline-success" 
                                size="sm" 
                                title="Invoice"
                                as={Link}
                                to={`/invoice/${order.id}`}
                              >
                                <FaFileInvoice />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              
              <div className="d-flex justify-content-between align-items-center mt-4">
                <p className="mb-0">
                  Showing {orders.length} of {totalItems} orders
                </p>
                {totalPages > 1 && (
                  <div className="d-flex justify-content-end">
                    {renderPagination()}
                  </div>
                )}
              </div>
            </>
          )}
        </Card.Body>
      </Card>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this order? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteConfirm}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Deleting...
              </>
            ) : (
              'Delete Order'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default OrderList;