import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import ProductionOrderList from './pages/produksi/ProductionOrderList';

// Komponen placeholder sederhana
const PlaceholderDashboard = () => (
  <div className="p-3">
    <h2>Dashboard</h2>
    <p>Selamat datang di Dashboard Rumah Akrilik</p>
  </div>
);

export default function App() {
  // State dan fungsi minimal
  const [username, setUsername] = React.useState('Admin');
  const [role, setRole] = React.useState('Manager');
  
  const handleLogout = () => {
    console.log('Logout clicked');
    // Implementasi logout sebenarnya
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        
        {/* MainLayout sebagai parent route */}
        <Route element={<MainLayout username={username} role={role} logout={handleLogout} />}>
          <Route index element={<PlaceholderDashboard />} />
          <Route path="produksi/daftar-order" element={<ProductionOrderList />} />
          <Route path="*" element={<div>Halaman tidak ditemukan</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}