import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaShoppingCart, FaFileInvoice, FaIndustry, FaChartLine, FaTools, 
         FaBox, FaMoneyBillWave, FaTasks, FaList, FaCogs, FaBell, FaFileAlt } from 'react-icons/fa';
import './Sidebar.css'; // Import CSS file

const Sidebar = () => {
  const [expandedMenus, setExpandedMenus] = useState({
    keuangan: false,
    tools: false,
    laporan: false,
    produksi: false,
    notifications: false,
  });

  const toggleMenu = (menuName) => {
    setExpandedMenus({
      ...expandedMenus,
      [menuName]: !expandedMenus[menuName]
    });
  };

  return (
    <div className="menu">
      <ul className="menu-list">
        {/* Menu utama */}
        <li>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            <FaHome /> <span>Dashboard</span>
          </NavLink>
        </li>
        
        <li>
          <NavLink to="/order-list" className={({ isActive }) => isActive ? "active" : ""}>
            <FaShoppingCart /> <span>Daftar Order</span>
          </NavLink>
        </li>
        
        <li>
          <NavLink to="/form-input-order" className={({ isActive }) => isActive ? "active" : ""}>
            <FaFileInvoice /> <span>Input Order Baru</span>
          </NavLink>
        </li>
        
        {/* Menu Keuangan dengan submenu */}
        <li>
          <div className="menu-header" onClick={() => toggleMenu('keuangan')}>
            <div>
              <i className="icon fa fa-money-bill-wave"></i> <span>Keuangan</span>
            </div>
            <i className={`fa ${expandedMenus.keuangan ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          </div>
          
          {expandedMenus.keuangan && (
            <ul className="submenu">
              <li>
                <NavLink to="/keuangan/daftar-pembayaran" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Daftar Pembayaran</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard/admin-keuangan" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Dashboard Keuangan</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        
        {/* Menu Produksi */}
        <li>
          <div className="menu-header" onClick={() => toggleMenu('produksi')}>
            <div>
              <i className="icon fa fa-tasks"></i> <span>Produksi</span>
            </div>
            <i className={`fa ${expandedMenus.produksi ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          </div>
          
          {expandedMenus.produksi && (
            <ul className="submenu">
              <li>
                <NavLink to="/produksi" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaList /> <span>Daftar Order Produksi</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/produksi/stages" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaCogs /> <span>Konfigurasi Tahapan</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        
        {/* Menu Tools dengan submenu */}
        <li>
          <div className="menu-header" onClick={() => toggleMenu('tools')}>
            <div>
              <i className="icon fa fa-tools"></i> <span>Tools</span>
            </div>
            <i className={`fa ${expandedMenus.tools ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          </div>
          
          {expandedMenus.tools && (
            <ul className="submenu">
              <li>
                <NavLink to="/tools/inventaris-gudang" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Inventaris Gudang</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/tools/invoice-label-auto" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Invoice & Label</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/tools/export-laporan" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Export Laporan</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/tools/feedback-wa" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Feedback Customer</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        
        {/* Menu Laporan dengan submenu */}
        <li>
          <div className="menu-header" onClick={() => toggleMenu('laporan')}>
            <div>
              <i className="icon fa fa-chart-line"></i> <span>Laporan</span>
            </div>
            <i className={`fa ${expandedMenus.laporan ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          </div>
          
          {expandedMenus.laporan && (
            <ul className="submenu">
              <li>
                <NavLink to="/laporan/order/harian" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Laporan Harian</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/laporan/order/bulanan" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Laporan Bulanan</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/laporan/order/grafik" className={({ isActive }) => isActive ? "active" : ""}>
                  <span>Grafik Omzet</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        
        {/* Menu Notifications dengan submenu */}
        <li>
          <div className="menu-header" onClick={() => toggleMenu('notifications')}>
            <div>
              <i className="icon fa fa-bell"></i> <span>Notifications</span>
            </div>
            <i className={`fa ${expandedMenus.notifications ? 'fa-chevron-down' : 'fa-chevron-right'}`}></i>
          </div>
          
          {expandedMenus.notifications && (
            <ul className="submenu">
              <li>
                <NavLink to="/notifications/center" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaBell /> <span>Notification Center</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/notifications/templates" className={({ isActive }) => isActive ? "active" : ""}>
                  <FaFileAlt /> <span>Message Templates</span>
                </NavLink>
              </li>
            </ul>
          )}
        </li>
        
        <li>
          <NavLink to="/dashboard-analytics" className={({ isActive }) => isActive ? "active" : ""}>
            <FaChartLine /> <span>Dashboard Analytics</span>
          </NavLink>
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;