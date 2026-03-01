import api from './api';

/**
 * checkoutService — Checkout and order API calls
 */
const checkoutService = {
  calculateShipping: async (enderecoId) => {
    const response = await api.post('/checkout/frete', { enderecoId });
    return response.data.data;
  },

  validateCoupons: async (couponData) => {
    const response = await api.post('/checkout/validar-cupons', couponData);
    return response.data.data;
  },

  finalizeOrder: async (orderData) => {
    const response = await api.post('/checkout/finalizar', orderData);
    return response.data.data;
  },

  getShippingOptions: async (addressId) => {
    const response = await api.get('/checkout/shipping', { params: { addressId } });
    return response.data.data;
  },

  applyCoupon: async (couponCode) => {
    const response = await api.post('/checkout/coupons', { codigo: couponCode });
    return response.data.data;
  },

  removeCoupon: async (couponCode) => {
    const response = await api.delete(`/checkout/coupons/${couponCode}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  },
};

export default checkoutService;
