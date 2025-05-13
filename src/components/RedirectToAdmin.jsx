import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spinner, Container } from 'react-bootstrap';

const RedirectToAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Cek apakah user memiliki akses admin
    const isAdmin = localStorage.getItem('role') === 'admin';
    
    if (isAdmin) {
      // Redirect ke halaman admin internal jika memiliki akses
      navigate(`/produksi/order/${id}`);
    } else {
      // Redirect ke sistem admin eksternal atau tampilkan pesan error
      window.location.href = `https://rumahakrilik.id/order-detail/${id}`;
    }
  }, [id, navigate]);
  
  return (
    <Container className="text-center py-5">
      <Spinner animation="border" />
      <p className="mt-3">Mengalihkan ke halaman detail order...</p>
    </Container>
  );
};

export default RedirectToAdmin;