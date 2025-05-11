// /root/rumah-akrilik/rumah-akrilik-dashboard/src/pages/FormInputOrder.jsx

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from 'react-toastify';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Spinner, Alert, Button, Form, Row, Col, InputGroup, Container, Card } from 'react-bootstrap';

// --- Opsi Sumber Order (Tetap Sama) ---
const sumberOrderOptions = [
    { value: "", label: "-- Pilih Sumber Order --", disabled: true },
    { value: "Kunjungan Langsung", label: "Kunjungan Langsung" },
    { value: "Reseller", label: "Reseller" },
    { value: "WhatsApp", label: "WhatsApp" },
    { value: "Telepon", label: "Telepon" },
    { value: "Iklan FB", label: "Iklan FB" },
    { value: "Iklan IG", label: "Iklan IG" },
    { value: "Iklan Google", label: "Iklan Google" },
    { value: "Marketplace", label: "Marketplace" },
    { value: "Website", label: "Website" },
    { value: "Datang ke Toko", label: "Datang ke Toko" },
    { value: "Referensi", label: "Referensi" },
    { value: "Lainnya", label: "Lainnya" },
];

// --- Data Form Awal (Tetap Sama) ---
const getInitialFormData = () => ({
    customer: '', sales_person: 'NONE', order_date: new Date().toISOString().split('T')[0],
    alamat_jalan: '', kelurahan: '', kecamatan: '', kota: '', provinsi: '', kode_pos: '',
    nomor_hp: '', sumber_order: 'WhatsApp', product: '', nama_produk: '',
    keterangan_produk: '', spesifikasi_bahan: '', ukuran_produk: '', quantity: 1,
    harga_produk: 0, biaya_pasang: 0, biaya_survey: 0, payment_method: 'transfer',
    status: '', notes: '', terms: '',
});

// --- Konfigurasi Axios (Tetap Sama) ---
const api = axios.create({
  baseURL: 'https://rumahakrilik.id/api/',
  headers: { 'Content-Type': 'application/json', }
});
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwtToken');
    if (token) { config.headers['Authorization'] = `Bearer ${token}`; }
    return config;
  }, (error) => Promise.reject(error)
);

// --- Komponen Debug ---
const DebugSection = ({ isActive, formData, orderId }) => {
  if (!isActive) return null;
  
  return (
    <div style={{ 
      margin: '20px 0', 
      padding: '10px', 
      backgroundColor: '#f8f9fa', 
      border: '1px solid #ddd',
      borderRadius: '4px'
    }}>
      <h5>Debug Information (Order ID: {orderId})</h5>
      <div style={{ maxHeight: '200px', overflow: 'auto' }}>
        <pre>{JSON.stringify(formData, null, 2)}</pre>
      </div>
    </div>
  );
};

