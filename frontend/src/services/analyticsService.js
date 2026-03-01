import api from './api';

/**
 * analyticsService — Admin dashboard and analytics API calls
 */
const analyticsService = {
  getSalesByPeriod: async (startDate, endDate) => {
    const response = await api.get('/admin/analytics/sales', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getSalesByRegion: async (params = {}) => {
    const response = await api.get('/admin/analytics/sales-by-region', { params });
    return response.data.data;
  },

  getStockStatus: async () => {
    const response = await api.get('/admin/analytics/stock');
    return response.data.data;
  },

  getTopBooks: async (limit = 10) => {
    const response = await api.get('/admin/analytics/top-books', { params: { limit } });
    return response.data.data;
  },
};

export default analyticsService;
