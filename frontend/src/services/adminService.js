import api from './api';
import logger from '@utils/logger';

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
    logger.logAdmin('CRIAR_LIVRO', { titulo: bookData.titulo });
    const response = await api.post('/admin/livros', bookData);
    logger.logAdmin('LIVRO_CRIADO', { livroId: response.data?.id, titulo: bookData.titulo });
    return response.data;
  },

  updateBook: async (bookId, bookData) => {
    logger.logAdmin('ATUALIZAR_LIVRO', { livroId, titulo: bookData.titulo });
    const response = await api.put(`/admin/livros/${bookId}`, bookData);
    logger.logAdmin('LIVRO_ATUALIZADO', { livroId });
    return response.data;
  },

  activateBook: async (bookId, payload) => {
    logger.logAdmin('ATIVAR_LIVRO', { livroId });
    const response = await api.patch(`/admin/livros/${bookId}/ativar`, payload);
    logger.logAdmin('LIVRO_ATIVADO', { livroId });
    return response.data;
  },

  deactivateBook: async (bookId, payload) => {
    logger.logAdmin('INATIVAR_LIVRO', { livroId });
    const response = await api.patch(`/admin/livros/${bookId}/inativar`, payload);
    logger.logAdmin('LIVRO_INATIVADO', { livroId });
    return response.data;
  },

  runAutomaticBookInactivation: async () => {
    logger.logAdmin('INATIVACAO_AUTOMATICA', { acao: 'executar' });
    const response = await api.post('/admin/livros/inativacao-automatica');
    return response.data.data;
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

  inactivateCustomer: async (customerId) => {
    const response = await api.patch(`/admin/clientes/${customerId}/inativar`);
    return response.data.data;
  },

  activateCustomer: async (customerId) => {
    const response = await api.patch(`/admin/clientes/${customerId}/ativar`);
    return response.data.data;
  },

  deleteCustomer: async (customerId) => {
    const response = await api.delete(`/admin/clientes/${customerId}`);
    return response.data.data;
  },

  // ── Stock ──────────────────────────────────────────────────────────────────
  getStockEntries: async (params = {}) => {
    const response = await api.get('/admin/estoque/entradas', { params });
    return response.data.data;
  },

  createStockEntry: async (entryData) => {
    logger.logAdmin('CRIAR_ENTRADA_ESTOQUE', { 
      livroId: entryData.livroId,
      quantidade: entryData.quantidade 
    });
    const response = await api.post('/admin/estoque/entradas', entryData);
    logger.logAdmin('ENTRADA_ESTOQUE_CRIADA', { livroId: entryData.livroId });
    return response.data;
  },

  // ── Analytics ────────────────────────────────────────────────────────────
  getSalesAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analise/vendas', { params });
    return response.data.data;
  },

  getRegionalSalesAnalytics: async (params = {}) => {
    const response = await api.get('/admin/analise/vendas-regiao', { params });
    return response.data.data;
  },

  // ── Reviews ────────────────────────────────────────────────────────────
  getReviews: async (params = {}) => {
    const response = await api.get('/admin/avaliacoes', { params });
    return response.data.data;
  },

  approveReview: async (reviewId) => {
    logger.logAdmin('APROVAR_AVALIACAO', { avaliacaoId: reviewId });
    const response = await api.patch(`/admin/avaliacoes/${reviewId}/aprovar`);
    logger.logAdmin('AVALIACAO_APROVADA', { avaliacaoId: reviewId });
    return response.data;
  },

  rejectReview: async (reviewId) => {
    logger.logAdmin('REJEITAR_AVALIACAO', { avaliacaoId: reviewId });
    const response = await api.patch(`/admin/avaliacoes/${reviewId}/rejeitar`);
    logger.logAdmin('AVALIACAO_REJEITADA', { avaliacaoId: reviewId });
    return response.data;
  },

  // ── Exchanges ────────────────────────────────────────────────────────────
  getExchanges: async (params = {}) => {
    const response = await api.get('/admin/trocas', { params });
    return response.data.data;
  },

  authorizeExchange: async (exchangeId) => {
    logger.logAdmin('AUTORIZAR_TROCA', { trocaId: exchangeId });
    const response = await api.patch(`/admin/trocas/${exchangeId}/autorizar`);
    logger.logAdmin('TROCA_AUTORIZADA', { trocaId: exchangeId });
    return response.data;
  },

  confirmExchangeReceipt: async (exchangeId, payload) => {
    logger.logAdmin('CONFIRMAR_RECEBIMENTO_TROCA', { trocaId: exchangeId });
    const response = await api.patch(`/admin/trocas/${exchangeId}/confirmar-recebimento`, payload);
    logger.logAdmin('RECEBIMENTO_CONFIRMADO', { trocaId: exchangeId });
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
