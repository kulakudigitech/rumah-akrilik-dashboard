/**
 * Emergency fallback data for dashboard when API is unavailable
 * This will ensure the dashboard always renders something useful
 */

export const getEmergencyDashboardData = () => {
  return {
    totalOrders: {
      count: localStorage.getItem('emergency_total_orders') || 0,
      percentage: 0
    },
    revenue: {
      amount: localStorage.getItem('emergency_total_revenue') || 0,
      percentage: 0
    },
    completedOrders: {
      count: localStorage.getItem('emergency_completed_orders') || 0,
      percentage: 0
    },
    pendingOrders: {
      count: localStorage.getItem('emergency_pending_orders') || 0,
      percentage: 0
    },
    revenueData: [
      { month: 'Jan', amount: 0 },
      { month: 'Feb', amount: 0 },
      { month: 'Mar', amount: 0 },
      { month: 'Apr', amount: 0 },
      { month: 'May', amount: 0 },
      { month: 'Jun', amount: 0 },
      { month: 'Jul', amount: 0 },
      { month: 'Aug', amount: 0 },
      { month: 'Sep', amount: 0 },
      { month: 'Oct', amount: 0 },
      { month: 'Nov', amount: 0 },
      { month: 'Dec', amount: 0 }
    ],
    orderStatusDistribution: [
      { name: 'Pending', value: 0 },
      { name: 'In Progress', value: 0 },
      { name: 'Completed', value: 0 },
      { name: 'Cancelled', value: 0 }
    ],
    recentOrders: Array(5).fill({
      id: 'emergency-data',
      order_number: '(Data not available)',
      customer: {
        name: 'System unavailable',
        phone: '---'
      },
      total_amount: 0,
      status: 'unknown',
      created_at: new Date().toISOString()
    })
  };
};