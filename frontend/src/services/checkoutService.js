import api from './api';
import logger from '@utils/logger';

/**
 * checkoutService — Checkout and order API calls
 */
const checkoutService = {
  calculateShipping: async (enderecoId) => {
    logger.logCheckout('CALCULAR_FRETE', { enderecoId });
    const response = await api.post('/checkout/frete', { enderecoId });
    logger.logCheckout('FRETE_CALCULADO', { 
      enderecoId, 
      valorFrete: response.data.data?.valorFrete 
    });
    return response.data.data;
  },

  validateCoupons: async (couponData) => {
    logger.logCheckout('VALIDAR_CUPONS', { 
      cupons: couponData?.cupons?.map(c => c.codigo) 
    });
    const response = await api.post('/checkout/validar-cupons', couponData);
    logger.logCheckout('CUPONS_VALIDADOS', { 
      resultado: response.data.data 
    });
    return response.data.data;
  },

  finalizeOrder: async (orderData) => {
    logger.logCheckout('FINALIZAR_PEDIDO', { 
      enderecoId: orderData.enderecoId,
      formasPagamento: orderData.formasPagamento?.map(fp => fp.tipo),
      valorTotal: orderData.valorTotal
    });
    const response = await api.post('/checkout/finalizar', orderData);
    logger.logCheckout('PEDIDO_FINALIZADO', { 
      pedidoId: response.data.data?.pedidoId,
      valorTotal: response.data.data?.valorTotal,
      status: response.data.data?.status
    });
    return response.data.data;
  },

  getShippingOptions: async (addressId) => {
    const response = await api.get('/checkout/shipping', { params: { addressId } });
    return response.data.data;
  },

  applyCoupon: async (couponCode) => {
    logger.logCheckout('APLICAR_CUPOM', { codigo: couponCode });
    const response = await api.post('/checkout/coupons', { codigo: couponCode });
    logger.logCheckout('CUPOM_APLICADO', { 
      codigo: couponCode,
      desconto: response.data.data?.desconto 
    });
    return response.data.data;
  },

  removeCoupon: async (couponCode) => {
    logger.logCheckout('REMOVER_CUPOM', { codigo: couponCode });
    const response = await api.delete(`/checkout/coupons/${couponCode}`);
    return response.data;
  },

  createOrder: async (orderData) => {
    logger.logCheckout('CRIAR_PEDIDO', { 
      valorTotal: orderData.valorTotal 
    });
    const response = await api.post('/orders', orderData);
    return response.data.data;
  },

  getOrder: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  },
};

export default checkoutService;
