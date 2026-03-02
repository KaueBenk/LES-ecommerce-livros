import api from './api';

/**
 * reviewService — Book review API calls
 */
const reviewService = {
  getReviews: async (bookId, params = {}) => {
    const response = await api.get(`/livros/${bookId}/avaliacoes`, { params });
    return response.data.data;
  },

  submitReview: async (bookId, reviewData) => {
    const response = await api.post(`/livros/${bookId}/avaliacoes`, reviewData);
    return response.data;
  },

  getPendingReviews: async (params = {}) => {
    const response = await api.get('/admin/avaliacoes/pendentes', { params });
    return response.data.data;
  },

  approveReview: async (reviewId) => {
    const response = await api.put(`/admin/avaliacoes/${reviewId}/aprovar`);
    return response.data;
  },

  rejectReview: async (reviewId, reason) => {
    const response = await api.put(`/admin/avaliacoes/${reviewId}/rejeitar`, { reason });
    return response.data;
  },
};

export default reviewService;
