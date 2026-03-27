import api from './api';
import logger from '@utils/logger';

/**
 * cartService — Cart and inventory lock API calls
 */
const cartService = {
  getCart: async () => {
    logger.logCart('GET_CART_SERVICE');
    const response = await api.get('/carrinho');
    logger.logCart('GET_CART_SUCCESS', { 
      totalItens: response.data.data?.itens?.length || 0 
    });
    return response.data.data;
  },

  addItem: async (livroId, quantity) => {
    logger.logCart('ADD_ITEM_SERVICE', { livroId, quantidade: quantity });
    const response = await api.post('/carrinho/itens', { livroId, quantidade: quantity });
    logger.logCart('ADD_ITEM_SERVICE_SUCCESS', { livroId, quantidade: quantity });
    return response.data.data;
  },

  updateItem: async (itemId, quantity) => {
    logger.logCart('UPDATE_ITEM_SERVICE', { itemId, quantidade: quantity });
    const response = await api.put(`/carrinho/itens/${itemId}`, { quantidade: quantity });
    logger.logCart('UPDATE_ITEM_SERVICE_SUCCESS', { itemId });
    return response.data.data;
  },

  removeItem: async (itemId) => {
    logger.logCart('REMOVE_ITEM_SERVICE', { itemId });
    const response = await api.delete(`/carrinho/itens/${itemId}`);
    logger.logCart('REMOVE_ITEM_SERVICE_SUCCESS', { itemId });
    return response.data;
  },

  clearCart: async () => {
    logger.logCart('CLEAR_CART_SERVICE');
    const response = await api.delete('/carrinho');
    logger.logCart('CLEAR_CART_SUCCESS');
    return response.data;
  },
};

export default cartService;

