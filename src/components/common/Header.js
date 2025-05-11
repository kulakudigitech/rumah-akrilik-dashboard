import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import './Header.css';

const Header = () => {
  // Ambil data user dari localStorage
  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role') || '';
  
  const handleLogout = () => {
    // Hapus semua data auth dari localStorage
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('is_staff');
    localStorage.removeItem('is_superuser');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('profile_complete');
    
    // Redirect ke login page
    window.location.href = '/login';
  };

  return (
    <header className="main-header">
      <div className="header-container">
        <div className="logo-container">
          <Link to="/" className="logo-link">
            <h1 className="app-title">
              <i className="fas fa-cube mr-2"></i>
              Rumah Akrilik Dashboard
            </h1>
          </Link>
        </div>
        
        <div className="user-section">
          <span className="user-name">
            <i className="fas fa-user-circle mr-1"></i>
            {username} <span className="user-role">({role})</span>
          </span>
          <Button
            variant="outline-light"
            size="sm"
            onClick={handleLogout}
            className="logout-button"
          >
            <i className="fas fa-sign-out-alt mr-1"></i> Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;