/**
 * Demo mode interceptor - Replaces API calls with mock data
 * Strategy: Use a custom adapter for axios that serves mock data instead of making real requests
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
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
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
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: {
        data: {
          token: 'demo-token-' + Date.now(),
          user: mockUser,
        },
      },
    };
  }

  if (url.includes('/auth/logout')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { success: true },
    };
  }

  if (url.includes('/auth/senha')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { message: 'Senha alterada com sucesso' },
    };
  }

  // ─── Admin Books Endpoints ────────────────────────────────────────────
  if (url.includes('/admin/livros') && !url.includes('/ativar') && !url.includes('/inativar')) {
    if (method === 'get') {
      if (/\/admin\/livros\/\d+/.test(url)) {
        const bookId = url.split('/').pop();
        const book = mockBooks.find((b) => b.id === bookId);
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { data: book || mockBooks[0] },
        };
      }

      const page = config.params?.page || 0;
      const size = config.params?.size || 12;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
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
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
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
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
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
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { message: 'Status alterado com sucesso' },
    };
  }

  // ─── Admin Orders Endpoints ────────────────────────────────────────────
  if (url.includes('/admin/pedidos')) {
    if (method === 'get') {
      if (/\/admin\/pedidos\/\d+/.test(url)) {
        const orderId = url.split('/').pop();
        const order = mockOrders.find((o) => o.id === orderId);
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { data: order || mockOrders[0] },
        };
      }

      const page = config.params?.page || 0;
      const size = config.params?.size || 20;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
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
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { message: 'Pedido atualizado com sucesso' },
      };
    }
  }

  // ─── Admin Analytics ───────────────────────────────────────────────────
  if (url.includes('/admin/analytics') || url.includes('/admin/dashboard')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { data: mockAnalytics },
    };
  }

  // ─── Catalog Endpoints (Books) ────────────────────────────────────────
  if (url.includes('/livros') && !url.includes('/admin') && !url.includes('/avaliacoes')) {
    if (method === 'get') {
      if (/\/livros\/\d+$/.test(url)) {
        const bookId = url.split('/').pop();
        const book = mockBooks.find((b) => b.id === bookId);
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { data: book || mockBooks[0] },
        };
      }

      const page = config.params?.page || 0;
      const size = config.params?.size || 12;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
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
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { data: mockCategories },
    };
  }

  // ─── Authors ───────────────────────────────────────────────────────────
  if (url.includes('/catalogo/autores')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { data: mockAuthors },
    };
  }

  // ─── Publishers (editoras) ──────────────────────────────────────────────
  if (url.includes('/catalogo/editoras')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { data: [{ id: '1', nome: 'Editora Demo' }] },
    };
  }

  // ─── Reviews ───────────────────────────────────────────────────────────
  if (url.includes('/avaliacoes')) {
    const bookId = url.split('/')[2];

    if (method === 'get') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { data: mockReviews[bookId] || [] },
      };
    }

    if (method === 'post') {
      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
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
        const orderId = url.split('/').pop();
        const order = mockOrders.find((o) => o.id === orderId);
        return {
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { data: order || mockOrders[0] },
        };
      }

      const page = config.params?.page || 0;
      const size = config.params?.size || 20;
      const startIdx = page * size;
      const endIdx = startIdx + size;

      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
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
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
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
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
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
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { data: mockUser },
      };
    }

    if (method === 'put') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { data: { ...mockUser, ...config.data } },
      };
    }
  }

  // ─── Addresses ────────────────────────────────────────────────────────
  if (url.includes('/enderecosEntrega') || url.includes('/enderecos')) {
    if (method === 'get') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { data: mockAddresses },
      };
    }

    if (method === 'post') {
      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
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
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: {
          data: {
            id,
            ...config.data,
          },
        },
      };
    }

    if (method === 'delete') {
      return {
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
        data: {},
      };
    }
  }

  // ─── Credit Cards ────────────────────────────────────────────────────
  if (url.includes('/cartoes')) {
    if (method === 'get') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { data: mockCreditCards },
      };
    }

    if (method === 'post') {
      return {
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
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
      return {
        status: 204,
        statusText: 'No Content',
        headers: {},
        config,
        data: {},
      };
    }
  }

  // ─── Notifications ────────────────────────────────────────────────────
  if (url.includes('/notificacoes')) {
    if (method === 'get') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { data: mockNotifications },
      };
    }

    if (method === 'put' || method === 'patch') {
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { success: true },
      };
    }
  }

  // ─── Pricing Groups ───────────────────────────────────────────────────
  if (url.includes('/grupos-precificacao')) {
    return {
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      data: { data: [] },
    };
  }

  // ─── Fallback: Return empty response ────────────────────────────────
  console.warn('[DEMO MODE] No mock handler for:', method.toUpperCase(), url);
  return {
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
    data: { data: [] },
  };
};

/**
 * Create axios interceptor for demo mode
 * Intercepts ALL requests to serve mock data
 */
const createMockInterceptor = (axiosInstance) => {
  if (!DEMO_MODE) return;

  // Replace the default adapter with a mock adapter
  const originalAdapter = axiosInstance.defaults.adapter;

  axiosInstance.defaults.adapter = (config) => {
    // In demo mode, serve mock data immediately without making a real request
    const response = getMockResponse(config);
    return Promise.resolve(response);
  };
};

export default createMockInterceptor;
export { DEMO_MODE };

