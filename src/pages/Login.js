import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

// Konfigurasi Axios default
axios.defaults.baseURL = 'https://rumahakrilik.id/api'; // Ganti dengan URL backend Anda
axios.defaults.headers.post['Content-Type'] = 'application/json';

const LoginPage = ({ updateAuth }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const response = await axios.post('/auth/login/', {
      username,
      password
    });

    console.log("Login sukses:", response.data);

    // Simpan token dan data user
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('jwtToken', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);
    localStorage.setItem('username', response.data.username);
    localStorage.setItem('is_staff', response.data.is_staff);
    localStorage.setItem('is_superuser', response.data.is_superuser);
    localStorage.setItem('role', response.data.role);
    localStorage.setItem('profile_complete', 'true');

    if (updateAuth) {
      updateAuth(); // update state auth
    }

    toast.success('Login berhasil!');
    window.location.href = '/';
  } catch (error) {
    console.error("Login gagal:", error.response?.data || error.message);
    toast.error('Login gagal. Periksa username dan password.');
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ 
      padding: '30px', 
      maxWidth: '400px', 
      margin: '50px auto',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      borderRadius: '8px'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        Login Rumah Akrilik
      </h2>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary btn-block" 
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Logging in...
            </>
          ) : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
