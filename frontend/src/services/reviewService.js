import api from './api';

/**
 * reviewService — Book review API calls
 */
const reviewService = {
  getReviews: async (bookId, params = {}) => {
    const response = await api.get(`/books/${bookId}/reviews`, { params });
    return response.data.data;
  },

  submitReview: async (bookId, reviewData) => {
    const response = await api.post(`/books/${bookId}/reviews`, reviewData);
    return response.data.data;
  },

  getPendingReviews: async (params = {}) => {
    const response = await api.get('/admin/reviews/pending', { params });
    return response.data.data;
  },

  approveReview: async (reviewId) => {
    const response = await api.put(`/admin/reviews/${reviewId}/approve`);
    return response.data;
  },

  rejectReview: async (reviewId, reason) => {
    const response = await api.put(`/admin/reviews/${reviewId}/reject`, { reason });
    return response.data;
  },
};

export default reviewService;
