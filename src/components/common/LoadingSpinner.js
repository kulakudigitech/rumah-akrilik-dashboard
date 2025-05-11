import React from 'react';
import { Spinner } from 'react-bootstrap';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-spinner-container">
      <Spinner animation="border" variant="primary" />
      <span className="loading-text">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;