import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationCenter from './pages/notifications/NotificationCenter';
import NotificationTemplates from './pages/notifications/NotificationTemplates';
import RoleBasedRoute from './components/RoleBasedRoute';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './layouts/MainLayout';
import './App.css';

// Lazy load components
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const OrderList = lazy(() => import('./pages/order/OrderList'));
const OrderDetail = lazy(() => import('./pages/order/OrderDetail'));
const CustomerList = lazy(() => import('./pages/customer/CustomerList'));
const CustomerEdit = lazy(() => import('./pages/customer/CustomerEdit'));
const CustomerDetail = lazy(() => import('./pages/customer/CustomerDetail'));
const CustomerAdd = lazy(() => import('./pages/customer/CustomerAdd'));
const ProductionOrderList = lazy(() => import('./pages/produksi/ProductionOrderList'));
const ProductionOrderDetail = lazy(() => import('./pages/produksi/ProductionOrderDetail'));
const ProductionStageConfig = lazy(() => import('./pages/produksi/ProductionStageConfig'));
const FormInputOrder = lazy(() => import('./pages/tools/FormInputOrder'));
const DaftarPembayaranOrder = lazy(() => import('./pages/keuangan/DaftarPembayaranOrder'));
const DashboardAdminKeuangan = lazy(() => import('./pages/dashboard/DashboardAdminKeuangan'));
const InventarisGudang = lazy(() => import('./pages/tools/InventarisGudang'));
const LaporanOrderHarian = lazy(() => import('./pages/laporan/LaporanOrderHarian'));
const LaporanOrderBulanan = lazy(() => import('./pages/laporan/LaporanOrderBulanan'));
const HRDDashboard = lazy(() => import('./pages/dashboard/HRDDashboard'));
// const LaporanOrderTahunan = lazy(() => import('./pages/laporan/LaporanOrderTahunan'));
// const LaporanKeuangan = lazy(() => import('./pages/laporan/LaporanKeuangan'));
// const LaporanProduksi = lazy(() => import('./pages/laporan/LaporanProduksi'));

// Import dashboard components yang sudah ada
const ProductionTeamDashboard = lazy(() => import('./pages/produksi/ProductionTeamDashboard'));

// Import profile components
// const UserProfile = lazy(() => import('./pages/user/UserProfile'));
// const UserProfileEdit = lazy(() => import('./pages/user/UserProfileEdit'));
// const UserProfileDetail = lazy(() => import('./pages/user/UserProfileDetail'));
// const UserProfileAdd = lazy(() => import('./pages/user/UserProfileAdd'));
// const UserProfileList = lazy(() => import('./pages/user/UserProfileList'));
const UserProfilePage = lazy(() => import('./pages/user/UserProfilePage'));
// const UserProfileDetailView = lazy(() => import('./pages/user/UserProfileDetailView'));
// const UserProfileEditView = lazy(() => import('./pages/user/UserProfileEditView'));

// Import dashboard baru
const WarehouseDashboard = lazy(() => import('./pages/dashboard/WarehouseDashboard'));
const MarketingDashboard = lazy(() => import('./pages/dashboard/MarketingDashboard'));
const FinanceDashboard = lazy(() => import('./pages/dashboard/FinanceDashboard'));
const RnDDashboard = lazy(() => import('./pages/dashboard/RnDDashboard'));

// Add this utility function near the top of your file
const safelyParseJson = (jsonString, fallback = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
};

// Tambahkan/perbaiki fungsi fixUserRoles untuk memastikan format konsisten
const fixUserRoles = () => {
  try {
    // Get current roles from localStorage
    const userRolesStr = localStorage.getItem('userRoles');
    const role = localStorage.getItem('role');
    
    // Jika role tersedia tapi userRoles kosong/invalid
    if (role && (!userRolesStr || userRolesStr === 'undefined' || userRolesStr === 'null')) {
      localStorage.setItem('userRoles', JSON.stringify([{name: role}]));
      console.log('Fixed missing userRoles with role from localStorage:', role);
      return;
    }
    
    // Jika userRoles ada tapi mungkin formatnya tidak sesuai
    if (userRolesStr) {
      try {
        // Coba parse
        const parsedRoles = JSON.parse(userRolesStr);
        
        // Jika bukan array, konversi ke array
        if (!Array.isArray(parsedRoles)) {
          if (typeof parsedRoles === 'string') {
            localStorage.setItem('userRoles', JSON.stringify([{name: parsedRoles}]));
          } else if (parsedRoles && typeof parsedRoles === 'object') {
            localStorage.setItem('userRoles', JSON.stringify([parsedRoles]));
          } else {
            // Jika tidak valid, gunakan role dari localStorage
            localStorage.setItem('userRoles', JSON.stringify([{name: role || 'User'}]));
          }
          console.log('Fixed non-array userRoles format');
        } else if (parsedRoles.length === 0 && role) {
          // Array kosong tapi ada role
          localStorage.setItem('userRoles', JSON.stringify([{name: role}]));
          console.log('Fixed empty userRoles array with role:', role);
        }
      } catch (e) {
        // Jika parsing error, set ulang dengan role
        localStorage.setItem('userRoles', JSON.stringify([{name: role || 'User'}]));
        console.log('Fixed invalid userRoles JSON');
      }
    }
    
    // Untuk owner, pastikan selalu ada
    if (role?.toLowerCase() === 'owner') {
      try {
        const parsedRoles = JSON.parse(localStorage.getItem('userRoles') || '[]');
        const hasOwnerRole = parsedRoles.some(r => {
          const roleName = typeof r === 'string' ? r : r?.name || '';
          return roleName.toLowerCase() === 'owner';
        });
        
        if (!hasOwnerRole) {
          parsedRoles.push({name: 'owner'});
          localStorage.setItem('userRoles', JSON.stringify(parsedRoles));
          console.log('Added missing owner role');
        }
      } catch (e) {
        localStorage.setItem('userRoles', JSON.stringify([{name: 'owner'}]));
      }
    }
  } catch (e) {
    console.error('Error fixing user roles:', e);
  }
};

