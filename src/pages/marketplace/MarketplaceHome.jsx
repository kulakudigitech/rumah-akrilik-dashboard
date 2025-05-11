import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSearch, FaShoppingCart, FaStar, FaFilter } from 'react-icons/fa';

const MarketplaceHome = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  
  // Mock categories
  const categories = [
    { id: 'all', name: 'Semua Kategori' },
    { id: 'plakat', name: 'Plakat Akrilik' },
    { id: 'kotak-hantaran', name: 'Kotak Hantaran' },
    { id: 'kotak-mahar', name: 'Kotak Mahar' },
    { id: 'gantungan-kunci', name: 'Gantungan Kunci' },
    { id: 'lainnya', name: 'Produk Lainnya' },
  ];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // In a real app, replace this with an API call
        // const response = await axios.get('/products');
        // setProducts(response.data);
        
        // For demo purposes, we'll use mock data
        setTimeout(() => {
          const mockProducts = [
            {
              id: 1,
              name: 'Plakat Akrilik Premium',
              price: 150000,
              image: 'https://via.placeholder.com/300',
              category: 'plakat',
              rating: 4.8,
              reviews: 125,
              inStock: true,
              isNew: true,
              discount: 0,
              description: 'Plakat akrilik premium dengan desain eksklusif dan bahan berkualitas tinggi.'
            },
            {
              id: 2,
              name: 'Kotak Hantaran Pernikahan',
              price: 350000,
              image: 'https://via.placeholder.com/300',
              category: 'kotak-hantaran',
              rating: 4.9,
              reviews: 87,
              inStock: true,
              isNew: false,
              discount: 10,
              description: 'Kotak hantaran pernikahan dengan desain elegan dan dapat disesuaikan.'
            },
            {
              id: 3,
              name: 'Kotak Mahar Nikah Custom',
              price: 450000,
              image: 'https://via.placeholder.com/300',
              category: 'kotak-mahar',
              rating: 5.0,
              reviews: 64,
              inStock: true,
              isNew: false,
              discount: 5,
              description: 'Kotak mahar nikah custom dengan desain sesuai permintaan pelanggan.'
            },
            {
              id: 4,
              name: 'Gantungan Kunci Akrilik',
              price: 25000,
              image: 'https://via.placeholder.com/300',
              category: 'gantungan-kunci',
              rating: 4.6,
              reviews: 210,
              inStock: true,
              isNew: false,
              discount: 0,
              description: 'Gantungan kunci akrilik personalisasi dengan foto atau desain pilihan Anda.'
            },
            {
              id: 5,
              name: 'Plakat Akrilik Standar',
              price: 100000,
              image: 'https://via.placeholder.com/300',
              category: 'plakat',
              rating: 4.5,
              reviews: 98,
              inStock: true,
              isNew: false,
              discount: 0,
              description: 'Plakat akrilik standar untuk berbagai acara dan penghargaan.'
            },
            {
              id: 6,
              name: 'Kotak Hias Akrilik',
              price: 275000,
              image: 'https://via.placeholder.com/300',
              category: 'lainnya',
              rating: 4.7,
              reviews: 45,
              inStock: false,
              isNew: true,
              discount: 0,
              description: 'Kotak hias akrilik untuk menyimpan perhiasan atau barang berharga lainnya.'
            },
          ];
          
          setProducts(mockProducts);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("Gagal memuat produk. Silakan coba lagi.");
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  const handleAddToCart = (product) => {
    // Get existing cart from localStorage
    const cartJson = localStorage.getItem('rumahAkrilikCart');
    let cart = cartJson ? JSON.parse(cartJson) : [];
    
    // Check if product already exists
    const existingProductIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingProductIndex >= 0) {
      // Product exists, increment quantity
      cart[existingProductIndex].quantity += 1;
    } else {
      // Add new product to cart
      cart.push({
        id: product.id,
        name: product.name,
        price: product.discount > 0 
          ? product.price * (1 - (product.discount / 100))
          : product.price,
        image: product.image,
        quantity: 1
      });
    }
    
    // Save cart to localStorage
    localStorage.setItem('rumahAkrilikCart', JSON.stringify(cart));
    
    toast.success(`${product.name} ditambahkan ke keranjang!`);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredProducts = products.filter(product => {
    // Filter by search term
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    // Filter by price range
    const matchesMinPrice = !priceRange.min || product.price >= parseInt(priceRange.min);
    const matchesMaxPrice = !priceRange.max || product.price <= parseInt(priceRange.max);
    
    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  return (
    <Container fluid className="py-4">
      {/* Hero Section */}
      <div className="bg-primary text-white p-4 rounded mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <h1>Rumah Akrilik Marketplace</h1>
            <p className="lead">
              Temukan berbagai produk akrilik berkualitas tinggi dengan desain yang dapat disesuaikan.
            </p>
            <Button variant="light" className="mt-2">Lihat Koleksi Kami</Button>
          </Col>
          <Col md={4} className="text-center d-none d-md-block">
            <img 
              src="https://via.placeholder.com/300" 
              alt="Rumah Akrilik" 
              className="img-fluid rounded" 
              style={{ maxHeight: '200px' }}
            />
          </Col>
        </Row>
      </div>
      
      {/* Search and Filter */}
      <Row className="mb-4">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <Form.Control
              placeholder="Cari produk..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <Button variant="outline-secondary">
              Cari
            </Button>
          </InputGroup>
        </Col>
        <Col md={4} className="mt-3 mt-md-0">
          <Button 
            variant="outline-secondary" 
            className="w-100 d-flex align-items-center justify-content-center"
            onClick={() => document.getElementById('filter-collapse').classList.toggle('d-none')}
          >
            <FaFilter className="me-2" />
            Filter Produk
          </Button>
        </Col>
      </Row>
      
      {/* Filter Collapse */}
      <div id="filter-collapse" className="mb-4 d-none">
        <Card>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Harga Minimum</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Rp" 
                    name="min"
                    value={priceRange.min}
                    onChange={handlePriceChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Harga Maksimum</Form.Label>
                  <Form.Control 
                    type="number" 
                    placeholder="Rp" 
                    name="max"
                    value={priceRange.max}
                    onChange={handlePriceChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setPriceRange({ min: '', max: '' });
                }}
              >
                Reset
              </Button>
              <Button 
                variant="primary"
                onClick={() => document.getElementById('filter-collapse').classList.add('d-none')}
              >
                Terapkan Filter
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
      
      {/* Products */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Memuat produk...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5">
          <p>Tidak ditemukan produk yang sesuai dengan filter Anda.</p>
          <Button 
            variant="primary"
            onClick={() => {
              setSearchTerm('');
              setCategoryFilter('all');
              setPriceRange({ min: '', max: '' });
            }}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <>
          <h2 className="mb-4">Katalog Produk</h2>
          <Row>
            {filteredProducts.map(product => (
              <Col key={product.id} sm={6} md={4} lg={3} className="mb-4">
                <Card className="h-100 product-card">
                  <div className="position-relative">
                    <Card.Img 
                      variant="top" 
                      src={product.image} 
                      alt={product.name} 
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                    {product.isNew && (
                      <Badge 
                        bg="success" 
                        className="position-absolute"
                        style={{ top: '10px', left: '10px' }}
                      >
                        New
                      </Badge>
                    )}
                    {product.discount > 0 && (
                      <Badge 
                        bg="danger" 
                        className="position-absolute"
                        style={{ top: '10px', right: '10px' }}
                      >
                        -{product.discount}%
                      </Badge>
                    )}
                    {!product.inStock && (
                      <div 
                        className="position-absolute d-flex align-items-center justify-content-center"
                        style={{ 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0, 
                          backgroundColor: 'rgba(0,0,0,0.5)' 
                        }}
                      >
                        <Badge bg="danger" className="p-2">Stok Habis</Badge>
                      </div>
                    )}
                  </div>
                  <Card.Body className="d-flex flex-column">
                    <Card.Title>{product.name}</Card.Title>
                    <div className="mb-2">
                      <small className="text-muted">
                        {categories.find(cat => cat.id === product.category)?.name || product.category}
                      </small>
                    </div>
                    <div className="mb-2 d-flex align-items-center">
                      <FaStar className="text-warning me-1" />
                      <span>{product.rating}</span>
                      <small className="text-muted ms-1">({product.reviews} reviews)</small>
                    </div>
                    <Card.Text className="small text-muted mb-3">
                      {product.description}
                    </Card.Text>
                    <div className="mt-auto">
                      <div className="d-flex align-items-center mb-3">
                        {product.discount > 0 ? (
                          <>
                            <span className="text-muted text-decoration-line-through me-2">
                              {formatCurrency(product.price)}
                            </span>
                            <h5 className="mb-0 text-danger">
                              {formatCurrency(product.price * (1 - (product.discount / 100)))}
                            </h5>
                          </>
                        ) : (
                          <h5 className="mb-0">{formatCurrency(product.price)}</h5>
                        )}
                      </div>
                      <div className="d-grid gap-2">
                        <Button 
                          variant="primary" 
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.inStock}
                        >
                          <FaShoppingCart className="me-2" />
                          {product.inStock ? 'Tambah ke Keranjang' : 'Stok Habis'}
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          onClick={() => navigate(`/marketplace/product/${product.id}`)}
                        >
                          Detail Produk
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
      
      {/* Featured Categories */}
      <h2 className="mt-5 mb-4">Kategori Populer</h2>
      <Row>
        {categories.filter(category => category.id !== 'all').map((category, index) => (
          <Col key={index} md={4} className="mb-4">
            <Card className="h-100 category-card">
              <Card.Body className="d-flex align-items-center justify-content-center flex-column text-center p-4">
                <div 
                  className="category-icon mb-3 p-3 rounded-circle" 
                  style={{ backgroundColor: '#f8f9fa' }}
                >
                  <img 
                    src={`https://via.placeholder.com/100?text=${encodeURIComponent(category.name)}`}
                    alt={category.name}
                    style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                  />
                </div>
                <h4>{category.name}</h4>
                <p className="text-muted">
                  {category.id === 'plakat' && 'Berbagai pilihan plakat akrilik untuk penghargaan dan kenang-kenangan.'}
                  {category.id === 'kotak-hantaran' && 'Kotak hantaran pernikahan dengan desain kustom dan elegan.'}
                  {category.id === 'kotak-mahar' && 'Kotak mahar pernikahan dengan desain eksklusif.'}
                  {category.id === 'gantungan-kunci' && 'Gantungan kunci akrilik personalisasi dengan nama atau foto.'}
                  {category.id === 'lainnya' && 'Berbagai produk akrilik lainnya untuk kebutuhan Anda.'}
                </p>
                <Button 
                  variant="outline-primary" 
                  className="mt-auto"
                  onClick={() => {
                    setCategoryFilter(category.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Lihat Produk
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Why Choose Us */}
      <h2 className="mt-5 mb-4">Mengapa Memilih Kami</h2>
      <Row>
        <Col md={3} className="mb-4">
          <Card className="h-100 text-center p-3">
            <Card.Body>
              <div className="mb-3 text-primary fs-1">???</div>
              <h5>Kustomisasi Produk</h5>
              <p className="text-muted">Desain produk sesuai keinginan Anda dengan opsi kustomisasi yang lengkap.</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="h-100 text-center p-3">
            <Card.Body>
              <div className="mb-3 text-primary fs-1">?</div>
              <h5>Kualitas Premium</h5>
              <p className="text-muted">Produk dari bahan berkualitas tinggi dengan pengerjaan yang rapi dan teliti.</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="h-100 text-center p-3">
            <Card.Body>
              <div className="mb-3 text-primary fs-1">??</div>
              <h5>Pengiriman Cepat</h5>
              <p className="text-muted">Produk dikirim dengan cepat dan aman ke seluruh Indonesia.</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3} className="mb-4">
          <Card className="h-100 text-center p-3">
            <Card.Body>
              <div className="mb-3 text-primary fs-1">??</div>
              <h5>Layanan Pelanggan</h5>
              <p className="text-muted">Tim customer service siap membantu Anda 7 hari seminggu.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Testimonials */}
      <h2 className="mt-5 mb-4">Testimoni Pelanggan</h2>
      <Row>
        {[1, 2, 3].map((i) => (
          <Col md={4} key={i} className="mb-4">
            <Card className="h-100">
              <Card.Body>
                <div className="d-flex mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar key={star} className="text-warning" />
                  ))}
                </div>
                <Card.Text>
                  "Sangat puas dengan produk dari Rumah Akrilik. Kualitasnya bagus, desainnya sesuai permintaan, dan pengirimannya cepat. Terima kasih Rumah Akrilik!"
                </Card.Text>
                <div className="d-flex align-items-center mt-3">
                  <img
                    src={`https://via.placeholder.com/50`}
                    alt="Customer"
                    className="rounded-circle me-3"
                    style={{ width: '50px', height: '50px' }}
                  />
                  <div>
                    <h6 className="mb-0">Customer {i}</h6>
                    <small className="text-muted">Jakarta</small>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      
      {/* Call to Action */}
      <div className="bg-light p-5 text-center rounded mt-5">
        <h2>Buat Desain Kustom Anda Sekarang</h2>
        <p className="lead">
          Konsultasikan kebutuhan produk akrilik Anda dengan tim desain profesional kami.
        </p>
        <Button variant="primary" size="lg" className="mt-3">
          Hubungi Kami
        </Button>
      </div>
    </Container>
  );
};

export default MarketplaceHome;