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
 * Handle mock API response for all demo mode requests
 */
const getMockResponse = (config) => {
  const url = config.url || '';
  const method = config.method || 'get';

  console.log('[DEMO MODE] Intercepting:', method.toUpperCase(), url);

  // ─── Auth Endpoints ────────────────────────────────────────────────────
  if (url.includes('/auth/login')) {
    return {
      data: {
        data: {
          token: 'demo-token-' + Date.now(),
          user: mockUser,
        },
      },
    };
  }

  if (url.includes('/auth/register')) {
    return {
      data: {
        data: {
          token: 'demo-token-' + Date.now(),
          user: mockUser,
        },
      },
    };
  }

  if (url.includes('/auth/logout')) {
    return { data: { success: true } };
  }

  if (url.includes('/auth/senha')) {
    return { data: { message: 'Senha alterada com sucesso' } };
  }

  // ─── Admin Books Endpoints ────────────────────────────────────────────
  if (url.includes('/admin/livros') && !url.includes('/ativar') && !url.includes('/inativar')) {
    if (method === 'get') {
      if (/\/admin\/livros\/\d+/.test(url)) {
        // GET single book
        const bookId = url.split('/').pop();
        const book = mockBooks.find((b) => b.id === bookId);
        return {
          data: { data: book || mockBooks[0] },
        };
      }

      // GET all admin books with pagination
      const page = config.params?.page || 0;
      const size = config.params?.size || 12;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        data: {
          data: mockBooks.slice(startIdx, endIdx),
          totalElements: mockBooks.length,
          totalPages: Math.ceil(mockBooks.length / size),
          currentPage: page,
          pageSize: size,
        },
      };
    }

    if (method === 'post') {
      return {
        data: {
          data: {
            id: Math.random().toString(36),
            ...config.data,
          },
        },
      };
    }

    if (method === 'put') {
      const bookId = url.split('/').pop();
      return {
        data: {
          data: {
            id: bookId,
            ...config.data,
          },
        },
      };
    }
  }

  // ─── Admin Book Activation/Deactivation ────────────────────────────────
  if (url.includes('/admin/livros/') && (url.includes('/ativar') || url.includes('/inativar'))) {
    return {
      data: { message: 'Status alterado com sucesso' },
    };
  }

  // ─── Admin Orders Endpoints ────────────────────────────────────────────
  if (url.includes('/admin/pedidos')) {
    if (method === 'get') {
      if (/\/admin\/pedidos\/\d+/.test(url)) {
        // GET single order
        const orderId = url.split('/').pop();
        const order = mockOrders.find((o) => o.id === orderId);
        return {
          data: { data: order || mockOrders[0] },
        };
      }

      // GET all admin orders with pagination
      const page = config.params?.page || 0;
      const size = config.params?.size || 20;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        data: {
          data: mockOrders.slice(startIdx, endIdx),
          totalElements: mockOrders.length,
          totalPages: Math.ceil(mockOrders.length / size),
          currentPage: page,
          pageSize: size,
        },
      };
    }

    if (method === 'patch') {
      // Dispatch or deliver order
      return {
        data: { message: 'Pedido atualizado com sucesso' },
      };
    }
  }

  // ─── Admin Analytics ───────────────────────────────────────────────────
  if (url.includes('/admin/analytics') || url.includes('/admin/dashboard')) {
    return {
      data: { data: mockAnalytics },
    };
  }

  // ─── Catalog Endpoints (Books) ────────────────────────────────────────
  if (url.includes('/livros') && !url.includes('/admin') && !url.includes('/avaliacoes')) {
    if (method === 'get') {
      if (/\/livros\/\d+$/.test(url)) {
        // GET single book
        const bookId = url.split('/').pop();
        const book = mockBooks.find((b) => b.id === bookId);
        return {
          data: { data: book || mockBooks[0] },
        };
      }

      // GET all books with pagination
      const page = config.params?.page || 0;
      const size = config.params?.size || 12;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        data: {
          data: mockBooks.slice(startIdx, endIdx),
          totalElements: mockBooks.length,
          totalPages: Math.ceil(mockBooks.length / size),
          currentPage: page,
          pageSize: size,
        },
      };
    }
  }

  // ─── Categories ───────────────────────────────────────────────────────
  if (url.includes('/catalogo/categorias')) {
    return {
      data: { data: mockCategories },
    };
  }

  // ─── Authors ───────────────────────────────────────────────────────────
  if (url.includes('/catalogo/autores')) {
    return {
      data: { data: mockAuthors },
    };
  }

  // ─── Publishers (editoras) ──────────────────────────────────────────────
  if (url.includes('/catalogo/editoras')) {
    return {
      data: { data: [{ id: '1', nome: 'Editora Demo' }] },
    };
  }

  // ─── Reviews ───────────────────────────────────────────────────────────
  if (url.includes('/avaliacoes')) {
    const bookId = url.split('/')[2];

    if (method === 'get') {
      return {
        data: { data: mockReviews[bookId] || [] },
      };
    }

    if (method === 'post') {
      return {
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
      };
    }
  }

  // ─── Orders (Customer) ────────────────────────────────────────────────
  if (url.includes('/pedidos') && !url.includes('/admin')) {
    if (method === 'get') {
      if (/\/pedidos\/\d+/.test(url)) {
        // GET single order
        const orderId = url.split('/').pop();
        const order = mockOrders.find((o) => o.id === orderId);
        return {
          data: { data: order || mockOrders[0] },
        };
      }

      // GET all customer orders with pagination
      const page = config.params?.page || 0;
      const size = config.params?.size || 20;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        data: {
          data: mockOrders.slice(startIdx, endIdx),
          totalElements: mockOrders.length,
          totalPages: Math.ceil(mockOrders.length / size),
          currentPage: page,
          pageSize: size,
        },
      };
    }

    if (method === 'post') {
      return {
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
      };
    }
  }

  // ─── Checkout ─────────────────────────────────────────────────────────
  if (url.includes('/checkout')) {
    return {
      data: {
        data: {
          id: Math.random().toString(36),
          numeroPedido: 'PED-' + Date.now(),
          status: 'SUCESSO',
          message: 'Pedido criado com sucesso em modo demo',
          orderId: Math.random().toString(36),
        },
      },
    };
  }

  // ─── Customer Profile ────────────────────────────────────────────────
  if (url.includes('/clientes/perfil') || url.includes('/clientes/me')) {
    if (method === 'get') {
      return {
        data: { data: mockUser },
      };
    }

    if (method === 'put') {
      return {
        data: { data: { ...mockUser, ...config.data } },
      };
    }
  }

  // ─── Addresses ────────────────────────────────────────────────────────
  if (url.includes('/enderecosEntrega') || url.includes('/enderecos')) {
    if (method === 'get') {
      return {
        data: { data: mockAddresses },
      };
    }

    if (method === 'post') {
      return {
        data: {
          data: {
            id: Math.random().toString(36),
            ...config.data,
          },
        },
      };
    }

    if (method === 'put') {
      const id = url.split('/').pop();
      return {
        data: {
          data: {
            id,
            ...config.data,
          },
        },
      };
    }

    if (method === 'delete') {
      return { data: { success: true } };
    }
  }

  // ─── Credit Cards ────────────────────────────────────────────────────
  if (url.includes('/cartoes')) {
    if (method === 'get') {
      return {
        data: { data: mockCreditCards },
      };
    }

    if (method === 'post') {
      return {
        data: {
          data: {
            id: Math.random().toString(36),
            ...config.data,
            numeroMascarado: '****-****-****-' + config.data?.numero?.slice(-4),
          },
        },
      };
    }

    if (method === 'delete') {
      return { data: { success: true } };
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────
  if (url.includes('/notificacoes')) {
    if (method === 'get') {
      return {
        data: { data: mockNotifications },
      };
    }

    if (method === 'put' || method === 'patch') {
      return {
        data: { success: true },
      };
    }
  }

  // ─── Pricing Groups ───────────────────────────────────────────────────
  if (url.includes('/grupos-precificacao')) {
    return {
      data: { data: [] },
    };
  }

  // ─── Fallback: Log and return empty ────────────────────────────────────
  console.warn('[DEMO MODE] No mock handler for:', method.toUpperCase(), url);
  return {
    data: { data: [] },
  };
};

/**
 * Create axios interceptor for demo mode
 * Intercepts ALL responses to serve mock data
 */
const createMockInterceptor = (axiosInstance) => {
  if (!DEMO_MODE) return;

  // Intercept ALL responses (success and error) to serve mock data
  axiosInstance.interceptors.response.use(
    (response) => {
      // Even successful responses get replaced with mock data
      const mockData = getMockResponse(response.config);
      return Promise.resolve({
        ...response,
        ...mockData,
        status: 200,
        statusText: 'OK',
      });
    },
    (error) => {
      // For errors, also serve mock data
      if (error.config) {
        const mockData = getMockResponse(error.config);
        return Promise.resolve({
          ...mockData,
          status: 200,
          statusText: 'OK',
          config: error.config,
        });
      }
      return Promise.reject(error);
    }
  );
};

export default createMockInterceptor;
export { DEMO_MODE };
