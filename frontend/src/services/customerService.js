import api from './api';
import logger from '@utils/logger';

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
    logger.logInfo('CLIENTE', 'Atualizando perfil', { 
      campos: Object.keys(profileData) 
    });
    const response = await api.put('/clientes/perfil', profileData);
    logger.logInfo('CLIENTE', 'Perfil atualizado com sucesso');
    return response.data.data;
  },

  getAddresses: async () => {
    const response = await api.get('/clientes/enderecos');
    return response.data.data;
  },

  addAddress: async (addressData) => {
    logger.logInfo('CLIENTE', 'Adicionando endereço', { 
      cep: addressData.cep,
      tipo: addressData.tipoResidencia 
    });
    const response = await api.post('/clientes/enderecos', addressData);
    logger.logInfo('CLIENTE', 'Endereço adicionado', { 
      enderecoId: response.data.data?.id 
    });
    return response.data.data;
  },

  updateAddress: async (addressId, addressData) => {
    logger.logInfo('CLIENTE', 'Atualizando endereço', { enderecoId });
    const response = await api.put(`/clientes/enderecos/${addressId}`, addressData);
    return response.data.data;
  },

  deleteAddress: async (addressId) => {
    logger.logInfo('CLIENTE', 'Removendo endereço', { enderecoId: addressId });
    const response = await api.delete(`/clientes/enderecos/${addressId}`);
    return response.data;
  },

  getCreditCards: async () => {
    const response = await api.get('/clientes/cartoes');
    const cards = Array.isArray(response.data.data) ? response.data.data : [];
    return cards.map(normalizeCreditCard);
  },

  addCreditCard: async (cardData) => {
    const ultimos4 = cardData.numero?.slice(-4) || '****';
    logger.logInfo('CLIENTE', 'Adicionando cartão', { 
      bandeira: cardData.bandeira,
      final: ultimos4 
    });
    const response = await api.post('/clientes/cartoes', cardData);
    logger.logInfo('CLIENTE', 'Cartão adicionado', { 
      cartaoId: response.data.data?.id 
    });
    return response.data.data;
  },

  updateCreditCard: async (cardId, cardData) => {
    logger.logInfo('CLIENTE', 'Atualizando cartão', { cartaoId: cardId });
    const response = await api.put(`/clientes/cartoes/${cardId}`, cardData);
    return response.data.data;
  },

  setPreferredCard: async (cardId) => {
    logger.logInfo('CLIENTE', 'Definindo cartão preferencial', { cartaoId: cardId });
    const response = await api.patch(`/clientes/cartoes/${cardId}/preferencial`);
    return response.data.data;
  },

  deleteCreditCard: async (cardId) => {
    logger.logInfo('CLIENTE', 'Removendo cartão', { cartaoId: cardId });
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
    logger.logInfo('CLIENTE', 'Solicitando troca', { 
      pedidoId: orderId,
      quantidadeItens: itens?.length 
    });
    const response = await api.post(`/pedidos/${orderId}/trocas`, { itens });
    logger.logInfo('CLIENTE', 'Troca solicitada com sucesso', { pedidoId: orderId });
    return response.data;
  },

  getCuponsTraoca: async () => {
    const response = await api.get('/clientes/cupons-troca');
    return response.data.data;
  },
};

export default customerService;