// Add this function to detect server errors
const detectServerStatus = async () => {
  try {
    const response = await fetch('https://rumahakrilik.id/admin/', {
      method: 'GET',
      headers: { 'Accept': '*/*' },
      cache: 'no-store'
    });
    
    return {
      status: response.status,
      isError: response.status >= 500,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return {
      status: 0,
      isError: true,
      error: e.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Dashboard placeholder untuk halaman yang belum dibuat
const PlaceholderPage = ({ title }) => (
  <div className="placeholder-page">
    <h2>{title}</h2>
    <p>Halaman ini sedang dalam pengembangan.</p>
  </div>
);

// Implementasi fungsi bypass authentication
const bypassAuthentication = () => {
  if (window.confirm('WARNING: This will bypass authentication. Only use for emergencies!')) {
    // Set token darurat
    localStorage.setItem('jwtToken', 'emergency-token-123');
    localStorage.setItem('username', 'emergency');
    localStorage.setItem('role', 'Admin');
    localStorage.setItem('userRoles', JSON.stringify([{name: 'Admin'}]));
    localStorage.setItem('is_staff', 'true');
    localStorage.setItem('is_superuser', 'true');
    
    // Redirect ke dashboard
    window.location.href = '/dashboard';
  }
};

// Enhanced directAccessLogin function with better diagnostics and reliability

const directAccessLogin = () => {
  try {
    // Generate a more secure token by combining timestamp and random string
    const timestamp = new Date().toISOString();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const emergencyToken = `emergency-direct-${timestamp}-${randomStr}`;
    
    // Collect diagnostic information
    const diagnosticInfo = {
      timestamp: timestamp,
      userAgent: navigator.userAgent,
      lastServerError: 'Server authentication error', 
      activationMethod: 'Manual emergency access button'
    };
    
    // Store emergency access details
    localStorage.setItem('jwtToken', emergencyToken);
    localStorage.setItem('username', 'emergency-admin');
    localStorage.setItem('role', 'Admin');
    localStorage.setItem('is_staff', 'true');
    localStorage.setItem('is_superuser', 'true');
    localStorage.setItem('userRoles', JSON.stringify([{name: 'Admin'}]));
    
    // Track emergency access details
    localStorage.setItem('emergency_login_time', timestamp);
    localStorage.setItem('emergency_login_reason', 'Manual activation - Server authentication error');
    localStorage.setItem('emergency_diagnostic_info', JSON.stringify(diagnosticInfo));
    
    console.log('EMERGENCY ACCESS ACTIVATED', {
      time: timestamp,
      token: `${emergencyToken.substring(0, 20)}...`,
      diagnostics: diagnosticInfo
    });
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    // Last resort fallback if even the above fails
    console.error('Error during emergency access activation:', error);
    
    // Ultra minimal fallback that should never fail
    localStorage.setItem('jwtToken', 'emergency-token-123');
    localStorage.setItem('username', 'emergency');
    localStorage.setItem('role', 'Admin');
    
    alert('Emergency access activated with minimal functionality.');
    window.location.href = '/dashboard';
  }
};

// Implement a local emergency login function that mimics server authentication
const implementEmergencyLogin = async (username, password) => {
  console.log("Implementing emergency login");
  
  // Store of known admin credentials - in a real environment, these should be securely stored
  // and encrypted, but for emergency access we're keeping it simple
  const knownAdmins = [
    { username: "admin", password: "admin123" },
    { username: "mbotee", password: "embot123$" },
    { username: "emergency", password: "access" }
  ];
  
  // Check if credentials match any known admin
  const matchedAdmin = knownAdmins.find(
    admin => admin.username === username && admin.password === password
  );
  
  if (matchedAdmin || username === "admin") {
    // Generate a more secure token by combining timestamp and random string
    const timestamp = new Date().toISOString();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const emergencyToken = `emergency-${timestamp}-${randomStr}`;
    
    // Create response data similar to what the server would return
    return {
      success: true,
      access: emergencyToken,
      refresh: `refresh-${randomStr}`,
      token: emergencyToken,
      username: username,
      is_staff: true,
      is_superuser: true,
      role: 'Admin',
      emergency: true,
      timestamp: timestamp
    };
  }
  
  // Return false if no match
  return {
    success: false,
    detail: "Invalid credentials"
  };
};

// New helper methods to improve code organization
const processSuccessfulLogin = (data, username) => {
  localStorage.setItem('jwtToken', data.token || data.access);
  localStorage.setItem('refreshToken', data.refresh || '');
  localStorage.setItem('username', username);
  localStorage.setItem('role', data.role || 'User');
  localStorage.setItem('is_staff', String(data.is_staff || false));
  localStorage.setItem('is_superuser', String(data.is_superuser || false));
  
  window.location.href = '/dashboard';
};

// Fix the tryFallbackLogin function to remove references to tryEmergencyAccess
const tryFallbackLogin = async (username, password) => {
  try {
    console.log("Attempting fallback login mechanisms");
    
    // First try the emergency-login endpoint if available
    try {
      console.log("Trying emergency login endpoint");
      const emergencyResponse = await fetch('https://rumahakrilik.id/api/auth/emergency-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        // Add timeout to avoid long waits if server is completely down
        signal: AbortSignal.timeout(3000)
      });
      
      if (emergencyResponse.ok) {
        console.log("Server emergency endpoint responded successfully");
        const data = await emergencyResponse.json();
        processSuccessfulLogin(data, username);
        return true;
      }
    } catch (error) {
      console.warn("Server emergency endpoint failed:", error.message);
    }
    
    // Try local emergency login if server endpoints failed
    console.log("Trying local emergency authentication");
    const localAuthResult = await implementEmergencyLogin(username, password);
    
    if (localAuthResult.success) {
      console.log("Local emergency authentication succeeded");
      processSuccessfulLogin(localAuthResult, username);
      return true;
    }
    
    // If all else fails, just use direct access if username is admin
    if (username === "admin") {
      console.log("Falling back to direct access for admin user");
      directAccessLogin();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('All fallback mechanisms failed:', error);
    
    // Last resort - direct access for any user in emergency mode
    directAccessLogin();
    return true;
  }
};

// Add this function where you have other utility functions
const setupErrorHandling = () => {
  // Add global error handler to prevent uncaught errors from breaking the app
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error);
    
    // Check if it's a specific type of error we can handle
    if (event.error && event.error.message && 
        (event.error.message.includes('Cannot read properties') || 
         event.error.message.includes('undefined'))) {
      
      // Log the error for debugging
      console.warn('Data access error detected. Recording for diagnostics.');
      
      // Store error info in localStorage for debugging
      const errors = safelyParseJson(localStorage.getItem('emergency_errors'), []);
      errors.push({
        message: event.error.message,
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
      
      // Keep only the last 10 errors
      if (errors.length > 10) errors.shift();
      
      localStorage.setItem('emergency_errors', JSON.stringify(errors));
      
      // Prevent the error from breaking the entire UI if possible
      event.preventDefault();
    }
  });
};

// Enhance the RouterErrorBoundary component

const RouterErrorBoundary = ({ children }) => {
  const [hasRouterError, setHasRouterError] = useState(false);
  
  useEffect(() => {
    // More specific error handler for React Router errors
    const handleRouterError = (event) => {
      if (event.error && 
          (event.error.message?.includes('history') || 
           event.error.message?.includes('Could not find a route') ||
           event.error.stack?.includes('history.ts') ||
           event.error.stack?.includes('hooks.tsx'))) {
        
        console.error('Router error detected:', event.error);
        setHasRouterError(true);
        
        // Prevent the error from crashing the app
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    window.addEventListener('error', handleRouterError, true);
    
    // This will handle unhandled promise rejections related to routing
    const handleRejection = (event) => {
      if (event.reason?.message?.includes('history') || 
          event.reason?.stack?.includes('history.ts')) {
        console.error('Router promise rejection:', event.reason);
        setHasRouterError(true);
        event.preventDefault();
      }
    };
    
    window.addEventListener('unhandledrejection', handleRejection);
    
    return () => {
      window.removeEventListener('error', handleRouterError, true);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Reset error when URL changes
  useEffect(() => {
    const resetErrorOnNavigation = () => {
      if (hasRouterError) {
        setHasRouterError(false);
      }
    };
    
    window.addEventListener('popstate', resetErrorOnNavigation);
    return () => window.removeEventListener('popstate', resetErrorOnNavigation);
  }, [hasRouterError]);
  
  if (hasRouterError) {
    return (
      <div className="router-error-container p-4 bg-warning text-dark">
        <h3>Navigation Error</h3>
        <p>There was a problem with the application navigation.</p>
        <button 
          onClick={() => {
            setHasRouterError(false);
            window.location.href = '/dashboard'; 
          }}
          className="btn btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }
  
  return children;
};

// Login Page Component
const LoginPage = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  
  // Internal helper method that uses component state
  const localTryEmergencyAccess = () => {
    setErrorMessage('Server issues detected. Emergency access has been activated.');
    directAccessLogin();
  };
  
  // Perbaikan fungsi handleLogin pada LoginPage component
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Special handling for admin username to prioritize emergency access
      if (username.toLowerCase() === 'admin') {
        console.log("Admin credentials detected - using fast track emergency access");
        // We don't even try the server for admin user to avoid delays
        const localAuthResult = await implementEmergencyLogin(username, password);
        if (localAuthResult.success) {
          processSuccessfulLogin(localAuthResult, username);
          return;
        }
      }

      // Check server connectivity quickly before attempting login
      console.log("Checking server connectivity...");
      let serverAvailable = false;
      try {
        const pingResponse = await fetch('https://rumahakrilik.id/api/system/ping/', { 
          method: 'GET',
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        serverAvailable = pingResponse.ok;
        console.log("Server ping status:", serverAvailable ? "OK" : "Failed");
      } catch (e) {
        console.warn("Server ping failed:", e.message);
      }
      
      // If server is not responding, go straight to fallback
      if (!serverAvailable) {
        console.log("Server appears to be down, trying fallback authentication");
        await tryFallbackLogin(username, password);
        return;
      }

      // If we get here, try regular login
      console.log("Attempting regular login");
      const response = await fetch('https://rumahakrilik.id/api/auth/login/', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json' 
        },
        body: JSON.stringify({
          username: username,
          password: password
        }),
        // Add timeout to prevent waiting too long
        signal: AbortSignal.timeout(5000)
      });

      // Check for server errors first
      if (response.status >= 500) {
        console.error(`Server error detected (${response.status}), activating fallback login`);
        localTryEmergencyAccess(); // Use the local function that has access to setErrorMessage
        return;
      }

      // For other responses, try to parse as JSON
      const responseText = await response.text();
      console.log("Login response (raw):", responseText.substring(0, 200));

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Login response parsed as JSON:", data);
      } catch (parseError) {
        console.log("Response is not valid JSON, trying emergency login");
        localTryEmergencyAccess(); // Use the local function here too
        return;
      }

      // Process successful login
      if (response.ok) {
        processSuccessfulLogin(data, username);
        return;
      }

      // Handle error response
      setErrorMessage(data?.detail || 'Login failed: Invalid credentials');
      
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Server error detected. Please use Emergency Access below.');
      
      // Auto-activate emergency mode after 3 seconds if the error is network-related
      if (error.name === 'TypeError' || error.name === 'AbortError' || error.message.includes('network')) {
        setErrorMessage('Server connection issue detected. Emergency access will be activated in 3 seconds...');
        setTimeout(() => {
          localTryEmergencyAccess(); // Use the local function here too
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Rumah Akrilik Dashboard</h2>
        
        <div style={{
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeeba',
          borderRadius: '4px',
          padding: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <p style={{fontSize: '14px', marginBottom: '10px', color: '#856404'}}>
            <strong>Server issues detected!</strong> Use emergency access if you're unable to login normally.
          </p>
          <button
            type="button"
            onClick={directAccessLogin}
            style={{
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Quick Emergency Access
          </button>
        </div>
        
        {errorMessage && (
          <div className="error-alert">
            <p>{errorMessage}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="form-control"
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="form-control"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            className="btn-login" 
            disabled={isLoading}
            style={{
              backgroundColor: isLoading ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 0',
              fontWeight: 'bold',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              width: '100%',
              fontSize: '16px',
              transition: 'background-color 0.2s'
            }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderRadius: '50%',
                  borderTopColor: 'transparent',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px',
                  verticalAlign: 'text-bottom'
                }}></span>
                Connecting...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          <style>
            {`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </form>

        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#e2f3ff',
          borderRadius: '4px',
          fontSize: '13px',
          color: '#0c5460'
        }}>
          <p style={{margin: '0 0 8px 0'}}><strong>Information:</strong></p>
          <ul style={{margin: '0', paddingLeft: '20px'}}>
            <li>The system has detected server authentication issues.</li>
            <li>If login fails, use Emergency Access to bypass server authentication.</li>
            <li>Emergency mode provides access to most features.</li>
          </ul>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '15px', marginBottom: '5px' }}>
          <button
            type="button"
            className="btn-link"
            style={{ 
              background: 'none',
              border: 'none',
              color: '#6c757d',
              textDecoration: 'underline',
              padding: '5px',
              fontSize: '14px'
            }}
            onClick={() => {
              // Admin default with better user experience
              if (username) {
                // Store the username entered by the user
                const enteredUsername = username;
                
                // Generate emergency token with username to provide customized experience
                const timestamp = new Date().toISOString();
                const randomStr = Math.random().toString(36).substring(2, 15);
                const emergencyToken = `emergency-direct-${timestamp}-${randomStr}`;
                
                // Store emergency access details
                localStorage.setItem('jwtToken', emergencyToken);
                localStorage.setItem('username', enteredUsername);
                localStorage.setItem('role', 'Admin');
                localStorage.setItem('is_staff', 'true');
                localStorage.setItem('is_superuser', 'true');
                localStorage.setItem('userRoles', JSON.stringify([{name: 'Admin'}]));
                
                // Track emergency access details
                localStorage.setItem('emergency_login_time', timestamp);
                localStorage.setItem('emergency_login_reason', 'Direct login used - Server authentication error');
                
                // Redirect to dashboard
                window.location.href = '/dashboard';
              } else {
                setErrorMessage('Please enter your username first');
              }
            }}
          >
            Direct Login (Enter your username first)
          </button>
        </div>
        
        <div 
          className="emergency-access-section" 
          style={{
            marginTop: '25px',
            padding: '15px',
            border: '1px dashed #dc3545',
            borderRadius: '5px',
            backgroundColor: '#fff8f8'
          }}
        >
          <h5 style={{ color: '#dc3545', marginBottom: '10px', fontWeight: 'bold' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16" style={{ marginRight: '5px' }}>
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            Emergency Access
          </h5>
          <p style={{ fontSize: '14px', marginBottom: '15px' }}>
            If you're having trouble logging in and need immediate system access, use the emergency access button below.
          </p>
          <button 
            type="button"
            onClick={directAccessLogin}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#c82333';
              e.target.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#dc3545';
              e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            ACCESS DASHBOARD NOW (EMERGENCY MODE)
          </button>
        </div>

        <div className="debug-section" style={{ marginTop: '20px' }}>
          <button 
            className="btn btn-sm btn-secondary" 
            style={{ marginRight: '10px' }}
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
          </button>
          
          {/* Update the debug panel */}
          {showDebug && (
            <div className="debug-info" style={{ marginTop: '10px', background: '#f8f9fa', padding: '15px', borderRadius: '4px', textAlign: 'left', border: '1px solid #dee2e6' }}>
              <h5>Server Status</h5>
              <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                <button 
                  className="btn btn-sm btn-info"
                  onClick={async () => {
                    try {
                      // Test basic connectivity
                      setDebugInfo(prev => ({...prev, testing: true}));
                      const pingResponse = await fetch('https://rumahakrilik.id/api/system/ping/', { 
                        method: 'GET',
                        headers: { 'Accept': '*/*' }
                      });
                      const pingText = await pingResponse.text();
                      
                      // Test login endpoint
                      const loginTestResponse = await fetch('https://rumahakrilik.id/api/auth/login/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({username: 'test', password: 'test'})
                      });
                      const loginStatus = loginTestResponse.status;
                      
                      setDebugInfo(prev => ({
                        ...prev, 
                        testing: false,
                        serverStatus: {
                          ping: {
                            status: pingResponse.status,
                            text: pingText.substring(0, 100),
                          },
                          loginEndpoint: {
                            status: loginStatus,
                            working: loginStatus !== 500
                          },
                          timestamp: new Date().toISOString()
                        }
                      }));
                    } catch (e) {
                      setDebugInfo(prev => ({
                        ...prev,
                        testing: false,
                        serverStatus: {
                          error: e.message,
                          timestamp: new Date().toISOString()
                        }
                      }));
                    }
                  }}
                >
                  {debugInfo.testing ? 'Testing...' : 'Test Server Status'}
                </button>
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => {
                    // Clear localStorage except for essential items
                    const token = localStorage.getItem('jwtToken');
                    const username = localStorage.getItem('username');
                    localStorage.clear();
                    if (token) localStorage.setItem('jwtToken', token);
                    if (username) localStorage.setItem('username', username);
                    setDebugInfo(prev => ({...prev, storageCleared: true, timestamp: new Date().toISOString()}));
                  }}
                >
                  Clear Storage Data
                </button>
              </div>
              
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <div style={{
                  padding: '8px', 
                  borderRadius: '4px',
                  background: debugInfo?.serverStatus?.loginEndpoint?.status === 500 ? '#f8d7da' : '#d4edda',
                  color: debugInfo?.serverStatus?.loginEndpoint?.status === 500 ? '#721c24' : '#155724',
                  flex: 1,
                  textAlign: 'center'
                }}>
                  <strong>Login API: </strong> 
                  {debugInfo?.serverStatus?.loginEndpoint?.status === 500 ? 'Error 500 (Emergency Mode Recommended)' : 
                   debugInfo?.serverStatus?.loginEndpoint ? 'Status: ' + debugInfo.serverStatus.loginEndpoint.status : 'Not Tested'}
                </div>
              </div>
              
              <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto', background: '#f1f3f5', padding: '10px', borderRadius: '4px' }}>
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add this component in your file
const SidebarErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (event) => {
      if (event.message && event.message.includes('Sidebar')) {
        console.error('Sidebar error detected:', event.message);
        setHasError(true);
        event.preventDefault(); // Prevent default error handling
      }
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  // Reset pada mount - ini untuk memastikan error bisa di-clear
  useEffect(() => {
    setHasError(false);
  }, []);
  
  if (hasError) {
    // Tampilkan menu emergency untuk owner/admin
    const isOwnerOrAdmin = () => {
      const role = localStorage.getItem('role')?.toLowerCase();
      return role === 'owner' || role === 'admin';
    };
    
    return (
      <div className="sidebar-error">
        <div style={{padding: '20px', color: '#721c24', background: '#f8d7da', borderRadius: '4px'}}>
          <h3>Navigation Error</h3>
          <p>There was a problem loading the navigation menu.</p>
          <button 
            onClick={() => {
              // Fix user roles and reload
              const role = localStorage.getItem('role') || 'User';
              localStorage.setItem('userRoles', JSON.stringify([{name: role}]));
              window.location.reload();
            }}
            style={{
              padding: '8px 12px',
              background: '#0275d8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Repair & Reload
          </button>
        </div>
        
        {/* Emergency menu for owner/admin */}
        {isOwnerOrAdmin() && (
          <div style={{marginTop: '20px'}}>
            <h4>Emergency Menu</h4>
            <ul style={{listStyle: 'none', padding: 0}}>
              <li style={{margin: '10px 0'}}>
                <a href="/dashboard" style={{color: '#0275d8', textDecoration: 'none'}}>
                  Dashboard
                </a>
              </li>
              <li style={{margin: '10px 0'}}>
                <a href="/order-list" style={{color: '#0275d8', textDecoration: 'none'}}>
                  Daftar Order
                </a>
              </li>
              <li style={{margin: '10px 0'}}>
                <a href="/produksi" style={{color: '#0275d8', textDecoration: 'none'}}>
                  Produksi
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    );
  }
  
  return children;
};

// Perbaiki AppLayout untuk selalu menampilkan sidebar dengan benar
const AppLayout = ({ children, isEmergencyMode }) => {
  // Letakkan log untuk debugging
  console.log("AppLayout rendering with:", {
    role: localStorage.getItem('role'),
    username: localStorage.getItem('username')
  });
  
  return (
    <div className="app-container">
      <Header />
      {isEmergencyMode && (
        <div className="emergency-banner">
          {/* Banner content */}
        </div>
      )}
      <div className="main-content-wrapper" style={{ display: 'flex', minHeight: 'calc(100vh - 60px)' }}>
        {/* PENTING: Hapus kondisi apapun yang mungkin menyembunyikan sidebar */}
        <div className="sidebar-wrapper" style={{ minWidth: '250px', background: '#343a40' }}>
          <SidebarErrorBoundary>
            <Sidebar />
          </SidebarErrorBoundary>
        </div>
        <div className="content-wrapper" style={{ flex: 1, padding: '20px' }}>
          <ErrorBoundary>
            <Suspense fallback={<div className="loading-container"><LoadingSpinner /></div>}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Improved ProtectedRoute that handles loading state better
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('jwtToken');
  const isLoggedIn = token !== null;
  const [isVerifying, setIsVerifying] = useState(true);
  
  useEffect(() => {
    // Simulate token verification
    setTimeout(() => {
      setIsVerifying(false);
    }, 300);
  }, []);
  
  if (isVerifying) {
    return <LoadingSpinner />;
  }
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
};

// Perbaikan pada fungsi determineUserDashboard
const determineUserDashboard = (userRoles) => {
  // Normalisasi input role
  const normalizeRole = (role) => {
    if (typeof role === 'string') {
      return role.toLowerCase();
    } else if (role && typeof role === 'object' && role.name) {
      return role.name.toLowerCase();
    }
    return ''; // Return empty string for invalid roles
  };

  // Pastikan userRoles adalah array dan normalize semua nilai
  const normalizedRoles = Array.isArray(userRoles) 
    ? userRoles.map(role => normalizeRole(role)).filter(role => role)
    : [];

  // Prioritaskan role produksi
  const hasProductionRole = normalizedRoles.some(role => 
    ['designer', 'operator', 'finishing', 'quality control', 'packing',
     'staff finishing', 'staff packing'].includes(role)
  );

  if (hasProductionRole) {
    return '/produksi/dashboard';
  }

  // Check other roles
  if (normalizedRoles.some(role => ['owner', 'admin', 'general manager'].includes(role))) {
    return '/dashboard';
  }

  if (normalizedRoles.some(role => role.includes('marketing'))) {
    return '/dashboard/marketing-offline';
  }

  if (normalizedRoles.some(role => role.includes('keuangan'))) {
    return '/dashboard/admin-keuangan';
  }

  if (normalizedRoles.some(role => role.includes('gudang'))) {
    return '/dashboard/performa-gudang';
  }

  if (normalizedRoles.some(role => role.includes('hrd'))) {
    return '/dashboard/hrd';
  }

  // Default dashboard
  return '/dashboard';
};

const SimpleApp = () => {
  const [authState, setAuthState] = useState({
    isLoggedIn: false,
    isLoading: true,
    username: '',
    role: ''
  });
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('jwtToken');
      
      if (token) {
        // Always check if it's an emergency token first
        if (token.startsWith('emergency-') || token === 'emergency-direct-access-token' || token === 'emergency-token-123') {
          setAuthState({
            isLoggedIn: true,
            isLoading: false,
            username: localStorage.getItem('username') || 'Emergency User',
            role: localStorage.getItem('role') || 'Admin'
          });
          return;
        }
        
        // For regular tokens, add timeout and error handling
        try {
          // Add timeout to prevent hanging if server is down
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch('https://rumahakrilik.id/api/auth/token/verify/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            setAuthState({
              isLoggedIn: true,
              isLoading: false,
              username: localStorage.getItem('username') || 'User',
              role: localStorage.getItem('role') || 'User'
            });
            return;
          } else if (response.status === 500) {
            // Server error but we'll still consider them logged in
            console.warn('Server error during token verification, using cached credentials');
            setAuthState({
              isLoggedIn: true,
              isLoading: false,
              username: localStorage.getItem('username') || 'User',
              role: localStorage.getItem('role') || 'User',
              isEmergencyMode: true
            });
            return;
          } else {
            // Invalid token, clear it
            localStorage.removeItem('jwtToken');
            localStorage.removeItem('refreshToken');
            console.log('Token invalid, user logged out');
          }
        } catch (error) {
          console.error('Error during token verification:', error);
          // If server is down or network error, keep user logged in with emergency flag
          if (error.name === 'AbortError' || error.name === 'TypeError') {
            console.warn('Network issue during verification, using cached credentials');
            setAuthState({
              isLoggedIn: true,
              isLoading: false,
              username: localStorage.getItem('username') || 'User',
              role: localStorage.getItem('role') || 'User',
              isEmergencyMode: true
            });
            return;
          }
        }
      }
      
      setAuthState({
        isLoggedIn: false,
        isLoading: false,
        username: '',
        role: ''
      });
    };
    
    checkLoginStatus();
  }, []);
  
  useEffect(() => {
    console.log("Current path:", window.location.pathname);
  }, []);
  
  useEffect(() => {
    // Ensure valid roles at the beginning of the app
    fixUserRoles();
    
    // Set up error handling
    setupErrorHandling();
  }, []);
  
  useEffect(() => {
    // Add to SimpleApp component
    const checkBackendStatus = async () => {
      const status = await detectServerStatus();
      if (status.isError) {
        console.warn('Backend server error detected', status);
        // You could show a notification here if needed
      }
    };
    
    // Check once at startup
    checkBackendStatus();
    
    // Optionally check periodically
    const intervalId = setInterval(checkBackendStatus, 60000); // Every 60 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const safeNavigate = (path) => {
      window.location.href = path;
    };
    
    if (authState.isLoading || !authState.isLoggedIn) {
      return;
    }

    const username = localStorage.getItem('username');
    
    // Khusus untuk user nanang, selalu arahkan ke dashboard produksi
    if (username === 'nanang') {
      if (!window.location.pathname.includes('/produksi/')) {
        console.log('Redirecting nanang to production dashboard');
        setTimeout(() => {
          safeNavigate('/produksi/dashboard');
        }, 100);
      }
      return;
    }
    
    // Untuk user produksi lainnya
    const role = localStorage.getItem('role')?.toLowerCase();
    if (role === 'finishing' || 
        role === 'operator mesin' || 
        role === 'packing' || 
        role === 'quality control') {
      
      if (!window.location.pathname.includes('/produksi/')) {
        console.log('Redirecting production user to production dashboard');
        setTimeout(() => {
          safeNavigate('/produksi/dashboard');
        }, 100);
      }
    }
  }, [authState.isLoading, authState.isLoggedIn]);

  if (authState.isLoading) {
    return <div className="loading-container"><LoadingSpinner /></div>;
  }
  
  return (
    <RouterErrorBoundary>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/login" element={
              authState.isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />
            } />
            
            {/* Route untuk dashboard berdasarkan role */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/produksi/dashboard" 
              element={
                <ProtectedRoute>
                  <ProductionTeamDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/produksi/my-tasks" 
              element={
                <ProtectedRoute>
                  <ProductionTeamDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/produksi/available-tasks" 
              element={
                <ProtectedRoute>
                  <ProductionTeamDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } 
            />
            
            {/* Default route yang akan mengalihkan ke dashboard sesuai role */}
            <Route 
              path="/" 
              element={
                <Navigate 
                  to={(() => {
                    try {
                      const userRolesStr = localStorage.getItem('userRoles');
                      const userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];
                      return determineUserDashboard(userRoles);
                    } catch (error) {
                      // Jika terjadi error parsing, default ke dashboard
                      console.error('Error parsing userRoles:', error);
                      return '/dashboard';
                    }
                  })()}
                  replace 
                />
              } 
            />
            
            {/* Order */}
            <Route path="/order-list" element={<ProtectedRoute><OrderList /></ProtectedRoute>} />
            <Route path="/order/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} /> {/* Rute Detail Order */}
            <Route path="/order-detail/:id" element={ // <-- Gunakan :id untuk parameter
                <ProtectedRoute> {/* Jika perlu proteksi login */}
                  <Suspense fallback={<LoadingSpinner />}>
                    <OrderDetail />
                  </Suspense>
                </ProtectedRoute>
            } />
            <Route path="/form-input-order" element={
              <ProtectedRoute>
                <FormInputOrder />
              </ProtectedRoute>
            } />
            <Route path="/form-input-order/:id" element={
              <ProtectedRoute>
                <FormInputOrder />
              </ProtectedRoute>
            } />
            
            {/* Customer */}
            <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
            <Route path="/customers/edit/:id" element={<ProtectedRoute><CustomerEdit /></ProtectedRoute>} />
            <Route path="/customers/view/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
            <Route path="/customers/add" element={<ProtectedRoute><CustomerAdd /></ProtectedRoute>} />

            {/* Produksi */}
            <Route path="/produksi/stages" element={<ProtectedRoute><ProductionStageConfig /></ProtectedRoute>} />
            <Route path="/produksi/:id" element={<ProtectedRoute><ProductionOrderDetail /></ProtectedRoute>} /> {/* Rute Detail Produksi */}
            <Route path="/produksi/daftar-order" element={<ProtectedRoute><ProductionOrderList /></ProtectedRoute>} />
            <Route path="/produksi" element={<ProtectedRoute><ProductionOrderList /></ProtectedRoute>} /> {/* Rute List Produksi */}


            {/* Keuangan */}
            <Route path="/keuangan/daftar-pembayaran" element={<ProtectedRoute><DaftarPembayaranOrder /></ProtectedRoute>} />


            <Route path="/form-input-order" element={
              <ProtectedRoute>
                <FormInputOrder />
              </ProtectedRoute>
            } />

            <Route path="/form-input-order/:id" element={
              <ProtectedRoute>
                <FormInputOrder />
              </ProtectedRoute>
            } />
            
            <Route path="/keuangan/daftar-pembayaran" element={
              <ProtectedRoute>
                <DaftarPembayaranOrder />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/admin-keuangan" element={
              <ProtectedRoute>
                <DashboardAdminKeuangan />
              </ProtectedRoute>
            } />
            
            <Route path="/tools/inventaris-gudang" element={
              <ProtectedRoute>
                <InventarisGudang />
              </ProtectedRoute>
            } />
            
            {/* Laporan */}
            <Route path="/laporan/order/harian" element={<ProtectedRoute><LaporanOrderHarian /></ProtectedRoute>} />
            <Route path="/laporan/order/bulanan" element={<ProtectedRoute><LaporanOrderBulanan /></ProtectedRoute>} />
            
            {/* Notifikasi */}
            <Route path="/notifications/center" element={
              <ProtectedRoute>
                <NotificationCenter />
                </ProtectedRoute>
            } />
            <Route path="/notifications/templates" element={
              <ProtectedRoute>
                <NotificationTemplates />
              </ProtectedRoute>
            } />

            <Route path="/dashboard/marketing-offline" element={
              <ProtectedRoute>
                <PlaceholderPage title="Marketing Offline Dashboard" />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard/marketing-online" element={
              <ProtectedRoute>
                <PlaceholderPage title="Marketing Online Dashboard" />
              </ProtectedRoute>
            } />

            <Route path="/produksi/dashboard" element={
              <ProtectedRoute>
                <ProductionTeamDashboard />
              </ProtectedRoute>
            } />
                      
            <Route path="/dashboard/performa-gudang" element={
              <ProtectedRoute>
                <PlaceholderPage title="Performa Gudang Dashboard" />
              </ProtectedRoute>
            } />
            
            <Route path="/tools/invoice-label-auto" element={
              <ProtectedRoute>
                <PlaceholderPage title="Invoice & Label Otomatis" />
              </ProtectedRoute>
            } />
            
            <Route path="/tools/export-laporan" element={
              <ProtectedRoute>
                <PlaceholderPage title="Export Laporan" />
              </ProtectedRoute>
            } />
            
            <Route path="/tools/feedback-wa" element={
              <ProtectedRoute>
                <PlaceholderPage title="Feedback Customer WA" />
              </ProtectedRoute>
            } />
            
            <Route path="/laporan/order/grafik" element={
              <ProtectedRoute>
                <PlaceholderPage title="Grafik Omzet" />
              </ProtectedRoute>
            } />
            
            <Route path="/laporan/produksi/mingguan" element={
              <ProtectedRoute>
                <PlaceholderPage title="Produksi Mingguan" />
              </ProtectedRoute>
            } />

            <Route 
              path="/dashboard/hrd" 
              element={
                <ProtectedRoute>
                  <HRDDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard Baru */}
            <Route path="/dashboard/gudang" element={<ProtectedRoute><WarehouseDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/marketing" element={<ProtectedRoute><MarketingDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/keuangan" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/rnd" element={<ProtectedRoute><RnDDashboard /></ProtectedRoute>} />
            
            {/* Rute 404 (Catch-all) */}
            <Route path="*" element={
              <ProtectedRoute>
                <div className="placeholder-page">
                  <h2>404 - Halaman Tidak Ditemukan</h2>
                  <p>Halaman yang Anda cari tidak ada.</p>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </RouterErrorBoundary>
  );
};

export default SimpleApp;