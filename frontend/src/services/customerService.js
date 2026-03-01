import api from './api';

/**
 * customerService — Customer profile and account API calls
 */
const customerService = {
  getProfile: async () => {
    const response = await api.get('/clientes/perfil');
    return response.data.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/clientes/perfil', profileData);
    return response.data.data;
  },

  getAddresses: async () => {
    const response = await api.get('/clientes/enderecos');
    return response.data.data;
  },

  addAddress: async (addressData) => {
    const response = await api.post('/clientes/enderecos', addressData);
    return response.data.data;
  },

  updateAddress: async (addressId, addressData) => {
    const response = await api.put(`/clientes/enderecos/${addressId}`, addressData);
    return response.data.data;
  },

  deleteAddress: async (addressId) => {
    const response = await api.delete(`/clientes/enderecos/${addressId}`);
    return response.data;
  },

  getCreditCards: async () => {
    const response = await api.get('/clientes/cartoes');
    return response.data.data;
  },

  addCreditCard: async (cardData) => {
    const response = await api.post('/clientes/cartoes', cardData);
    return response.data.data;
  },

  updateCreditCard: async (cardId, cardData) => {
    const response = await api.put(`/clientes/cartoes/${cardId}`, cardData);
    return response.data.data;
  },

  setPreferredCard: async (cardId) => {
    const response = await api.patch(`/clientes/cartoes/${cardId}/preferencial`);
    return response.data.data;
  },

  deleteCreditCard: async (cardId) => {
    const response = await api.delete(`/clientes/cartoes/${cardId}`);
    return response.data;
  },

  getOrders: async (page = 0, size = 10) => {
    const response = await api.get('/vendas/minhas', { params: { page, size } });
    return response.data.data;
  },
};

export default customerService;

