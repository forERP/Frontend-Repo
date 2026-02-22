import api from '../lib/api';

export const fetchDashboardSummary = async () => {
  const response = await api.get('/api/dashboard/summary');
  return response.data;
};

export const fetchDashboardAlerts = async () => {
  const response = await api.get('/api/dashboard/alerts');
  return response.data;
};

export const fetchDashboardRecentOrders = async (limit = 10) => {
  const response = await api.get('/api/dashboard/recent-orders', {
    params: { limit },
  });
  return response.data;
};
