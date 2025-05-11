import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, faShoppingCart, faUsers, faIndustry, faMoneyBill,
  faChartLine, faBell, faTools, faCaretDown, faCaretRight
} from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const [expanded, setExpanded] = useState({
    laporan: false,
    produksi: false,
    keuangan: false,
    tools: false,
    notifications: false,
    dashboards: false
  });
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    setUserRoles(getUserRoles());
    
    // Set expanded menus based on current path
    const path = location.pathname;
    if (path.includes('/laporan')) {
      setExpanded(prev => ({ ...prev, laporan: true }));
    }
    if (path.includes('/produksi')) {
      setExpanded(prev => ({ ...prev, produksi: true }));
    }
    if (path.includes('/keuangan')) {
      setExpanded(prev => ({ ...prev, keuangan: true }));
    }
    if (path.includes('/tools')) {
      setExpanded(prev => ({ ...prev, tools: true }));
    }
    if (path.includes('/notifications')) {
      setExpanded(prev => ({ ...prev, notifications: true }));
    }
    if (path.includes('/dashboard')) {
      setExpanded(prev => ({ ...prev, dashboards: true }));
    }
  }, [location.pathname]);

  // Toggle expand state of menu items
  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Check if user has specific roles
  const hasRole = (userRoles, roleList) => {
    // For Owner & Admin, always allow access
    if (userRoles.some(role => ['owner', 'admin'].includes(role))) return true;
    
    // Check if user has any role in the roleList
    return userRoles.some(userRole => 
      roleList.some(requiredRole => 
        userRole.toLowerCase().includes(requiredRole.toLowerCase())
      )
    );
  };

  // Render menu items based on user roles
  const renderMenuItems = () => {
    // Ambil user roles dari localStorage dengan normalisasi
    const userRolesStr = localStorage.getItem('userRoles');
    let userRoles = [];
    
    // Handle berbagai format role di localStorage
    try {
      if (userRolesStr) {
        const parsed = JSON.parse(userRolesStr);
        if (Array.isArray(parsed)) {
          userRoles = parsed.map(role => {
            // Normalize role format
            if (typeof role === 'string') return role.toLowerCase();
            if (role && typeof role === 'object' && role.name) return role.name.toLowerCase();
            return '';
          }).filter(Boolean); // Remove empty strings
        } else if (typeof parsed === 'string') {
          userRoles = [parsed.toLowerCase()];
        } else if (parsed && typeof parsed === 'object' && parsed.name) {
          userRoles = [parsed.name.toLowerCase()];
        }
      }
    } catch (error) {
      console.error('Error parsing user roles:', error);
      // Fallback: get role from localStorage
      const role = localStorage.getItem('role');
      if (role) userRoles = [role.toLowerCase()];
    }

    // Jika tidak ada roles yang valid, tambahkan role dari localStorage
    if (!userRoles.length) {
      const role = localStorage.getItem('role');
      if (role) userRoles = [role.toLowerCase()];
    }
    
    console.log('Current user roles for sidebar:', userRoles);
    
    // PENTING: SELALU tampilkan sidebar untuk owner dan admin
    if (userRoles.includes('owner') || userRoles.includes('admin') || 
        localStorage.getItem('role')?.toLowerCase() === 'owner' ||
        localStorage.getItem('role')?.toLowerCase() === 'admin') {
      
      return (
        <>
          {/* Dashboard */}
          <li className={expanded.dashboards ? 'expanded' : ''}>
            <div 
              className={`menu-item ${isActive('/dashboard') ? 'active' : ''}`}
              onClick={() => toggleExpand('dashboards')}
            >
              <span>
                <FontAwesomeIcon icon={faTachometerAlt} className="menu-icon" /> Dashboards
              </span>
              <FontAwesomeIcon 
                icon={expanded.dashboards ? faCaretDown : faCaretRight} 
                className="dropdown-icon" 
              />
            </div>
            {expanded.dashboards && (
              <ul className="submenu">
                <li>
                  <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                    Dashboard Utama
                  </NavLink>
                </li>
                
                {/* Dashboard per Departemen */}
                {hasRole(userRoles, ['produksi', 'finishing', 'operator', 'designer', 'quality control']) && (
                  <li>
                    <NavLink to="/produksi/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                      Dashboard Produksi
                    </NavLink>
                  </li>
                )}
                
                {hasRole(userRoles, ['keuangan', 'admin keuangan']) && (
                  <li>
                    <NavLink to="/dashboard/keuangan" className={({isActive}) => isActive ? 'active' : ''}>
                      Dashboard Keuangan
                    </NavLink>
                  </li>
                )}
                
                {hasRole(userRoles, ['marketing', 'cs']) && (
                  <li>
                    <NavLink to="/dashboard/marketing" className={({isActive}) => isActive ? 'active' : ''}>
                      Dashboard Marketing
                    </NavLink>
                  </li>
                )}
                
                {hasRole(userRoles, ['gudang']) && (
                  <li>
                    <NavLink to="/dashboard/gudang" className={({isActive}) => isActive ? 'active' : ''}>
                      Dashboard Gudang
                    </NavLink>
                  </li>
                )}
                
                {hasRole(userRoles, ['hrd']) && (
                  <li>
                    <NavLink to="/dashboard/hrd" className={({isActive}) => isActive ? 'active' : ''}>
                      Dashboard HRD
                    </NavLink>
                  </li>
                )}
                
                {hasRole(userRoles, ['rnd']) && (
                  <li>
                    <NavLink to="/dashboard/rnd" className={({isActive}) => isActive ? 'active' : ''}>
                      Dashboard R&D
                    </NavLink>
                  </li>
                )}
              </ul>
            )}
          </li>
          
          {/* Order */}
          <li>
            <NavLink to="/order-list" className={({isActive}) => isActive ? 'active' : ''}>
              <FontAwesomeIcon icon={faShoppingCart} className="menu-icon" /> Daftar Order
            </NavLink>
          </li>
          
          {/* Customer */}
          <li>
            <NavLink to="/customers" className={({isActive}) => isActive ? 'active' : ''}>
              <FontAwesomeIcon icon={faUsers} className="menu-icon" /> Customer
            </NavLink>
          </li>
          
          {/* Produksi - dengan dropdown */}
          <li className={expanded.produksi ? 'expanded' : ''}>
            <div 
              className={`menu-item ${isActive('/produksi') ? 'active' : ''}`} 
              onClick={() => toggleExpand('produksi')}
            >
              <span>
                <FontAwesomeIcon icon={faIndustry} className="menu-icon" /> Produksi
              </span>
              <FontAwesomeIcon 
                icon={expanded.produksi ? faCaretDown : faCaretRight} 
                className="dropdown-icon" 
              />
            </div>
            {expanded.produksi && (
              <ul className="submenu">
                <li>
                  <NavLink to="/produksi" className={({isActive}) => isActive ? 'active' : ''}>
                    Daftar Order Produksi
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/produksi/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
                    Dashboard Produksi
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/produksi/stages" className={({isActive}) => isActive ? 'active' : ''}>
                    Konfigurasi Tahapan
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          
          {/* Keuangan - dengan dropdown */}
          <li className={expanded.keuangan ? 'expanded' : ''}>
            <div 
              className={`menu-item ${isActive('/keuangan') ? 'active' : ''}`} 
              onClick={() => toggleExpand('keuangan')}
            >
              <span>
                <FontAwesomeIcon icon={faMoneyBill} className="menu-icon" /> Keuangan
              </span>
              <FontAwesomeIcon 
                icon={expanded.keuangan ? faCaretDown : faCaretRight} 
                className="dropdown-icon" 
              />
            </div>
            {expanded.keuangan && (
              <ul className="submenu">
                <li>
                  <NavLink to="/keuangan/daftar-pembayaran" className={({isActive}) => isActive ? 'active' : ''}>
                    Daftar Pembayaran
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/dashboard/admin-keuangan" className={({isActive}) => isActive ? 'active' : ''}>
                    Dashboard Keuangan
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          
          {/* Laporan - dengan dropdown */}
          <li className={expanded.laporan ? 'expanded' : ''}>
            <div 
              className={`menu-item ${isActive('/laporan') ? 'active' : ''}`} 
              onClick={() => toggleExpand('laporan')}
            >
              <span>
                <FontAwesomeIcon icon={faChartLine} className="menu-icon" /> Laporan
              </span>
              <FontAwesomeIcon 
                icon={expanded.laporan ? faCaretDown : faCaretRight} 
                className="dropdown-icon" 
              />
            </div>
            {expanded.laporan && (
              <ul className="submenu">
                <li>
                  <NavLink to="/laporan/order/harian" className={({isActive}) => isActive ? 'active' : ''}>
                    Laporan Harian
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/laporan/order/bulanan" className={({isActive}) => isActive ? 'active' : ''}>
                    Laporan Bulanan
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/laporan/order/grafik" className={({isActive}) => isActive ? 'active' : ''}>
                    Grafik Omzet
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/laporan/produksi/mingguan" className={({isActive}) => isActive ? 'active' : ''}>
                    Laporan Produksi
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Tools - dengan dropdown */}
          <li className={expanded.tools ? 'expanded' : ''}>
            <div 
              className={`menu-item ${isActive('/tools') ? 'active' : ''}`} 
              onClick={() => toggleExpand('tools')}
            >
              <span>
                <FontAwesomeIcon icon={faTools} className="menu-icon" /> Tools
              </span>
              <FontAwesomeIcon 
                icon={expanded.tools ? faCaretDown : faCaretRight} 
                className="dropdown-icon" 
              />
            </div>
            {expanded.tools && (
              <ul className="submenu">
                <li>
                  <NavLink to="/tools/inventaris-gudang" className={({isActive}) => isActive ? 'active' : ''}>
                    Inventaris Gudang
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/tools/invoice-label-auto" className={({isActive}) => isActive ? 'active' : ''}>
                    Invoice & Label
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/tools/export-laporan" className={({isActive}) => isActive ? 'active' : ''}>
                    Export Laporan
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/tools/feedback-wa" className={({isActive}) => isActive ? 'active' : ''}>
                    Feedback Customer
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          
          {/* Notifikasi - dengan dropdown */}
          <li className={expanded.notifications ? 'expanded' : ''}>
            <div 
              className={`menu-item ${isActive('/notifications') ? 'active' : ''}`} 
              onClick={() => toggleExpand('notifications')}
            >
              <span>
                <FontAwesomeIcon icon={faBell} className="menu-icon" /> Notifikasi
              </span>
              <FontAwesomeIcon 
                icon={expanded.notifications ? faCaretDown : faCaretRight} 
                className="dropdown-icon" 
              />
            </div>
            {expanded.notifications && (
              <ul className="submenu">
                <li>
                  <NavLink to="/notifications/center" className={({isActive}) => isActive ? 'active' : ''}>
                    Pusat Notifikasi
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/notifications/templates" className={({isActive}) => isActive ? 'active' : ''}>
                    Template Notifikasi
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          {/* Menu lainnya yang seharusnya dilihat oleh owner */}
        </>
      );
    }
    
    // Kode untuk role lainnya...
    // Default menu untuk semua role
    return (
      <>
        <li>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? 'active' : ''}>
            <FontAwesomeIcon icon={faTachometerAlt} className="menu-icon" /> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/order-list" className={({isActive}) => isActive ? 'active' : ''}>
            <FontAwesomeIcon icon={faShoppingCart} className="menu-icon" /> Daftar Order
          </NavLink>
        </li>
        <li>
          <NavLink to="/notifications/center" className={({isActive}) => isActive ? 'active' : ''}>
            <FontAwesomeIcon icon={faBell} className="menu-icon" /> Notifikasi
          </NavLink>
        </li>
      </>
    );
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Rumah Akrilik</h3>
      </div>
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {renderMenuItems()}
        </ul>
      </nav>

      {/* Tampilkan user roles */}
      {userRoles.length > 0 && (
        <div className="user-roles">
          <small className="text-muted d-block mb-2">Peran Anda:</small>
          <div className="role-badges">
            {userRoles.map((role, idx) => (
              <span key={idx} className="badge bg-info me-1 mb-1">
                {formatRoleName(role)}
              </span>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

// Helper function to get user roles
const getUserRoles = () => {
  try {
    const rolesStr = localStorage.getItem('userRoles');
    if (!rolesStr) return [];
    
    const roles = JSON.parse(rolesStr);
    if (!Array.isArray(roles)) {
      return []; // Return empty array if not array
    }
    
    return roles.map(role => {
      if (typeof role === 'string') {
        return role;
      } else if (role && typeof role === 'object' && role.name) {
        return role.name;
      }
      return 'Unknown';
    });
  } catch (e) {
    console.error('Error parsing user roles:', e);
    return []; // Return empty array if error
  }
};

// Helper function to format role names
const formatRoleName = (roleName) => {
  if (typeof roleName !== 'string') return 'Unknown';
  return roleName.charAt(0).toUpperCase() + roleName.slice(1);
};

export default Sidebar;