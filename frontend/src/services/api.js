import axios from 'axios';
import logger from '@utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * Axios instance configured for the LES ecommerce API.
 * Base URL: /api/v1
 * Automatically attaches JWT Bearer token from localStorage.
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT Bearer token and log request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Adicionar timestamp para calcular duração
    config.metadata = { startTime: Date.now() };
    
    // Log da requisição (sem dados sensíveis)
    logger.logRequest(config.method, config.url, config.data);
    
    return config;
  },
  (error) => {
    logger.logError('REQUEST', 'Erro ao preparar requisição', null, error);
    return Promise.reject(error);
  }
);

// Response interceptor — handle global errors and log responses
api.interceptors.response.use(
  (response) => {
    // Calcular duração da requisição
    const duration = response.config.metadata 
      ? Date.now() - response.config.metadata.startTime 
      : null;
    
    // Log da resposta bem-sucedida
    logger.logResponse(response.config.method, response.config.url, response.status, duration);
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata 
      ? Date.now() - error.config.metadata.startTime 
      : null;
    
    if (error.response) {
      const { status } = error.response;

      // Log do erro HTTP
      logger.logError(
        error.config.method,
        error.config.url,
        status,
        error.response.data?.message || error.message,
        duration
      );

      // Unauthorized — clear auth and redirect to login
      if (status === 401) {
        logger.logAuth('LOGOUT_AUTO', { motivo: 'Token expirado ou inválido (401)' });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Erro de rede (sem resposta do servidor)
      logger.logError(
        error.config?.method || 'UNKNOWN',
        error.config?.url || 'UNKNOWN',
        'NETWORK_ERROR',
        'Falha de rede - servidor não respondeu',
        duration
      );
    } else {
      // Erro ao configurar a requisição
      logger.logError('REQUEST', 'Erro desconhecido', null, error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
