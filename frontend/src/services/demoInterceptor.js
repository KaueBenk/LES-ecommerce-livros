/**
 * Demo mode interceptor - Replaces API calls with mock data
 */

import {
  mockUser,
  mockBooks,
  mockCategories,
  mockAuthors,
  mockOrders,
  mockReviews,
  mockAddresses,
  mockCreditCards,
  mockAnalytics,
  mockNotifications,
} from './mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Mock API service that intercepts calls and returns mock data
 */
const createMockInterceptor = (axiosInstance) => {
  if (!DEMO_MODE) return;

  axiosInstance.interceptors.request.use((config) => {
    // Override baseURL to prevent actual API calls
    config.baseURL = '';
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      // Intercept all 404s and network errors in demo mode
      if (DEMO_MODE && (!error.response || error.response.status === 404)) {
        const { config } = error;
        const url = config.url || '';

        // Auth endpoints
        if (url.includes('/auth/login')) {
          return Promise.resolve({
            data: {
              data: {
                token: 'demo-token-' + Date.now(),
                user: mockUser,
              },
            },
          });
        }

        if (url.includes('/auth/register')) {
          return Promise.resolve({
            data: {
              data: {
                token: 'demo-token-' + Date.now(),
                user: mockUser,
              },
            },
          });
        }

        if (url.includes('/auth/logout')) {
          return Promise.resolve({ data: { success: true } });
        }

        if (url.includes('/auth/senha')) {
          return Promise.resolve({ data: { message: 'Senha alterada com sucesso' } });
        }

        // Catalog endpoints
        if (url.includes('/livros') && !url.includes('/avaliacoes')) {
          // GET single book
          if (config.method === 'get' && /\/livros\/\d+$/.test(url)) {
            const bookId = url.split('/').pop();
            const book = mockBooks.find((b) => b.id === bookId);
            return Promise.resolve({
              data: { data: book || mockBooks[0] },
            });
          }

          // GET all books with pagination
          if (config.method === 'get') {
            const page = config.params?.page || 0;
            const size = config.params?.size || 12;
            const startIdx = page * size;
            const endIdx = startIdx + size;

            return Promise.resolve({
              data: {
                data: mockBooks.slice(startIdx, endIdx),
                totalElements: mockBooks.length,
                totalPages: Math.ceil(mockBooks.length / size),
                currentPage: page,
                pageSize: size,
              },
            });
          }
        }

        // Categories
        if (url.includes('/catalogo/categorias')) {
          return Promise.resolve({
            data: { data: mockCategories },
          });
        }

        // Authors
        if (url.includes('/catalogo/autores')) {
          return Promise.resolve({
            data: { data: mockAuthors },
          });
        }

        // Reviews
        if (url.includes('/avaliacoes')) {
          const bookId = url.split('/')[2];

          // GET reviews
          if (config.method === 'get') {
            return Promise.resolve({
              data: { data: mockReviews[bookId] || [] },
            });
          }

          // POST review
          if (config.method === 'post') {
            return Promise.resolve({
              data: {
                data: {
                  id: Math.random().toString(36),
                  livroId: bookId,
                  usuarioId: '1',
                  nomeUsuario: mockUser.nome,
                  ...config.data,
                  data: new Date().toISOString().split('T')[0],
                },
              },
            });
          }
        }

        // Orders
        if (url.includes('/pedidos')) {
          // GET all orders
          if (config.method === 'get' && !url.includes('/pedidos/')) {
            return Promise.resolve({
              data: { data: mockOrders },
            });
          }

          // GET single order
          if (config.method === 'get') {
            const orderId = url.split('/').pop();
            const order = mockOrders.find((o) => o.id === orderId);
            return Promise.resolve({
              data: { data: order || mockOrders[0] },
            });
          }

          // POST new order
          if (config.method === 'post') {
            return Promise.resolve({
              data: {
                data: {
                  id: Math.random().toString(36),
                  numeroPedido: 'PED-' + Date.now(),
                  data: new Date().toISOString().split('T')[0],
                  status: 'CONFIRMADO',
                  total: config.data?.total || 0,
                  itens: config.data?.itens || [],
                },
              },
            });
          }
        }

        // Checkout
        if (url.includes('/checkout')) {
          return Promise.resolve({
            data: {
              data: {
                id: Math.random().toString(36),
                status: 'SUCESSO',
                message: 'Pedido criado com sucesso em modo demo',
              },
            },
          });
        }

        // Customer profile
        if (url.includes('/clientes/perfil')) {
          if (config.method === 'get') {
            return Promise.resolve({
              data: { data: mockUser },
            });
          }

          if (config.method === 'put') {
            return Promise.resolve({
              data: { data: { ...mockUser, ...config.data } },
            });
          }
        }

        // Addresses
        if (url.includes('/enderecosEntrega')) {
          if (config.method === 'get') {
            return Promise.resolve({
              data: { data: mockAddresses },
            });
          }

          if (config.method === 'post') {
            return Promise.resolve({
              data: {
                data: {
                  id: Math.random().toString(36),
                  ...config.data,
                },
              },
            });
          }

          if (config.method === 'put') {
            const id = url.split('/').pop();
            return Promise.resolve({
              data: {
                data: {
                  id,
                  ...config.data,
                },
              },
            });
          }

          if (config.method === 'delete') {
            return Promise.resolve({ data: { success: true } });
          }
        }

        // Credit cards
        if (url.includes('/cartoes')) {
          if (config.method === 'get') {
            return Promise.resolve({
              data: { data: mockCreditCards },
            });
          }

          if (config.method === 'post') {
            return Promise.resolve({
              data: {
                data: {
                  id: Math.random().toString(36),
                  ...config.data,
                  numeroMascarado: '****-****-****-' + config.data?.numero?.slice(-4),
                },
              },
            });
          }

          if (config.method === 'delete') {
            return Promise.resolve({ data: { success: true } });
          }
        }

        // Analytics
        if (url.includes('/admin/analytics') || url.includes('/admin/dashboard')) {
          return Promise.resolve({
            data: { data: mockAnalytics },
          });
        }

        // Notifications
        if (url.includes('/notificacoes')) {
          if (config.method === 'get') {
            return Promise.resolve({
              data: { data: mockNotifications },
            });
          }
        }

        // Default: reject with original error
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};

export default createMockInterceptor;
export { DEMO_MODE };
