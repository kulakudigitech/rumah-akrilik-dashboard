import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faPhone, faEnvelope, faClock } from '@fortawesome/free-solid-svg-icons';

const UserProfilePage = () => {
  const [profile, setProfile] = useState({
    username: localStorage.getItem('username') || '',
    fullName: '',
    email: '',
    phone: '',
    role: localStorage.getItem('role') || '',
    joinDate: '',
    department: '',
    position: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Role-related data based on user
  const roles = localStorage.getItem('userRoles') 
    ? JSON.parse(localStorage.getItem('userRoles')) 
    : [];
    
  const formattedRoles = roles.map(role => {
    if (typeof role === 'string') return role;
    return role.name || '';
  });
  
  useEffect(() => {
    // Fetch user profile data from API
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        
        // If we're in emergency mode or token starts with emergency, use mock data
        if (!token || token.startsWith('emergency')) {
          setProfile({
            ...profile,
            fullName: localStorage.getItem('username') || 'User',
            email: `${localStorage.getItem('username')}@example.com`,
            phone: '08xxxxxxxxxx',
            joinDate: '2022-01-01',
            department: getDepartmentFromRole(localStorage.getItem('role')),
            position: localStorage.getItem('role') || 'Staff'
          });
          setLoading(false);
          return;
        }
        
        // Try to fetch from API
        const response = await fetch('https://rumahakrilik.id/api/users/me/', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile({
            ...profile,
            fullName: data.full_name || data.username,
            email: data.email || `${profile.username}@example.com`,
            phone: data.phone || '08xxxxxxxxxx',
            joinDate: data.join_date || '2022-01-01',
            department: data.department || getDepartmentFromRole(profile.role),
            position: data.position || profile.role
          });
        } else {
          // Use default data if API fails
          setProfile({
            ...profile,
            fullName: localStorage.getItem('username') || 'User',
            email: `${localStorage.getItem('username')}@example.com`,
            joinDate: '2022-01-01',
            department: getDepartmentFromRole(localStorage.getItem('role')),
            position: localStorage.getItem('role') || 'Staff'
          });
        }
      } catch (err) {
        setError('Failed to load profile data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  // Helper function to determine department from role
  const getDepartmentFromRole = (role) => {
    if (!role) return 'General';
    
    const roleLower = role.toLowerCase();
    
    if (roleLower.includes('marketing') || roleLower.includes('cs')) {
      return 'Marketing';
    } else if (roleLower.includes('designer') || 
               roleLower.includes('operator') || 
               roleLower.includes('finishing') || 
               roleLower.includes('quality') || 
               roleLower.includes('packing')) {
      return 'Produksi';
    } else if (roleLower.includes('keuangan') || roleLower.includes('finance')) {
      return 'Keuangan';
    } else if (roleLower.includes('gudang')) {
      return 'Gudang';
    } else if (roleLower.includes('hrd')) {
      return 'HRD';
    } else if (roleLower.includes('rnd') || roleLower.includes('r&d')) {
      return 'R&D';
    }
    
    return 'General';
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Memuat data profil...</p>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <h2 className="mb-4">
        <FontAwesomeIcon icon={faUser} className="me-2" />
        Profil Saya
      </h2>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert variant="success" className="mb-4">
          {successMessage}
        </Alert>
      )}
      
      <Card>
        <Card.Header className="bg-primary text-white">
          Informasi Pengguna
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faIdCard} className="me-2" />
                  Username
                </Form.Label>
                <Form.Control 
                  type="text" 
                  value={profile.username} 
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faUser} className="me-2" />
                  Nama Lengkap
                </Form.Label>
                <Form.Control 
                  type="text" 
                  value={profile.fullName}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faEnvelope} className="me-2" />
                  Email
                </Form.Label>
                <Form.Control 
                  type="email" 
                  value={profile.email}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faPhone} className="me-2" />
                  Nomor Telepon
                </Form.Label>
                <Form.Control 
                  type="text" 
                  value={profile.phone}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  Tanggal Bergabung
                </Form.Label>
                <Form.Control 
                  type="text" 
                  value={formatDate(profile.joinDate)}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Departemen</Form.Label>
                <Form.Control 
                  type="text" 
                  value={profile.department}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Jabatan</Form.Label>
                <Form.Control 
                  type="text" 
                  value={profile.position}
                  readOnly
                  className="bg-light"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Peran (Role)</Form.Label>
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {formattedRoles.map((role, index) => (
                    <span key={index} className="badge bg-info">{role}</span>
                  ))}
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      <div className="mt-4 d-flex justify-content-end">
        <Button variant="secondary" onClick={() => window.history.back()}>
          Kembali
        </Button>
      </div>
    </Container>
  );
};

export default UserProfilePage;