import React, { useState, useEffect } from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import ApiStatusChecker from '../../utils/apiStatusChecker';
import DummyDataManager from '../../utils/dummyDataManager';

const ApiStatusBadge = () => {
  const [apiStatus, setApiStatus] = useState('checking');
  const [usingDummy, setUsingDummy] = useState(false);
  
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const isAvailable = await ApiStatusChecker.isApiAvailable();
        setApiStatus(isAvailable ? 'online' : 'offline');
        
        const isDummyMode = DummyDataManager.isUsingDummyData();
        setUsingDummy(isDummyMode);
      } catch (error) {
        setApiStatus('error');
        console.error('Error checking API status:', error);
      }
    };
    
    // Check API status immediately
    checkApiStatus();
    
    // Set interval to check status periodically
    const intervalId = setInterval(checkApiStatus, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, []);
  
  const getBadgeVariant = () => {
    if (apiStatus === 'online') return 'success';
    if (apiStatus === 'offline') return 'danger';
    if (apiStatus === 'checking') return 'warning';
    return 'secondary';
  };
  
  const getBadgeText = () => {
    if (usingDummy) return 'Data Dummy';
    if (apiStatus === 'online') return 'API Online';
    if (apiStatus === 'offline') return 'API Offline';
    if (apiStatus === 'checking') return 'Checking API...';
    return 'API Status Unknown';
  };
  
  const getTooltipText = () => {
    if (usingDummy) {
      return 'Menggunakan data dummy karena API tidak tersedia atau tidak menemukan data yang diminta';
    }
    if (apiStatus === 'online') {
      return 'API tersedia dan berfungsi normal';
    }
    if (apiStatus === 'offline') {
      return 'API tidak tersedia saat ini, menggunakan data lokal';
    }
    if (apiStatus === 'checking') {
      return 'Sedang memeriksa status API...';
    }
    return 'Status API tidak diketahui';
  };
  
  return (
    <OverlayTrigger
      placement="left"
      overlay={<Tooltip>{getTooltipText()}</Tooltip>}
    >
      <Badge 
        bg={getBadgeVariant()} 
        style={{ 
          cursor: 'help', 
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 1000
        }}
      >
        {getBadgeText()}
      </Badge>
    </OverlayTrigger>
  );
};

export default ApiStatusBadge;