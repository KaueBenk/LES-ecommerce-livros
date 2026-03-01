import api from './api';

/**
 * authService — Authentication API calls
 */
const authService = {
  /**
   * Login with email and password.
   * @param {string} email
   * @param {string} senha
   * @returns {Promise<{token: string, user: Object}>}
   */
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data.data;
  },

  /**
   * Register a new customer.
   * @param {Object} customerData
   * @returns {Promise<Object>}
   */
  register: async (customerData) => {
    const response = await api.post('/auth/register', customerData);
    return response.data.data;
  },

  /**
   * Change password (authenticated).
   * @param {string} senhaAtual
   * @param {string} novaSenha
   * @returns {Promise<Object>}
   */
  changePassword: async (senhaAtual, novaSenha, confirmacaoSenha) => {
    const response = await api.put('/auth/senha', { senhaAtual, novaSenha, confirmacaoSenha });
    return response.data;
  },

  /**
   * Logout (server-side invalidation if needed).
   * @returns {Promise<void>}
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (_error) {
      // Ignore server errors on logout
    }
  },
};

export default authService;
