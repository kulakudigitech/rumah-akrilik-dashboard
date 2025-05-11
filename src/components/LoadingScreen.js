import React from 'react';

const LoadingScreen = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      flexDirection: 'column',
      backgroundColor: '#f8f9fc'
    }}>
      <div style={{ 
        border: '4px solid rgba(0, 0, 0, 0.1)', 
        borderLeft: '4px solid #4e73df',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ marginTop: '20px', color: '#4e73df', fontWeight: 'bold' }}>
        Loading Rumah Akrilik Dashboard...
      </p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;