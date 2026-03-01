import api from './api';

/**
 * adminService — Admin backoffice API calls
 */
const adminService = {
  // ── Books ──────────────────────────────────────────────────────────────────
  getBooks: async (params = {}) => {
    const response = await api.get('/admin/livros', { params });
    return response.data.data;
  },

  getBook: async (bookId) => {
    const response = await api.get(`/livros/${bookId}`);
    return response.data.data;
  },

  createBook: async (bookData) => {
    const response = await api.post('/admin/livros', bookData);
    return response.data;
  },

  updateBook: async (bookId, bookData) => {
    const response = await api.put(`/admin/livros/${bookId}`, bookData);
    return response.data;
  },

  activateBook: async (bookId, payload) => {
    const response = await api.patch(`/admin/livros/${bookId}/ativar`, payload);
    return response.data;
  },

  deactivateBook: async (bookId, payload) => {
    const response = await api.patch(`/admin/livros/${bookId}/inativar`, payload);
    return response.data;
  },

  // ── Catalog reference data ─────────────────────────────────────────────────
  getAuthors: async () => {
    const response = await api.get('/catalogo/autores');
    return response.data.data;
  },

  getPublishers: async () => {
    const response = await api.get('/catalogo/editoras');
    return response.data.data;
  },

  getCategories: async () => {
    const response = await api.get('/catalogo/categorias');
    return response.data.data;
  },

  /**
   * Pricing groups — no dedicated endpoint in the API contract.
   * Falls back to a local stub if the endpoint doesn't exist.
   */
  getPricingGroups: async () => {
    try {
      const response = await api.get('/admin/grupos-precificacao');
      return response.data.data;
    } catch {
      // Return empty list if endpoint not available
      return [];
    }
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  getOrders: async (params = {}) => {
    const response = await api.get('/admin/pedidos', { params });
    return response.data.data;
  },

  dispatchOrder: async (orderId) => {
    const response = await api.patch(`/admin/pedidos/${orderId}/despachar`);
    return response.data;
  },

  deliverOrder: async (orderId) => {
    const response = await api.patch(`/admin/pedidos/${orderId}/entregar`);
    return response.data;
  },

  // ── Customers ──────────────────────────────────────────────────────────────
  getCustomers: async (params = {}) => {
    const response = await api.get('/admin/clientes', { params });
    return response.data.data;
  },

  getCustomer: async (customerId) => {
    const response = await api.get(`/admin/clientes/${customerId}`);
    return response.data.data;
  },

  // ── Stock ──────────────────────────────────────────────────────────────────
  getStockEntries: async (params = {}) => {
    const response = await api.get('/admin/estoque/entradas', { params });
    return response.data.data;
  },

  createStockEntry: async (entryData) => {
    const response = await api.post('/admin/estoque/entradas', entryData);
    return response.data;
  },

  /**
   * Suppliers — no dedicated listing endpoint in the API contract.
   * Falls back to an empty array if the endpoint doesn't exist.
   */
  getSuppliers: async () => {
    try {
      const response = await api.get('/admin/fornecedores');
      return response.data.data;
    } catch {
      return [];
    }
  },
};

export default adminService;
