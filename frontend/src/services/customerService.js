import api from './api';

const BRAND_NAME_BY_CODE = {
  VISA: 'Visa',
  MASTERCARD: 'MasterCard',
  ELO: 'Elo',
  AMEX: 'American Express',
};

const BRAND_CODE_BY_NAME = {
  VISA: 'VISA',
  MASTERCARD: 'MASTERCARD',
  ELO: 'ELO',
  AMERICAN_EXPRESS: 'AMEX',
  AMEX: 'AMEX',
};

const normalizeBrandCode = (bandeira) => {
  if (!bandeira) return '';
  const rawName = typeof bandeira === 'string' ? bandeira : bandeira?.nome;
  if (!rawName) return '';
  const key = rawName.toUpperCase().replace(/\s+/g, '_');
  return BRAND_CODE_BY_NAME[key] || key;
};

const normalizeBrandName = (bandeira) => {
  if (!bandeira) return '';
  if (typeof bandeira === 'string') {
    return BRAND_NAME_BY_CODE[bandeira] || bandeira;
  }
  return bandeira.nome || '';
};

const normalizeCreditCard = (card) => {
  const numero = card?.numero ? String(card.numero) : '';
  return {
    ...card,
    numero,
    ultimosDigitos: numero.replace(/\D/g, '').slice(-4),
    bandeira: normalizeBrandCode(card?.bandeira),
    bandeiraNome: normalizeBrandName(card?.bandeira),
  };
};

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
    const cards = Array.isArray(response.data.data) ? response.data.data : [];
    return cards.map(normalizeCreditCard);
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

  getTransactions: async (page = 0, size = 20, sort = 'dataPedido,desc') => {
    const response = await api.get('/clientes/transacoes', { params: { page, size, sort } });
    const data = response.data.data || {};
    return {
      ...data,
      content: Array.isArray(data.content) ? data.content : [],
    };
  },

  requestExchange: async (orderId, itens) => {
    const response = await api.post(`/pedidos/${orderId}/trocas`, { itens });
    return response.data;
  },

  getCuponsTraoca: async () => {
    const response = await api.get('/clientes/cupons-troca');
    return response.data.data;
  },
};

export default customerService;
