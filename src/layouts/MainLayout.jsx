import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
// Update import path untuk Sidebar
import Sidebar from '../components/common/Sidebar';
import './MainLayout.css';

// Update komponen untuk menerima children sebagai prop opsional
const MainLayout = ({ children }) => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'User';
  const role = localStorage.getItem('role') || 'User';

  const logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    // Tambahkan penghapusan userRoles juga
    localStorage.removeItem('userRoles');
    navigate('/login');
  };

  return (
    <div className="main-layout">
      {/* Header */}
      <header className="main-header">
        <div className="header-container">
          <div className="logo-container">
            <h4 className="app-title">Rumah Akrilik Dashboard</h4>
          </div>
          <div className="user-section">
            <span>{username} ({role})</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>
      
      {/* Content Area */}
      <div className="content-area">
        {/* Sidebar */}
        <div className="sidebar-container">
          <Sidebar />
        </div>
        
        {/* Main Content - Render children jika ada, Outlet jika tidak */}
        <div className="content-container">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;