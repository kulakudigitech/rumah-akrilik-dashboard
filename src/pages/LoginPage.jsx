import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const LoginPage = ({ updateAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login/', {
        username,
        password
      });

      const { token, refresh, user_id, role } = response.data;

      // Simpan token dan data user di localStorage
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('userId', user_id);

      // Ambil data roles user
      const userResponse = await axios.get('/api/user/me/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (userResponse.data && userResponse.data.roles) {
        localStorage.setItem('userRoles', JSON.stringify(userResponse.data.roles));

        // Cek role untuk menentukan redirect
        const roles = userResponse.data.roles.map(r => r.toLowerCase());

        // Redirect ke dashboard sesuai role
        if (roles.some(r => ['finishing', 'quality control', 'staff finishing', 'staff packing'].includes(r))) {
          navigate('/produksi/dashboard');
        } else if (roles.includes('admin') || roles.includes('owner')) {
          navigate('/dashboard');
        } else {
          // Default redirect
          navigate('/dashboard');
        }
      } else {
        // Default redirect jika tidak bisa mendapatkan roles
        navigate('/dashboard');
      }

      toast.success("Login berhasil!");

    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Login gagal. Periksa username dan password Anda.');
      toast.error("Login gagal. Periksa username dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  const debugAuth = () => {
    const authData = {
      jwtToken: localStorage.getItem('jwtToken'),
      refreshToken: localStorage.getItem('refreshToken'),
      username: localStorage.getItem('username'),
      role: localStorage.getItem('role'),
      isStaff: localStorage.getItem('is_staff'),
      isSuperuser: localStorage.getItem('is_superuser')
    };

    console.log('Auth Debug Data:', authData);
    setDebugInfo(authData);
  };

  return (
    <Container fluid className="py-5 bg-light" style={{ minHeight: '100vh' }}>
      <Row className="justify-content-center">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <div className="text-center mb-4">
            <h2>Rumah Akrilik</h2>
            <p className="text-muted">Login Dashboard</p>
          </div>

          <Card className="shadow-sm">
            <Card.Body className="p-4">
              {error && (
                <Alert variant="danger" className="mb-4">
                  {error}
                </Alert>
              )}

              <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Masukkan username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Masukkan password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      <span className="ms-2">Loading...</span>
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>

          {showDebug && (
            <div className="mt-4 p-3 border rounded bg-light">
              <h6>Debug Info</h6>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}

          <div className="text-center mt-3">
            <button type="button" className="btn btn-link btn-sm" onClick={() => setShowDebug(!showDebug)}>
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
            {showDebug && (
              <button type="button" className="btn btn-link btn-sm" onClick={debugAuth}>
                Check Auth
              </button>
            )}
          </div>

          <div className="text-center mt-4">
            <p className="text-muted">
              &copy; {new Date().getFullYear()} Rumah Akrilik
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;