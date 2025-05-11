import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const KeranjangCheckout = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // 'cart', 'shipping', 'payment', 'confirmation'
  
  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    alamatJalan: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    provinsi: '',
    kodePos: '',
    nomorHp: '',
    email: '',
    notes: ''
  });
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('transfer');

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate totals
  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };
  
  const calculateShipping = () => {
    // Implement shipping calculation logic here
    // For now, return flat fee
    return cartItems.length > 0 ? 20000 : 0;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };
  
  useEffect(() => {
    // Fetch cart items from localStorage or API
    const fetchCartItems = async () => {
      setLoading(true);
      try {
        // For demo purposes, we'll use localStorage
        const savedCart = localStorage.getItem('rumahAkrilikCart');
        if (savedCart) {
          setCartItems(JSON.parse(savedCart));
        } else {
          // If implementing an API, use this instead:
          // const response = await axios.get('/cart/items');
          // setCartItems(response.data);
          setCartItems([]);
        }
      } catch (err) {
        console.error("Failed to load cart:", err);
        setError("Gagal memuat keranjang belanja. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCartItems();
  }, []);
  
  const handleRemoveItem = (index) => {
    const newCartItems = [...cartItems];
    newCartItems.splice(index, 1);
    setCartItems(newCartItems);
    
    // Update localStorage
    localStorage.setItem('rumahAkrilikCart', JSON.stringify(newCartItems));
    
    toast.success("Item dihapus dari keranjang");
  };
  
  const handleQuantityChange = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const newCartItems = [...cartItems];
    newCartItems[index].quantity = newQuantity;
    setCartItems(newCartItems);
    
    // Update localStorage
    localStorage.setItem('rumahAkrilikCart', JSON.stringify(newCartItems));
  };
  
  const handleShippingInfoChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCheckout = async () => {
    try {
      // Here you would send the order to your backend
      // const response = await axios.post('/order/checkout', {
      //   items: cartItems,
      //   shipping: shippingInfo,
      //   payment: paymentMethod,
      //   total: calculateTotal()
      // });
      
      // Clear cart after successful checkout
      localStorage.removeItem('rumahAkrilikCart');
      
      // Show success message
      toast.success("Pesanan berhasil dibuat! Silakan lakukan pembayaran.");
      
      // Redirect to order confirmation page
      // navigate(`/order-confirmation/${response.data.orderId}`);
      navigate('/');
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error("Checkout gagal. Silakan coba lagi.");
    }
  };
  
  const renderCartStep = () => (
    <>
      <h2 className="mb-4">Keranjang Belanja</h2>
      
      {cartItems.length === 0 ? (
        <Alert variant="info">
          Keranjang belanja Anda kosong.{' '}
          <Button variant="link" className="p-0" onClick={() => navigate('/marketplace')}>
            Lanjutkan belanja
          </Button>
        </Alert>
      ) : (
        <>
          <Table responsive>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Harga</th>
                <th>Jumlah</th>
                <th>Total</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="d-flex align-items-center">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          style={{ width: '50px', height: '50px', marginRight: '10px', objectFit: 'cover' }} 
                        />
                      )}
                      <div>
                        <h6 className="mb-0">{item.name}</h6>
                        <small className="text-muted">{item.variant || ''}</small>
                      </div>
                    </div>
                  </td>
                  <td>{formatCurrency(item.price)}</td>
                  <td>
                    <div className="input-group input-group-sm" style={{ width: '120px' }}>
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => handleQuantityChange(index, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Form.Control 
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 1)}
                        className="text-center"
                      />
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => handleQuantityChange(index, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </td>
                  <td>{formatCurrency(item.price * item.quantity)}</td>
                  <td>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleRemoveItem(index)}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <Row className="mt-4">
            <Col md={6}>
              <Card>
                <Card.Header>Ringkasan Pesanan</Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateSubtotal())}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Ongkos Kirim:</span>
                    <span>{formatCurrency(calculateShipping())}</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between fw-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mt-3 mt-md-0 d-flex justify-content-end align-items-end">
              <div>
                <Button 
                  variant="outline-primary" 
                  className="me-2" 
                  onClick={() => navigate('/marketplace')}
                >
                  Lanjutkan Belanja
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setCheckoutStep('shipping')}
                >
                  Lanjut ke Pengiriman
                </Button>
              </div>
            </Col>
          </Row>
        </>
      )}
    </>
  );
  
  const renderShippingStep = () => (
    <>
      <h2 className="mb-4">Informasi Pengiriman</h2>
      
      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nama Lengkap</Form.Label>
              <Form.Control 
                type="text" 
                name="fullName" 
                value={shippingInfo.fullName} 
                onChange={handleShippingInfoChange} 
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nomor HP</Form.Label>
              <Form.Control 
                type="tel" 
                name="nomorHp" 
                value={shippingInfo.nomorHp} 
                onChange={handleShippingInfoChange} 
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email" 
                value={shippingInfo.email} 
                onChange={handleShippingInfoChange} 
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Alamat Jalan</Form.Label>
              <Form.Control 
                type="text" 
                name="alamatJalan" 
                value={shippingInfo.alamatJalan} 
                onChange={handleShippingInfoChange} 
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Kelurahan</Form.Label>
              <Form.Control 
                type="text" 
                name="kelurahan" 
                value={shippingInfo.kelurahan} 
                onChange={handleShippingInfoChange} 
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Kecamatan</Form.Label>
              <Form.Control 
                type="text" 
                name="kecamatan" 
                value={shippingInfo.kecamatan} 
                onChange={handleShippingInfoChange} 
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Kota</Form.Label>
              <Form.Control 
                type="text" 
                name="kota" 
                value={shippingInfo.kota} 
                onChange={handleShippingInfoChange} 
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Provinsi</Form.Label>
              <Form.Control 
                type="text" 
                name="provinsi" 
                value={shippingInfo.provinsi} 
                onChange={handleShippingInfoChange} 
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Kode Pos</Form.Label>
              <Form.Control 
                type="text" 
                name="kodePos" 
                value={shippingInfo.kodePos} 
                onChange={handleShippingInfoChange} 
                required
              />
            </Form.Group>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Catatan (opsional)</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                name="notes" 
                value={shippingInfo.notes} 
                onChange={handleShippingInfoChange} 
              />
            </Form.Group>
          </Col>
        </Row>
        
        <div className="d-flex justify-content-between mt-4">
          <Button 
            variant="outline-secondary" 
            onClick={() => setCheckoutStep('cart')}
          >
            Kembali ke Keranjang
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setCheckoutStep('payment')}
          >
            Lanjut ke Pembayaran
          </Button>
        </div>
      </Form>
    </>
  );
  
  const renderPaymentStep = () => (
    <>
      <h2 className="mb-4">Metode Pembayaran</h2>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>Pilih Metode Pembayaran</Card.Header>
            <Card.Body>
              <Form>
                <Form.Check
                  type="radio"
                  id="transfer"
                  label="Transfer Bank"
                  name="paymentMethod"
                  value="transfer"
                  checked={paymentMethod === 'transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-3"
                />
                
                {paymentMethod === 'transfer' && (
                  <div className="ms-4 mb-4">
                    <p className="mb-2">Silakan transfer ke rekening berikut:</p>
                    <div className="border p-3 rounded">
                      <p className="mb-1"><strong>Bank BCA</strong></p>
                      <p className="mb-1">No. Rekening: 1234567890</p>
                      <p className="mb-1">Atas Nama: PT Rumah Akrilik Indonesia</p>
                    </div>
                  </div>
                )}
                
                <Form.Check
                  type="radio"
                  id="cod"
                  label="Cash on Delivery (COD)"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mb-3"
                />
                
                {paymentMethod === 'cod' && (
                  <div className="ms-4 mb-4">
                    <p className="text-muted">
                      Pembayaran dilakukan saat barang diterima. Tambahan biaya COD mungkin berlaku.
                    </p>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Ringkasan Pesanan</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Ongkos Kirim:</span>
                <span>{formatCurrency(calculateShipping())}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <div className="d-flex justify-content-between mt-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => setCheckoutStep('shipping')}
        >
          Kembali ke Pengiriman
        </Button>
        <Button 
          variant="primary" 
          onClick={() => setCheckoutStep('confirmation')}
        >
          Lanjut ke Konfirmasi
        </Button>
      </div>
    </>
  );
  
  const renderConfirmationStep = () => (
    <>
      <h2 className="mb-4">Konfirmasi Pesanan</h2>
      
      <Row>
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>Detail Pesanan</Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Jumlah</th>
                    <th>Harga</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="d-flex align-items-center">
                          {item.image && (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              style={{ width: '40px', height: '40px', marginRight: '10px', objectFit: 'cover' }} 
                            />
                          )}
                          <div>
                            <h6 className="mb-0">{item.name}</h6>
                            <small className="text-muted">{item.variant || ''}</small>
                          </div>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td>{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
          
          <Card className="mb-4">
            <Card.Header>Informasi Pengiriman</Card.Header>
            <Card.Body>
              <p><strong>Nama:</strong> {shippingInfo.fullName}</p>
              <p><strong>Nomor HP:</strong> {shippingInfo.nomorHp}</p>
              <p><strong>Email:</strong> {shippingInfo.email}</p>
              <p><strong>Alamat:</strong> {shippingInfo.alamatJalan}</p>
              <p><strong>Kelurahan:</strong> {shippingInfo.kelurahan}</p>
              <p><strong>Kecamatan:</strong> {shippingInfo.kecamatan}</p>
              <p><strong>Kota:</strong> {shippingInfo.kota}</p>
              <p><strong>Provinsi:</strong> {shippingInfo.provinsi}</p>
              <p><strong>Kode Pos:</strong> {shippingInfo.kodePos}</p>
              {shippingInfo.notes && (
                <p><strong>Catatan:</strong> {shippingInfo.notes}</p>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>Metode Pembayaran</Card.Header>
            <Card.Body>
              <p>
                {paymentMethod === 'transfer' ? (
                  <>
                    <strong>Transfer Bank</strong>
                    <div className="mt-2">
                      <p className="mb-1">Bank BCA</p>
                      <p className="mb-1">No. Rekening: 1234567890</p>
                      <p className="mb-1">Atas Nama: PT Rumah Akrilik Indonesia</p>
                    </div>
                  </>
                ) : (
                  <strong>Cash on Delivery (COD)</strong>
                )}
              </p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card>
            <Card.Header>Ringkasan Pesanan</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Ongkos Kirim:</span>
                <span>{formatCurrency(calculateShipping())}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
              
              <Button 
                variant="success" 
                className="w-100 mt-4" 
                onClick={handleCheckout}
              >
                Konfirmasi & Buat Pesanan
              </Button>
              
              <Button 
                variant="outline-secondary" 
                className="w-100 mt-2" 
                onClick={() => setCheckoutStep('payment')}
              >
                Kembali ke Pembayaran
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
  
  let content;
  if (loading) {
    content = <div className="text-center py-5">Loading...</div>;
  } else if (error) {
    content = (
      <Alert variant="danger">
        {error}
      </Alert>
    );
  } else {
    switch (checkoutStep) {
      case 'shipping':
        content = renderShippingStep();
        break;
      case 'payment':
        content = renderPaymentStep();
        break;
      case 'confirmation':
        content = renderConfirmationStep();
        break;
      default:
        content = renderCartStep();
    }
  }
  
  return (
    <Container className="py-4">
      {content}
    </Container>
  );
};

export default KeranjangCheckout;