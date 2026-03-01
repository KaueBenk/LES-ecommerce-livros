import api from './api';

/**
 * cartService — Cart and inventory lock API calls
 */
const cartService = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data.data;
  },

  addItem: async (bookId, quantity) => {
    const response = await api.post('/cart/items', { livrId: bookId, quantidade: quantity });
    return response.data.data;
  },

  updateItem: async (bookId, quantity) => {
    const response = await api.put(`/cart/items/${bookId}`, { quantidade: quantity });
    return response.data.data;
  },

  removeItem: async (bookId) => {
    const response = await api.delete(`/cart/items/${bookId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};

export default cartService;
