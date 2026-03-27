import api from './api';
import logger from '@utils/logger';

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
    logger.logAuth('LOGIN_SERVICE_START', { email });
    const response = await api.post('/auth/login', { email, senha });
    const data = response.data.data;
    const role = data.role?.startsWith('ROLE_') ? data.role.replace('ROLE_', '') : data.role;
    const userData = {
      token: data.token,
      user: {
        id: data.id,
        nome: data.nome,
        email: data.email,
        cpf: data.cpf,
        ranking: data.ranking,
        role,
        roles: role ? [role] : [],
      },
    };
    logger.logAuth('LOGIN_SERVICE_SUCCESS', { email: data.email, role });
    return userData;
  },

  /**
   * Register a new customer.
   * @param {Object} customerData
   * @returns {Promise<Object>}
   */
  register: async (customerData) => {
    logger.logAuth('REGISTER_SERVICE_START', { email: customerData.email });
    const response = await api.post('/auth/register', customerData);
    logger.logAuth('REGISTER_SERVICE_SUCCESS', { email: customerData.email });
    return response.data.data;
  },

  /**
   * Change password (authenticated).
   * @param {string} senhaAtual
   * @param {string} novaSenha
   * @returns {Promise<Object>}
   */
  changePassword: async (senhaAtual, novaSenha, confirmacaoSenha) => {
    logger.logAuth('CHANGE_PASSWORD_START');
    const response = await api.put('/auth/senha', { senhaAtual, novaSenha, confirmacaoSenha });
    logger.logAuth('CHANGE_PASSWORD_SUCCESS');
    return response.data;
  },

  /**
   * Logout (server-side invalidation if needed).
   * @returns {Promise<void>}
   */
  logout: async () => {
    logger.logAuth('LOGOUT_SERVICE_START');
    try {
      await api.post('/auth/logout');
      logger.logAuth('LOGOUT_SERVICE_SUCCESS');
    } catch (error) {
      logger.logWarn('AUTH', 'Erro ao fazer logout no servidor (ignorado)', { 
        erro: error.message 
      });
    }
  },
};

export default authService;
