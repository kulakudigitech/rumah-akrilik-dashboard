import React from 'react';

const DashboardLayout = ({ children }) => (
  <div>
    <nav>Dashboard Nav</nav>
    <main>{children}</main>
  </div>
);

export default DashboardLayout;

