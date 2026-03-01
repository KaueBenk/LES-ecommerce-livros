import api from './api';

/**
 * catalogService — Book catalog API calls
 */
const catalogService = {
  getBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data.data;
  },

  getBook: async (bookId) => {
    const response = await api.get(`/books/${bookId}`);
    return response.data.data;
  },

  searchBooks: async (query, filters = {}) => {
    const response = await api.get('/books/search', { params: { q: query, ...filters } });
    return response.data.data;
  },

  getCategories: async () => {
    const response = await api.get('/books/categories');
    return response.data.data;
  },

  getFeatured: async () => {
    const response = await api.get('/books/featured');
    return response.data.data;
  },

  getReviews: async (bookId, page = 0, size = 10) => {
    const response = await api.get(`/books/${bookId}/reviews`, { params: { page, size } });
    return response.data.data;
  },

  submitReview: async (bookId, reviewData) => {
    const response = await api.post(`/books/${bookId}/reviews`, reviewData);
    return response.data.data;
  },
};

export default catalogService;
