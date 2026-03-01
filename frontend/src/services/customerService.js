import api from './api';

/**
 * customerService — Customer profile and account API calls
 */
const customerService = {
  getProfile: async () => {
    const response = await api.get('/customers/me');
    return response.data.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/customers/me', profileData);
    return response.data.data;
  },

  getAddresses: async () => {
    const response = await api.get('/customers/me/addresses');
    return response.data.data;
  },

  addAddress: async (addressData) => {
    const response = await api.post('/customers/me/addresses', addressData);
    return response.data.data;
  },

  updateAddress: async (addressId, addressData) => {
    const response = await api.put(`/customers/me/addresses/${addressId}`, addressData);
    return response.data.data;
  },

  deleteAddress: async (addressId) => {
    const response = await api.delete(`/customers/me/addresses/${addressId}`);
    return response.data;
  },

  getCreditCards: async () => {
    const response = await api.get('/customers/me/credit-cards');
    return response.data.data;
  },

  addCreditCard: async (cardData) => {
    const response = await api.post('/customers/me/credit-cards', cardData);
    return response.data.data;
  },

  deleteCreditCard: async (cardId) => {
    const response = await api.delete(`/customers/me/credit-cards/${cardId}`);
    return response.data;
  },

  getOrders: async (page = 0, size = 10) => {
    const response = await api.get('/customers/me/orders', { params: { page, size } });
    return response.data.data;
  },
};

export default customerService;
