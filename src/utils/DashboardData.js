/**
 * This file provides emergency data for the Dashboard when API calls fail
 */

export const getEmergencyOrderData = () => {
  return {
    results: [
      {
        id: 1,
        order_number: 'ORD-2025-0001',
        customer: { name: 'PT Jaya Abadi' },
        order_date: '2025-01-15',
        calculated_total: 850000,
        status: { name: 'Baru' }
      },
      // Add more mock orders as needed
    ]
  };
};

export const getEmergencyDashboardStats = () => {
  return {
    totalOrders: 7,
    pendingOrders: 3,
    completedOrders: 4,
    totalRevenue: 3000000,
    orderStatusDistribution: [
      { name: 'Baru', value: 3 },
      { name: 'Produksi', value: 2 },
      { name: 'Selesai', value: 2 }
    ],
    monthlyRevenue: [
      { month: 'Jan', amount: 2500000 },
      { month: 'Feb', amount: 2800000 },
      { month: 'Mar', amount: 3200000 },
      { month: 'Apr', amount: 2900000 },
      { month: 'May', amount: 3000000 },
      { month: 'Jun', amount: 3100000 },
      { month: 'Jul', amount: 3500000 },
      { month: 'Aug', amount: 3700000 },
      { month: 'Sep', amount: 3600000 },
      { month: 'Oct', amount: 3400000 },
      { month: 'Nov', amount: 3800000 },
      { month: 'Dec', amount: 4000000 }
    ],
    recentOrders: [
      {
        id: 1,
        order_number: 'ORD-2025-0001',
        customer_name: 'PT Jaya Abadi',
        date: '2025-01-15',
        total: 850000,
        status: 'Baru'
      },
      {
        id: 2,
        order_number: 'ORD-2025-0002',
        customer_name: 'CV Maju Bersama',
        date: '2025-01-12',
        total: 1250000,
        status: 'Produksi'
      },
      {
        id: 3,
        order_number: 'ORD-2025-0003',
        customer_name: 'Toko Sejahtera',
        date: '2025-01-08',
        total: 500000,
        status: 'Selesai'
      }
    ]
  };
};