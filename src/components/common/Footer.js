import React from 'react';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <div className="copyright">
          &copy; {currentYear} Rumah Akrilik. All rights reserved.
        </div>
        <div className="version">
          Version 1.0.0
        </div>
      </div>
    </footer>
  );
};

export default Footer;