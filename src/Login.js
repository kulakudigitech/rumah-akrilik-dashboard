
import React, { useState } from 'react';
import axios from 'axios';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/auth/login/', {
        username,
        password
      });

      localStorage.setItem('jwtToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      localStorage.setItem('username', response.data.username);
      localStorage.setItem('is_staff', response.data.is_staff);
      localStorage.setItem('is_superuser', response.data.is_superuser);
      localStorage.setItem('role', response.data.role);

      window.location.href = '/';
    } catch (err) {
      setError('Login gagal. Periksa username/password.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Login Rumah Akrilik</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
