import axios from 'axios';
import createMockInterceptor, { DEMO_MODE } from './demoInterceptor';

/**
 * Axios instance configured for the LES ecommerce API.
 * Base URL: /api/v1
 * Automatically attaches JWT Bearer token from localStorage.
 */
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Demo mode interceptor (must be first to serve mock data)
createMockInterceptor(api);

// Request interceptor — attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle global errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;

      // Unauthorized — clear auth and redirect to login
      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_profile');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
