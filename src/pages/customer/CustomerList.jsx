import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye, FaEdit, FaPlus, FaSync } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [useMockData]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let data;
      
      if (useMockData) {
        // Mock data jika API gagal atau untuk pengembangan
        data = generateMockCustomers();
      } else {
        // Coba ambil data dari API
        try {
          const response = await fetch('https://rumahakrilik.id/api/customers/', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
          }
          
          data = await response.json();
        } catch (apiError) {
          console.error('API Error:', apiError);
          // Jika API error, gunakan mock data
          console.log('Using mock data instead');
          data = generateMockCustomers();
        }
      }
      
      setCustomers(Array.isArray(data) ? data : (data?.results || []));
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Gagal memuat data pelanggan. Silakan coba lagi nanti.');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCustomers = () => {
    // Generate some mock data for development/testing
    return Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Customer ${i + 1}`,
      phone: `08123456${i.toString().padStart(4, '0')}`,
      email: `customer${i + 1}@example.com`,
      address: `Jalan Contoh No. ${i + 1}, Jakarta`,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 9000000000)).toISOString(),
      total_orders: Math.floor(Math.random() * 10),
      status: Math.random() > 0.3 ? 'active' : 'inactive'
    }));
  };

  // Tambahkan fungsi handleDelete
  const handleDelete = (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus pelanggan "${name}"?`)) {
      setLoading(true);
      
      const token = localStorage.getItem('jwtToken');
      
      axios.delete(`https://rumahakrilik.id/api/customers/${id}/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(() => {
          toast.success('Pelanggan berhasil dihapus');
          // Re-fetch data setelah penghapusan
          fetchCustomers();
        })
        .catch(error => {
          console.error('Error deleting customer:', error);
          toast.error('Gagal menghapus pelanggan');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Filter customers berdasarkan pencarian
  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.email && customer.email.toLowerCase().includes(searchLower))
    );
  });

  // Pagination
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Daftar Pelanggan</h2>
        
        <div className="d-flex gap-2">
          <Button
            variant={useMockData ? "warning" : "outline-warning"}
            size="sm"
            onClick={() => setUseMockData(prev => !prev)}
            className="me-2"
          >
            {useMockData ? "Using Mock Data" : "Use Mock Data"}
          </Button>
          
          <Button
            variant="primary"
            as={Link}
            to="/customers/add"
            size="sm"
          >
            <FaPlus /> Tambah Pelanggan
          </Button>
          
          <Button
            variant="outline-primary"
            size="sm"
            onClick={fetchCustomers}
          >
            <FaSync /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white">
          <Form.Group>
            <InputGroup>
              <InputGroup.Text><FaSearch /></InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Cari berdasarkan nama, email, atau nomor telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
        </Card.Header>
      </Card>

      <Card className="shadow-sm">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Memuat data pelanggan...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-5">
              <p>Tidak ada data pelanggan yang ditemukan.</p>
              <Button
                variant="primary"
                as={Link}
                to="/customers/add"
                size="sm"
              >
                <FaPlus /> Tambah Pelanggan Baru
              </Button>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-light">
                    <tr>
                      <th>Nama</th>
                      <th>Telepon</th>
                      <th>Email</th>
                      <th>Alamat</th>
                      <th>Total Order</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCustomers.map((customer, index) => (
                      <tr key={customer.id || index}>
                        <td>{customer.name || '-'}</td>
                        <td>{customer.phone || '-'}</td>
                        <td>{customer.email || '-'}</td>
                        <td>{customer.address ? (customer.address.length > 30 ? customer.address.substring(0, 30) + '...' : customer.address) : '-'}</td>
                        <td>{customer.total_orders || 0}</td>
                        <td>
                          <Badge bg={customer.status === 'active' ? 'success' : 'secondary'}>
                            {customer.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </td>
                        <td className="text-nowrap">
                          <div className="btn-group">
                            <Link 
                              to={`/customers/view/${customer.id}`} 
                              className="btn btn-sm btn-outline-primary"
                              title="Lihat detail"
                            >
                              <i className="bi bi-eye"></i> Detail
                            </Link>
                            <Link 
                              to={`/customers/edit/${customer.id}`} 
                              className="btn btn-sm btn-outline-secondary"
                              title="Edit data"
                            >
                              <i className="bi bi-pencil"></i> Edit
                            </Link>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(customer.id, customer.name)}
                              title="Hapus pelanggan"
                              disabled={loading}
                            >
                              <i className="bi bi-trash"></i> Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Pagination */}
              <div className="d-flex justify-content-center mt-4">
                <Pagination>
                  <Pagination.First onClick={() => paginate(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => paginate(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
                  
                  {Array.from({ length: Math.min(5, Math.ceil(filteredCustomers.length / customersPerPage)) }).map((_, i) => {
                    // Calculate page numbers to show (centered around current page)
                    const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
                    let startPage = Math.max(1, currentPage - 2);
                    let endPage = Math.min(totalPages, startPage + 4);
                    
                    if (endPage - startPage < 4) {
                      startPage = Math.max(1, endPage - 4);
                    }
                    
                    const pageNumber = startPage + i;
                    if (pageNumber <= endPage) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    }
                    return null;
                  })}
                  
                  <Pagination.Next 
                    onClick={() => paginate(Math.min(Math.ceil(filteredCustomers.length / customersPerPage), currentPage + 1))} 
                    disabled={currentPage === Math.ceil(filteredCustomers.length / customersPerPage)} 
                  />
                  <Pagination.Last 
                    onClick={() => paginate(Math.ceil(filteredCustomers.length / customersPerPage))} 
                    disabled={currentPage === Math.ceil(filteredCustomers.length / customersPerPage)} 
                  />
                </Pagination>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default CustomerList;