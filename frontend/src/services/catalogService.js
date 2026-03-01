import api from './api';

/**
 * catalogService — Book catalog API calls
 */
const catalogService = {
  getBooks: async (params = {}) => {
    const response = await api.get('/livros', { params });
    return response.data.data;
  },

  getBook: async (bookId) => {
    const response = await api.get(`/livros/${bookId}`);
    return response.data.data;
  },

  searchBooks: async (query, filters = {}) => {
    const response = await api.get('/livros', { params: { titulo: query, ...filters } });
    return response.data.data;
  },

  getBook: async (bookId) => {
    const response = await api.get(`/livros/${bookId}`);
    return response.data.data;
  },

  getCategories: async () => {
    const response = await api.get('/catalogo/categorias');
    return response.data.data;
  },

  getAuthors: async () => {
    const response = await api.get('/catalogo/autores');
    return response.data.data;
  },

  getReviews: async (bookId, page = 0, size = 10) => {
    const response = await api.get(`/livros/${bookId}/avaliacoes`, { params: { page, size } });
    return response.data.data;
  },

  submitReview: async (bookId, reviewData) => {
    const response = await api.post(`/livros/${bookId}/avaliacoes`, reviewData);
    return response.data.data;
  },
};

export default catalogService;