// --- Komponen Utama ---
const FormInputOrder = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(orderId);

  // --- State ---
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [marketingUsers, setMarketingUsers] = useState([{ value: "NONE", label: "-- TANPA MARKETING --" }]); // Initialize with default
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [loadingDropdown, setLoadingDropdown] = useState(true); // Loading khusus dropdown
  const [loadingOrder, setLoadingOrder] = useState(false);     // Loading khusus data order (edit)
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(getInitialFormData());
  const [defaultStatusId, setDefaultStatusId] = useState(null); // Awalnya null
  const [apiError, setApiError] = useState(null);

  // --- Debug Function ---
  const debugOrderData = (stage, data) => {
    console.log(`[DEBUG - ${stage}]`, JSON.stringify(data, null, 2));
  };

  // --- useEffect: Fetch Data Dropdown (Hanya Sekali) ---
  useEffect(() => {
    console.log("[Effect 1] Fetching initial dropdown data...");
    setLoadingDropdown(true);
    setApiError(null);

    // Setup API calls dengan error handling untuk masing-masing
    const fetchCustomers = api.get("customers/?page_size=1000&is_active=true")
      .catch(err => {
        console.error("Error fetching customers:", err);
        return { data: [] }; // Return empty array as fallback
      });
    
    const fetchProducts = api.get("products/?is_active=true&page_size=1000")
      .catch(err => {
        console.error("Error fetching products:", err);
        return { data: [] };
      });
    
    // Ganti user-profiles dengan endpoint users jika bermasalah
    const fetchUsers = api.get("users/?is_active=true&page_size=1000")
      .catch(err => {
        console.error("Error fetching users:", err);
        return { data: [] };
      });
    
    const fetchStatuses = api.get("order-status/?is_active=true")
      .catch(err => {
        console.error("Error fetching order statuses:", err);
        return { data: [] };
      });

    Promise.all([fetchCustomers, fetchProducts, fetchUsers, fetchStatuses])
      .then(([customerRes, productRes, userRes, statusRes]) => {
        console.log("[Effect 1] Dropdown data fetched.");
        // Proses data seperti sebelumnya...
        const customerData = customerRes.data?.results || (Array.isArray(customerRes.data) ? customerRes.data : []);
        setCustomers(customerData);
        const productData = productRes.data?.results || (Array.isArray(productRes.data) ? productRes.data : []);
        setProducts(productData);
        const statusData = statusRes.data?.results || (Array.isArray(statusRes.data) ? statusRes.data : []);
        setOrderStatuses(statusData);
        const userData = userRes.data?.results || (Array.isArray(userRes.data) ? userRes.data : []);
        // Set Marketing Users (sama seperti sebelumnya)
        if (Array.isArray(userData)) {
           const marketingOptions = userData
              .filter(profile => profile && profile.user)
              .map(profile => ({
                  value: profile.user.id.toString(),
                  label: `${profile.user.first_name || profile.user.username} (${profile.role?.name || 'N/A'})`
              }))
              .sort((a, b) => a.label.localeCompare(b.label));
          marketingOptions.unshift({ value: "NONE", label: "-- TANPA MARKETING --" });
          setMarketingUsers(marketingOptions);
        }
        // Cari default status
        const defaultStatus = statusData.find(s => s?.name?.toLowerCase() === 'baru' || s?.name?.toLowerCase() === 'draft');
        const foundDefaultStatusId = defaultStatus?.id?.toString() || statusData[0]?.id?.toString() || '';
        setDefaultStatusId(foundDefaultStatusId); // <-- Set defaultStatusId di sini
        console.log("[Effect 1] Default status ID set:", foundDefaultStatusId);
      })
      .catch(err => {
        console.error("Error in Promise.all:", err);
        setApiError("Terjadi kesalahan saat memuat data. Silakan refresh halaman.");
      })
      .finally(() => {
        setLoadingDropdown(false);
        console.log("[Effect 1] Finished dropdown fetch.");
      });
  }, []); // <-- Tetap kosong, hanya jalan sekali

  // --- useEffect: Fetch Order Data ---
  useEffect(() => {
    if (loadingDropdown || defaultStatusId === null) {
      console.log("[Effect 2] Skipping: Dropdown loading or defaultStatusId not ready.");
      return;
    }

    if (isEditing && orderId) {
      console.log(`[Effect 2] Editing mode. Fetching order ID: ${orderId}`);
      setLoadingOrder(true);
      setApiError(null);

      // Log all possible API paths we might try
      console.log("[API Paths] Possible endpoints:", {
        path1: `https://rumahakrilik.id/api/order/${orderId}/`,
        path2: `https://rumahakrilik.id/api/orders/${orderId}/`,
        path3: `https://rumahakrilik.id/api/orders/detail/${orderId}/`
      });

      // Create a function to process the API response
      const processOrderData = (orderData, source) => {
        debugOrderData(`Received from ${source}`, orderData);

        // Check if we received valid data
        if (!orderData || typeof orderData !== 'object') {
          console.error(`[Effect 2] Invalid order data from ${source}:`, orderData);
          return null;
        }

        // Create form data object with detailed logging
        const updatedFormData = {
          customer: String(orderData.customer?.id || ''),
          sales_person: String(orderData.sales_person?.id || 'NONE'),
          order_date: orderData.order_date || getInitialFormData().order_date,
          // Address fields
          alamat_jalan: orderData.alamat_jalan || '',
          kelurahan: orderData.kelurahan || '',
          kecamatan: orderData.kecamatan || '',
          kota: orderData.kota || '',
          provinsi: orderData.provinsi || '',
          kode_pos: orderData.kode_pos || '',
          nomor_hp: orderData.nomor_hp || orderData.customer?.phone || '',
          // Order details
          sumber_order: orderData.sumber_order || 'WhatsApp',
          payment_method: orderData.payment_method || 'transfer',
          status: String(orderData.status?.id || defaultStatusId),
          notes: orderData.notes || '',
          terms: orderData.terms || '',
          biaya_pasang: String(orderData.biaya_pasang || 0),
          biaya_survey: String(orderData.biaya_survey || 0),

          // Item data - handle potential array structure
          product: String((orderData.items?.[0]?.product?.id || orderData.product?.id || '')),
          nama_produk: orderData.items?.[0]?.nama_produk || orderData.nama_produk || '',
          keterangan_produk: orderData.items?.[0]?.notes || orderData.keterangan_produk || '',
          spesifikasi_bahan: 
            orderData.items?.[0]?.specifications?.bahan || 
            orderData.specifications?.bahan || 
            orderData.spesifikasi_bahan || '',
          ukuran_produk: 
            orderData.items?.[0]?.specifications?.ukuran || 
            orderData.specifications?.ukuran || 
            orderData.ukuran_produk || '',
          quantity: String(orderData.items?.[0]?.quantity || orderData.quantity || 1),
          harga_produk: String(orderData.items?.[0]?.unit_price || orderData.harga_produk || 0)
        };

        debugOrderData(`Form data prepared from ${source}`, updatedFormData);
        return updatedFormData;
      };

      // Try all possible API endpoints in sequence
      axios.get(`https://rumahakrilik.id/api/order/${orderId}/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        const formData = processOrderData(response.data, 'api/order/');
        if (formData) {
          setFormData(formData);
          return null; // Success - don't try more endpoints
        }
        // If we didn't return, try the next endpoint
        return axios.get(`https://rumahakrilik.id/api/orders/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
      })
      .then(response => {
        if (!response) return null; // Previous endpoint succeeded

        const formData = processOrderData(response.data, 'api/orders/');
        if (formData) {
          setFormData(formData);
          return null;
        }
        // Try the last endpoint option
        return axios.get(`https://rumahakrilik.id/api/orders/detail/${orderId}/`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
            'Content-Type': 'application/json'
          }
        });
      })
      .then(response => {
        if (!response) return; // Previous endpoint succeeded

        const formData = processOrderData(response.data, 'api/orders/detail/');
        if (formData) {
          setFormData(formData);
        }
      })
      .catch(err => {
        console.error('[Effect 2] All endpoints failed:', err);
        console.error("Error details:", err.response?.data, "Status:", err.response?.status);
        const errorMsg = err.response?.data?.detail || `Gagal memuat data order ${orderId}.`;
        toast.error(errorMsg);
        setApiError(errorMsg + " Periksa console untuk detail.");
      })
      .finally(() => {
        setLoadingOrder(false);
        console.log("[Effect 2] Finished fetching order data.");
      });
    } else if (!isEditing) {
      console.log("[Effect 2] Create mode. Setting default form data.");
      setFormData(prev => ({
        ...getInitialFormData(),
        status: defaultStatusId,
        sales_person: 'NONE'
      }));
      setLoadingOrder(false);
    }
  }, [orderId, isEditing, loadingDropdown, defaultStatusId]);

  // Tambahkan log ini TEPAT SEBELUM return JSX untuk melihat state formData TERAKHIR sebelum render
  console.log("[Render] Current formData state:", formData);

  // --- Fungsi Reset Form (Tetap Sama) ---
  const resetForm = useCallback(() => {
        console.log("Resetting form...");
        setFormData({
            ...getInitialFormData(),
            sales_person: "NONE",
            status: defaultStatusId, // Gunakan default status ID
            sumber_order: "WhatsApp" // Pastikan reset ke default sumber
        });
        toast.info("Form direset.");
   }, [defaultStatusId]);

  // --- Fungsi Handle Perubahan Input (Tetap Sama) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    // console.log(`Input changed: ${name} = ${value}`); // Aktifkan jika perlu debug detail
    setFormData(prev => {
        const updatedFormData = { ...prev, [name]: value };
        // Logika auto-fill tetap sama...
        if (name === 'customer') {
            const selectedCustomer = customers.find(c => c?.id?.toString() === value);
            updatedFormData.alamat_jalan = selectedCustomer?.address || '';
            updatedFormData.kota = selectedCustomer?.city || '';
            updatedFormData.provinsi = selectedCustomer?.province || '';
            updatedFormData.kode_pos = selectedCustomer?.postal_code || '';
            updatedFormData.nomor_hp = selectedCustomer?.phone || '';
            // updatedFormData.kelurahan = selectedCustomer?.village || '';
            // updatedFormData.kecamatan = selectedCustomer?.district || '';
        } else if (name === 'product') {
            const selectedProduct = products.find(p => p?.id?.toString() === value);
            updatedFormData.nama_produk = selectedProduct?.name || '';
            updatedFormData.harga_produk = selectedProduct?.base_price || 0;
            updatedFormData.spesifikasi_bahan = selectedProduct?.specifications?.bahan || '';
            updatedFormData.ukuran_produk = selectedProduct?.specifications?.ukuran || '';
        }
        return updatedFormData;
    });
  };

  // --- Fungsi Handle Submit Form (Pastikan PUT sudah benar) ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const currentMode = isEditing ? 'Edit' : 'Create';
    console.log(`Submitting form. Mode: ${currentMode}`);
    setSubmitting(true);

    // --- Validasi (Tetap Sama) ---
    if (!formData.sumber_order) { toast.error("Sumber Order wajib dipilih."); setSubmitting(false); return; }
    if (!formData.customer) { toast.error("Customer wajib dipilih."); setSubmitting(false); return; }
    if (!formData.status) { toast.error("Status wajib dipilih."); setSubmitting(false); return; }
    // Validasi produk referensi hanya perlu saat create jika form item akan selalu ada
    // if (!formData.product && !isEditing) { toast.error("Produk Referensi wajib dipilih saat membuat order baru."); setSubmitting(false); return; }
    if (!formData.nama_produk) { toast.error("Nama Produk (di Order) wajib diisi."); setSubmitting(false); return; }
    const qty = parseInt(formData.quantity, 10);
    if (isNaN(qty) || qty < 1) { toast.error("Quantity produk minimal 1."); setSubmitting(false); return; }
    const harga = parseFloat(formData.harga_produk);
    if (isNaN(harga) || harga < 0) { toast.error("Harga satuan produk tidak valid."); setSubmitting(false); return; }


    // --- Persiapan Data untuk API ---
    const dataToSend = {
        order_date: formData.order_date,
        alamat_jalan: formData.alamat_jalan,
        kelurahan: formData.kelurahan,
        kecamatan: formData.kecamatan,
        kota: formData.kota,
        provinsi: formData.provinsi,
        kode_pos: formData.kode_pos,
        nomor_hp: formData.nomor_hp,
        sumber_order: formData.sumber_order,
        customer_id: parseInt(formData.customer, 10),
        status_id: parseInt(formData.status, 10),
        sales_person_id: formData.sales_person === "NONE" || !formData.sales_person ? null : parseInt(formData.sales_person, 10),
        biaya_pasang: parseFloat(formData.biaya_pasang) || 0,
        biaya_survey: parseFloat(formData.biaya_survey) || 0,
        payment_method: formData.payment_method,
        notes: formData.notes.trim() || null,
        terms: formData.terms.trim() || null,
        // --- Penanganan Items ---
        // Jika API update Anda bisa menerima struktur items, ini seharusnya OK
        // Jika tidak, Anda perlu menghapus `items` saat isEditing
        items: [
            {
                // (Opsional) Kirim ID item jika API PUT/PATCH memerlukannya
                // id: isEditing ? formData.itemId : undefined, // Anda perlu state untuk itemId
                product_id: formData.product ? parseInt(formData.product, 10) : null, // Pastikan product ada sebelum parseInt
                nama_produk: formData.nama_produk,
                notes: formData.keterangan_produk || null,
                specifications: {
                    bahan: formData.spesifikasi_bahan || "-",
                    ukuran: formData.ukuran_produk || "-",
                },
                quantity: qty,
                unit_price: harga,
                discount: 0 // Sesuaikan jika ada
            }
        ]
    };

     // Filter out null product_id if backend requires it
     if (dataToSend.items[0].product_id === null) {
         // Alternative 1: Send item without product_id (if allowed by backend)
         // delete dataToSend.items[0].product_id;

         // Alternative 2: Remove the whole item if product_id is mandatory
         // dataToSend.items = []; // Atau handle error di frontend

         // Alternative 3: Jika product_id WAJIB ada di item, tampilkan error
          toast.error("Produk Referensi untuk item tidak valid atau belum dipilih.");
          setSubmitting(false);
          return;
     }


    console.log(`[${currentMode}] Data to send to API:`, JSON.stringify(dataToSend, null, 2));

    // --- Tentukan Request API ---
    let requestPromise;
    if (isEditing) {
        console.log(`[${currentMode}] Sending PUT request to: order/${orderId}/`); // Change from 'orders/' to 'order/'
        requestPromise = api.put(`order/${orderId}/`, dataToSend); // Match the endpoint structure of your API
    } else {
        console.log(`[${currentMode}] Sending POST request to: order/`);
        requestPromise = api.post("order/", dataToSend);
    }

    // --- Kirim Request & Handle Response (Sama seperti sebelumnya) ---
    requestPromise
        .then((res) => {
            // ... (sukses handling) ...
            const action = isEditing ? 'diperbarui' : 'disimpan';
            const orderIdentifier = res.data?.order_number || orderId || 'Baru';
            console.log(`[${currentMode}] Success:`, res.data);
            toast.success(`Order ${orderIdentifier} berhasil ${action}!`);
            if (!isEditing) {
                resetForm();
            } else {
                navigate(`/order-detail/${orderId}`); // Redirect ke detail setelah update
            }
        })
        .catch((err) => {
           // ... (error handling detail seperti sebelumnya) ...
            const action = isEditing ? 'memperbarui' : 'menyimpan';
            console.error(`[${currentMode}] Gagal ${action} order:`, err.response || err.request || err.message);
            let errorMessage = `Gagal ${action} order. Periksa kembali data Anda.`;
            if (err.response) {
                console.error('[Error Response Data]', err.response.data);
                console.error('[Error Response Status]', err.response.status);
                 if (err.response.status === 405) {
                    errorMessage = `Gagal ${action}: Metode ${err.config?.method?.toUpperCase() || ''} tidak diizinkan oleh server (${err.response.status}). Cek URL API & konfigurasi backend.`;
                 } else if (err.response.status === 400) { // Bad Request (seringkali validasi)
                    try {
                        const errors = err.response.data;
                        // Coba format error umum DRF
                        const fieldErrors = Object.keys(errors)
                            .map(field => {
                                // Jika error adalah list (umumnya), join. Jika string, tampilkan langsung.
                                const errorDetail = Array.isArray(errors[field]) ? errors[field].join(', ') : errors[field];
                                // Jika field adalah 'items' dan errornya object (nested validation), coba detailkan
                                if (field === 'items' && typeof errors[field][0] === 'object') {
                                     const itemErrors = Object.keys(errors[field][0])
                                         .map(itemField => `${itemField}: ${errors[field][0][itemField].join(', ')}`)
                                         .join('; ');
                                     return `Item 1 -> ${itemErrors}`;
                                }
                                return `${field}: ${errorDetail}`;
                            })
                            .join('; ');
                        errorMessage = fieldErrors ? `Gagal ${action} (Error ${err.response.status}): ${fieldErrors}` : `Gagal ${action} (Error ${err.response.status}): ${JSON.stringify(errors)}`;
                    } catch {
                        errorMessage = `Gagal ${action}: ${err.response.data?.detail || JSON.stringify(err.response.data)} (Error ${err.response.status})`;
                    }
                 } else { // Error server lain
                     errorMessage = `Gagal ${action}: Error server (${err.response.status}). ${err.response.data?.detail || ''}`;
                 }
            } else if (err.request) {
                errorMessage = `Gagal ${action}: Tidak ada respons dari server. Cek koneksi.`;
            } else {
                errorMessage = `Gagal ${action}: ${err.message}`;
            }
            toast.error(errorMessage, { autoClose: 10000 }); // Tampilkan lebih lama
        })
        .finally(() => {
            setSubmitting(false);
        });
  };

  // --- Render Loading atau Error ---
  const isLoading = loadingDropdown || loadingOrder; // Loading jika salah satu proses fetch berjalan
  if (isLoading) {
    return <Container className="mt-5 text-center">
      <Spinner animation="border" variant="primary" />
      <p className="mt-3">Memuat data form...</p>
    </Container>;
  }

  if (apiError) {
    return <Container className="mt-5">
      <Alert variant="danger">
        <h4>Error Memuat Data</h4>
        <p>{apiError}</p>
        {isEditing && (
             <Button variant="primary" onClick={() => navigate('/order-list')}> Kembali </Button>
        )}
         <Button variant="secondary" onClick={() => window.location.reload()} className="ms-2"> Coba Lagi </Button>
      </Alert>
    </Container>;
  }

  // --- Render Form Utama ---
  return (
    <Container className="my-4">
      <div className="form-input-order-container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>{isEditing ? 'Edit Order' : 'Input Order Baru'}</h2>
          <div>
            <button 
              className="btn btn-outline-secondary me-2"
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left mr-1"></i> Kembali
            </button>
            <Link to="/" className="btn btn-outline-primary">
              <i className="fas fa-home mr-1"></i> Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Card>
            <Card.Header as="h2" className="text-center">
                {isEditing ? `Edit Order #${orderId}` : 'Input Order Baru'}
            </Card.Header>
            <Card.Body>
                <DebugSection isActive={false} formData={formData} orderId={orderId} />
                <Form onSubmit={handleSubmit} noValidate> {/* Tambah noValidate untuk custom handling */}
                    {/* Fieldset Info Dasar */}
                    <fieldset className="border p-3 mb-4 rounded">
                        <legend className="w-auto px-2 h6">Info Dasar</legend>
                        <Row className="g-3">
                            <Col md={6} lg={3}>
                                <Form.Group controlId="order_date">
                                    <Form.Label>Tanggal Order: *</Form.Label>
                                    <Form.Control type="date" name="order_date" value={formData.order_date} onChange={handleChange} required />
                                </Form.Group>
                            </Col>
                            <Col md={6} lg={3}>
                                <Form.Group controlId="sales_person">
                                    <Form.Label>Nama Marketing:</Form.Label>
                                    <Form.Select name="sales_person" value={formData.sales_person} onChange={handleChange}>
                                        {marketingUsers.map(user => (<option key={user.value} value={user.value}>{user.label}</option>))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6} lg={3}>
                                <Form.Group controlId="sumber_order">
                                    <Form.Label>Sumber Order: *</Form.Label>
                                    <Form.Select name="sumber_order" value={formData.sumber_order} onChange={handleChange} required isInvalid={!formData.sumber_order}>
                                        {sumberOrderOptions.map(option => ( <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option> ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">Wajib dipilih.</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                             <Col md={6} lg={3}>
                                <Form.Group controlId="status">
                                    <Form.Label>Status: *</Form.Label> {/* Ganti label jadi Status saja */}
                                    <Form.Select name="status" value={formData.status} onChange={handleChange} required>
                                        <option value="" disabled>-- Pilih Status --</option>
                                        {orderStatuses.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </fieldset>

                     {/* Fieldset Info Customer */}
                    <fieldset className="border p-3 mb-4 rounded">
                        <legend className="w-auto px-2 h6">Info Customer</legend>
                         <Row className="g-3">
                             <Col md={6}>
                                <Form.Group controlId="customer">
                                    <Form.Label>Customer: *</Form.Label>
                                    <Form.Select name="customer" value={formData.customer} onChange={handleChange} required>
                                        <option value="" disabled>-- Pilih Customer --</option>
                                        {customers.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.phone || 'No HP'})</option>))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                             <Col md={6}>
                                <Form.Group controlId="nomor_hp">
                                    <Form.Label>Nomor HP (Otomatis):</Form.Label>
                                    <Form.Control type="text" readOnly value={formData.nomor_hp} style={{backgroundColor: '#e9ecef'}} />
                                </Form.Group>
                            </Col>
                             <Col md={12}>
                                <Form.Group controlId="alamat_jalan">
                                    <Form.Label>Alamat Detail:</Form.Label>
                                    <Form.Control type="text" name="alamat_jalan" value={formData.alamat_jalan} onChange={handleChange} placeholder="Nama Jalan, RT/RW, Desa/Kelurahan" />
                                </Form.Group>
                            </Col>
                             <Col md={6} lg={3}>
                                 <Form.Group controlId="kecamatan">
                                    <Form.Label>Kecamatan:</Form.Label>
                                    <Form.Control type="text" name="kecamatan" value={formData.kecamatan} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                             <Col md={6} lg={3}>
                                <Form.Group controlId="kota">
                                    <Form.Label>Kota/Kab:</Form.Label>
                                    <Form.Control type="text" name="kota" value={formData.kota} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6} lg={3}>
                                <Form.Group controlId="provinsi">
                                    <Form.Label>Provinsi:</Form.Label>
                                    <Form.Control type="text" name="provinsi" value={formData.provinsi} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                             <Col md={6} lg={3}>
                                <Form.Group controlId="kode_pos">
                                    <Form.Label>Kode Pos:</Form.Label>
                                    <Form.Control type="text" name="kode_pos" value={formData.kode_pos} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </fieldset>

                     {/* Fieldset Detail Produk (Item Order) */}
                    <fieldset className="border p-3 mb-4 rounded">
                        <legend className="w-auto px-2 h6">Detail Produk (Item Order)</legend>
                        <Alert variant="info" size="sm" className="mb-3">
                            Catatan: Form saat ini hanya mendukung input/edit <strong>satu item produk</strong> per order.
                        </Alert>
                        <Row className="g-3">
                             <Col md={12}>
                                <Form.Group controlId="product">
                                    <Form.Label>Pilih Produk Referensi: *</Form.Label>
                                    <Form.Select name="product" value={formData.product} onChange={handleChange} required>
                                        <option value="" disabled>-- Pilih Produk --</option>
                                        {products.map(p => ( <option key={p.id} value={p.id}>{p.name} {p.code ? `(${p.code})` : ''}</option> )) }
                                    </Form.Select>
                                    <Form.Text className="text-muted">Pilih produk untuk mengisi otomatis nama, harga, dll.</Form.Text>
                                </Form.Group>
                            </Col>
                             <Col md={12}>
                                <Form.Group controlId="nama_produk">
                                    <Form.Label>Nama Produk (Sesuai Order): *</Form.Label>
                                    <Form.Control type="text" name="nama_produk" value={formData.nama_produk} onChange={handleChange} required placeholder="Nama produk yang akan tercetak" />
                                </Form.Group>
                            </Col>
                             <Col md={6}>
                                <Form.Group controlId="spesifikasi_bahan">
                                    <Form.Label>Spesifikasi Bahan:</Form.Label>
                                    <Form.Control type="text" name="spesifikasi_bahan" value={formData.spesifikasi_bahan} onChange={handleChange} placeholder="Contoh: Akrilik Bening 5mm" />
                                </Form.Group>
                            </Col>
                             <Col md={6}>
                                <Form.Group controlId="ukuran_produk">
                                    <Form.Label>Ukuran Produk:</Form.Label>
                                    <Form.Control type="text" name="ukuran_produk" value={formData.ukuran_produk} onChange={handleChange} placeholder="Contoh: 30x40 cm" />
                                </Form.Group>
                            </Col>
                             <Col xs={6} md={3}>
                                <Form.Group controlId="quantity">
                                    <Form.Label>Quantity: *</Form.Label>
                                    <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleChange} required min="1" />
                                </Form.Group>
                            </Col>
                             <Col xs={6} md={9}>
                                <Form.Group controlId="harga_produk">
                                    <Form.Label>Harga Satuan (Item): *</Form.Label>
                                     <InputGroup>
                                        <InputGroup.Text>Rp</InputGroup.Text>
                                        <Form.Control type="number" name="harga_produk" value={formData.harga_produk} onChange={handleChange} required min="0" step="100" placeholder="Harga per item"/>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={12}>
                                <Form.Group controlId="keterangan_produk">
                                    <Form.Label>Keterangan Item:</Form.Label>
                                    <Form.Control as="textarea" name="keterangan_produk" value={formData.keterangan_produk} onChange={handleChange} rows={2} placeholder="Catatan spesifik untuk item ini" />
                                </Form.Group>
                            </Col>
                        </Row>
                    </fieldset>

                    {/* Fieldset Biaya Tambahan & Pembayaran */}
                    <fieldset className="border p-3 mb-4 rounded">
                         <legend className="w-auto px-2 h6">Biaya Tambahan & Pembayaran</legend>
                         <Row className="g-3">
                             <Col md={6}>
                                <Form.Group controlId="biaya_pasang">
                                    <Form.Label>Biaya Pasang:</Form.Label>
                                     <InputGroup> <InputGroup.Text>Rp</InputGroup.Text> <Form.Control type="number" name="biaya_pasang" value={formData.biaya_pasang} onChange={handleChange} min="0" step="1000" /> </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={6}>
                                <Form.Group controlId="biaya_survey">
                                    <Form.Label>Biaya Survey:</Form.Label>
                                     <InputGroup> <InputGroup.Text>Rp</InputGroup.Text> <Form.Control type="number" name="biaya_survey" value={formData.biaya_survey} onChange={handleChange} min="0" step="1000" /> </InputGroup>
                                </Form.Group>
                            </Col>
                             <Col md={12}>
                                <Form.Group controlId="payment_method">
                                    <Form.Label>Cara Pembayaran: *</Form.Label>
                                    <Form.Select name="payment_method" value={formData.payment_method} onChange={handleChange} required>
                                        <option value="transfer">Bank Transfer</option> <option value="cash">Cash</option> <option value="cod">COD</option> <option value="cod_sebagian">COD Sebagian</option> <option value="transfer_sebagian">Transfer Sebagian</option> <option value="termin">Termin</option> <option value="partial">Partial Payment Lainnya</option> <option value="credit">Credit</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                         </Row>
                         <Form.Group controlId="notes" className="mt-3">
                            <Form.Label>Notes Order Keseluruhan:</Form.Label>
                            <Form.Control as="textarea" name="notes" value={formData.notes} onChange={handleChange} rows={2} placeholder="Catatan umum untuk order ini" />
                        </Form.Group>
                         <Form.Group controlId="terms" className="mt-3">
                            <Form.Label>Terms & Conditions:</Form.Label>
                            <Form.Control as="textarea" name="terms" value={formData.terms} onChange={handleChange} rows={2} placeholder="Ketentuan order"/>
                        </Form.Group>
                    </fieldset>

                    {/* Tombol Aksi */}
                    <div className="text-center mt-4">
                        <Button variant="secondary" onClick={() => navigate(isEditing ? `/order-detail/${orderId}` : '/order-list')} disabled={submitting} className="me-2">
                            Batal {/* <-- Tombol Batal */}
                        </Button>
                        {!isEditing && ( // <-- Tombol Reset hanya saat Create
                            <Button variant="warning" type="button" onClick={resetForm} disabled={submitting || isLoading} className="me-2">
                                Reset Form
                            </Button>
                        )}
                        <Button type="submit" variant={isEditing ? "primary" : "success"} disabled={submitting || isLoading}>
                            {submitting ? (
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1"/> Menyimpan...</>
                            ) : (
                                isEditing ? 'Update Order' : 'Simpan Order Baru' // <-- Label dinamis
                            )}
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    </Container>
  );
};

export default FormInputOrder;