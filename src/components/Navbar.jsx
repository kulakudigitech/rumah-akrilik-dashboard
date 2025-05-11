import React from 'react';
import { Navbar as BootstrapNavbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import './Navbar.css'; // Buat file CSS ini jika belum ada

const Navbar = ({ username, role, onLogout }) => {
  return (
    <BootstrapNavbar bg="white" expand="lg" className="border-bottom">
      <Container fluid>
        <BootstrapNavbar.Brand href="/dashboard">
          Rumah Akrilik Dashboard
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <NavDropdown 
              title={
                <span>
                  <FaUser className="me-1" /> {username || 'User'} 
                  <span className="ms-1 text-muted">({role || 'Guest'})</span>
                </span>
              } 
              id="user-dropdown"
            >
              <NavDropdown.Item href="/profile">
                <FaCog className="me-2" /> Profil Saya
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={onLogout}>
                <FaSignOutAlt className="me-2" /> Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;