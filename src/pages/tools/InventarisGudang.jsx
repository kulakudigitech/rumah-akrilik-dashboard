import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, InputGroup, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import { FaSearch, FaPlus, FaEdit, FaTrash, FaBoxOpen, FaExclamationTriangle } from 'react-icons/fa';

// Buat instance axios dengan konfigurasi
const api = axios.create({
  baseURL: 'https://rumahakrilik.id/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor untuk token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const InventarisGudang = () => {
  const [barangList, setBarangList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBarang, setFilteredBarang] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentBarang, setCurrentBarang] = useState({
    id: null,
    kode: '',
    nama: '',
    kategori: '',
    stok: 0,
    satuan: '',
    min_stok: 0,
    lokasi: '',
    keterangan: ''
  });
  const [formMode, setFormMode] = useState('add'); // 'add' atau 'edit'

  // Format number with thousand separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('id-ID').format(num);
  };

  useEffect(() => {
    const fetchBarang = async () => {
      try {
        setLoading(true);
        
        // Simulasi data inventaris (ganti dengan API call sebenarnya)
        const dummyData = [
          {
            id: 1,
            kode: 'BRG-001',
            nama: 'Akrilik Bening 3mm',
            kategori: 'Bahan Baku',
            stok: 50,
            satuan: 'Lembar',
            min_stok: 10,
            lokasi: 'Rak A-1',
            keterangan: 'Ukuran 122x244cm'
          },
          {
            id: 2,
            kode: 'BRG-002',
            nama: 'Akrilik Susu 2mm',
            kategori: 'Bahan Baku',
            stok: 35,
            satuan: 'Lembar',
            min_stok: 15,
            lokasi: 'Rak A-2',
            keterangan: 'Ukuran 122x244cm'
          },
          {
            id: 3,
            kode: 'BRG-003',
            nama: 'Mesin CNC',
            kategori: 'Peralatan',
            stok: 2,
            satuan: 'Unit',
            min_stok: 1,
            lokasi: 'Area Produksi',
            keterangan: 'Kondisi baik'
          },
          {
            id: 4,
            kode: 'BRG-004',
            nama: 'Lem Akrilik',
            kategori: 'Bahan Pendukung',
            stok: 25,
            satuan: 'Botol',
            min_stok: 5,
            lokasi: 'Rak B-3',
            keterangan: '50ml per botol'
          },
          {
            id: 5,
            kode: 'BRG-005',
            nama: 'Amplas Halus',
            kategori: 'Bahan Pendukung',
            stok: 100,
            satuan: 'Lembar',
            min_stok: 20,
            lokasi: 'Rak B-4',
            keterangan: 'Grit 1000'
          }
        ];
        
        setBarangList(dummyData);
        setFilteredBarang(dummyData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching barang:', error);
        setLoading(false);
      }
    };
    
    fetchBarang();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredBarang(barangList);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = barangList.filter(item => 
        item.kode.toLowerCase().includes(term) || 
        item.nama.toLowerCase().includes(term) ||
        item.kategori.toLowerCase().includes(term) ||
        item.lokasi.toLowerCase().includes(term)
      );
      setFilteredBarang(filtered);
    }
  }, [searchTerm, barangList]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBarang(prev => ({
      ...prev,
      [name]: name === 'stok' || name === 'min_stok' ? parseInt(value) : value
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formMode === 'add') {
      // Simulasi penambahan barang baru
      const newId = Math.max(...barangList.map(item => item.id), 0) + 1;
      const newBarang = {
        ...currentBarang,
        id: newId
      };
      
      setBarangList(prevList => [...prevList, newBarang]);
    } else {
      // Simulasi update barang
      setBarangList(prevList => 
        prevList.map(item => 
          item.id === currentBarang.id ? currentBarang : item
        )
      );
    }
    
    // Reset form dan tutup modal
    setShowModal(false);
    setCurrentBarang({
      id: null,
      kode: '',
      nama: '',
      kategori: '',
      stok: 0,
      satuan: '',
      min_stok: 0,
      lokasi: '',
      keterangan: ''
    });
  };

  const handleAddNew = () => {
    setFormMode('add');
    setCurrentBarang({
      id: null,
      kode: `BRG-${String(barangList.length + 1).padStart(3, '0')}`,
      nama: '',
      kategori: '',
      stok: 0,
      satuan: '',
      min_stok: 0,
      lokasi: '',
      keterangan: ''
    });
    setShowModal(true);
  };

  const handleEdit = (barang) => {
    setFormMode('edit');
    setCurrentBarang({ ...barang });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    // Konfirmasi hapus
    if (window.confirm('Apakah Anda yakin ingin menghapus barang ini?')) {
      setBarangList(prevList => prevList.filter(item => item.id !== id));
    }
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading inventaris data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Inventaris Gudang</h2>
      
      {/* Search & Add Button */}
      <Card className="mb-4">
        <Card.Header className="bg-white">
          <Row className="align-items-center">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Cari barang..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-end">
              <Button variant="primary" onClick={handleAddNew}>
                <FaPlus className="me-1" /> Tambah Barang
              </Button>
            </Col>
          </Row>
        </Card.Header>
      </Card>
      
      {/* Inventory Summary */}
      <Row className="mb-4">
        <Col md={3} className="mb-4">
          <Card className="border-left-primary h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Barang
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {barangList.length} Jenis
                  </div>
                </Col>
                <Col xs="auto">
                  <FaBoxOpen size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="border-left-warning h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Stok Hampir Habis
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {barangList.filter(item => item.stok <= item.min_stok).length} Jenis
                  </div>
                </Col>
                <Col xs="auto">
                  <FaExclamationTriangle size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="border-left-success h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Bahan Baku
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {barangList.filter(item => item.kategori === 'Bahan Baku').length} Jenis
                  </div>
                </Col>
                <Col xs="auto">
                  <FaBoxOpen size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-4">
          <Card className="border-left-info h-100">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Peralatan
                  </div>
                  <div className="h5 mb-0 font-weight-bold">
                    {barangList.filter(item => item.kategori === 'Peralatan').length} Jenis
                  </div>
                </Col>
                <Col xs="auto">
                  <FaBoxOpen size={32} className="text-gray-300" />
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Inventory Table */}
      <Card>
        <Card.Header>
          <h6 className="m-0 font-weight-bold">Daftar Inventaris</h6>
        </Card.Header>
        <Card.Body>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>Stok</th>
                  <th>Satuan</th>
                  <th>Min. Stok</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredBarang.length > 0 ? (
                  filteredBarang.map((barang) => (
                    <tr key={barang.id}>
                      <td>{barang.kode}</td>
                      <td>{barang.nama}</td>
                      <td>{barang.kategori}</td>
                      <td>{formatNumber(barang.stok)}</td>
                      <td>{barang.satuan}</td>
                      <td>{formatNumber(barang.min_stok)}</td>
                      <td>{barang.lokasi}</td>
                      <td>
                        {barang.stok <= barang.min_stok ? (
                          <Badge bg="danger">Stok Rendah</Badge>
                        ) : (
                          <Badge bg="success">Stok Cukup</Badge>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEdit(barang)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(barang.id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center">
                      Tidak ada data barang yang sesuai dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
      
      {/* Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {formMode === 'add' ? 'Tambah Barang Baru' : 'Edit Barang'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kode Barang</Form.Label>
                  <Form.Control
                    type="text"
                    name="kode"
                    value={currentBarang.kode}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Barang</Form.Label>
                  <Form.Control
                    type="text"
                    name="nama"
                    value={currentBarang.nama}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select 
                    name="kategori" 
                    value={currentBarang.kategori} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Bahan Pendukung">Bahan Pendukung</option>
                    <option value="Peralatan">Peralatan</option>
                    <option value="Lainnya">Lainnya</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Lokasi</Form.Label>
                  <Form.Control
                    type="text"
                    name="lokasi"
                    value={currentBarang.lokasi}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stok</Form.Label>
                  <Form.Control
                    type="number"
                    name="stok"
                    value={currentBarang.stok}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Satuan</Form.Label>
                  <Form.Control
                    type="text"
                    name="satuan"
                    value={currentBarang.satuan}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Minimum Stok</Form.Label>
                  <Form.Control
                    type="number"
                    name="min_stok"
                    value={currentBarang.min_stok}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Keterangan</Form.Label>
              <Form.Control
                as="textarea"
                name="keterangan"
                value={currentBarang.keterangan}
                onChange={handleInputChange}
                rows={3}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              {formMode === 'add' ? 'Simpan' : 'Update'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default InventarisGudang;

