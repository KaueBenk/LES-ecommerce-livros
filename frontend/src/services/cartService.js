import api from './api';

/**
 * cartService — Cart and inventory lock API calls
 */
const cartService = {
  getCart: async () => {
    const response = await api.get('/carrinho');
    return response.data.data;
  },

  addItem: async (livroId, quantity) => {
    const response = await api.post('/carrinho/itens', { livroId, quantidade: quantity });
    return response.data.data;
  },

  updateItem: async (itemId, quantity) => {
    const response = await api.put(`/carrinho/itens/${itemId}`, { quantidade: quantity });
    return response.data.data;
  },

  removeItem: async (itemId) => {
    const response = await api.delete(`/carrinho/itens/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/carrinho');
    return response.data;
  },
};

export default cartService;

