import React from 'react';
import { useLocation } from 'react-router-dom';

// Komponen debugging sederhana
const DebugRoutes = () => {
  const location = useLocation();
  
  return (
    <div style={{ 
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '12px'
    }}>
      <div><strong>Path:</strong> {location.pathname}</div>
    </div>
  );
};

export default DebugRoutes;