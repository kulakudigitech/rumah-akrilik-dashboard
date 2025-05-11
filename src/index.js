import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './components/Sidebar.css';
// import './layouts/MainLayout.css';
import './pages/LoginPage.css'; // Sesuaikan dengan path yang benar
import SimpleApp from './SimpleApp';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
);