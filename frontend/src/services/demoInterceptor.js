/**
 * Demo mode interceptor - Replaces API calls with mock data
 * Uses a custom axios adapter so all requests are intercepted before reaching the network.
 *
 * IMPORTANT: response shapes must match what the service layer returns after
 * doing `response.data.data`, and then what the UI components expect from
 * that service return value.  For paginated endpoints the UI expects Spring
 * Boot's Page shape: { content: [...], totalPages, totalElements, ... }
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
  mockCustomers,
  mockExchanges,
  mockStock,
} from './mockData';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Safe body parse — config.data may be a string or already an object
const body = (config) => {
  if (!config.data) return {};
  if (typeof config.data === 'string') { try { return JSON.parse(config.data); } catch { return {}; } }
  return config.data;
};

// Helper: wrap an array in Spring-Boot Page shape
const paginate = (items, config) => {
  const page = Number(config.params?.page ?? 0);
  const size = Number(config.params?.size ?? 20);
  const start = page * size;
  const slice = items.slice(start, start + size);
  return {
    content: slice,
    totalElements: items.length,
    totalPages: Math.ceil(items.length / size),
    number: page,
    size,
    first: page === 0,
    last: start + size >= items.length,
    empty: slice.length === 0,
  };
};

// Helper: build a standard axios-shaped response
const ok = (config, data, status = 200) => ({
  status,
  statusText: 'OK',
  headers: {},
  config,
  data: { data },
});

/**
 * Route an incoming request config to mock data.
 */
const getMockResponse = (config) => {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();

  console.log('[DEMO MODE] Intercepting:', method.toUpperCase(), url);

  // ─── Auth ────────────────────────────────────────────────────────────
  if (url.includes('/auth/login') || url.includes('/auth/register')) {
    return ok(config, { token: 'demo-token-' + Date.now(), user: mockUser });
  }
  if (url.includes('/auth/logout')) {
    return ok(config, { success: true });
  }
  if (url.includes('/auth/senha')) {
    return ok(config, { message: 'Senha alterada com sucesso' });
  }

  // ─── Admin Analytics ─────────────────────────────────────────────────
  // Must come before generic /admin/… checks
  if (url.includes('/admin/analise/vendas-regiao')) {
    return ok(config, mockAnalytics.regional);
  }
  if (url.includes('/admin/analise/vendas')) {
    return ok(config, mockAnalytics.sales);
  }
  if (url.includes('/admin/dashboard') || url.includes('/admin/analytics')) {
    return ok(config, mockAnalytics.sales);
  }

  // ─── Admin Books ─────────────────────────────────────────────────────
  if (url.includes('/admin/livros')) {
    if (url.includes('/ativar') || url.includes('/inativar')) {
      return ok(config, { message: 'Status alterado com sucesso' });
    }
    if (method === 'get') {
      if (/\/admin\/livros\/[^/]+$/.test(url)) {
        const id = url.split('/').pop();
        return ok(config, mockBooks.find(b => b.id === id) || mockBooks[0]);
      }
      return ok(config, paginate(mockBooks, config));
    }
    if (method === 'post') {
      return ok(config, { id: String(Date.now()), ...body(config) }, 201);
    }
    if (method === 'put') {
      const id = url.split('/').pop();
      return ok(config, { id, ...body(config) });
    }
  }

  // ─── Admin Orders ────────────────────────────────────────────────────
  if (url.includes('/admin/pedidos')) {
    if (url.includes('/despachar') || url.includes('/entregar')) {
      return ok(config, { message: 'Pedido atualizado com sucesso' });
    }
    if (method === 'get') {
      if (/\/admin\/pedidos\/[^/]+$/.test(url)) {
        const id = url.split('/').pop();
        return ok(config, mockOrders.find(o => o.id === id) || mockOrders[0]);
      }
      // Filter by status if requested
      let filtered = mockOrders;
      const statusFilter = config.params?.status;
      if (statusFilter) {
        filtered = mockOrders.filter(o => o.status === statusFilter);
      }
      return ok(config, paginate(filtered, config));
    }
    if (method === 'patch') {
      return ok(config, { message: 'Pedido atualizado com sucesso' });
    }
  }

  // ─── Admin Customers ─────────────────────────────────────────────────
  if (url.includes('/admin/clientes')) {
    if (method === 'get') {
      if (/\/admin\/clientes\/[^/]+$/.test(url)) {
        const id = url.split('/').pop();
        return ok(config, mockCustomers.find(c => c.id === id) || mockCustomers[0]);
      }
      const search = (config.params?.search || config.params?.nome || '').toLowerCase();
      let filtered = mockCustomers;
      if (search) {
        filtered = mockCustomers.filter(c =>
          c.nome.toLowerCase().includes(search) ||
          c.email.toLowerCase().includes(search) ||
          c.cpf.includes(search)
        );
      }
      return ok(config, paginate(filtered, config));
    }
  }

  // ─── Admin Exchanges ─────────────────────────────────────────────────
  if (url.includes('/admin/trocas')) {
    if (url.includes('/autorizar') || url.includes('/confirmar-recebimento')) {
      return ok(config, { message: 'Troca atualizada com sucesso' });
    }
    if (method === 'get') {
      if (/\/admin\/trocas\/[^/]+$/.test(url)) {
        const id = url.split('/').pop();
        return ok(config, mockExchanges.find(e => e.id === id) || mockExchanges[0]);
      }
      const statusFilter = config.params?.status;
      let filtered = mockExchanges;
      if (statusFilter) {
        filtered = mockExchanges.filter(e => e.status === statusFilter);
      }
      return ok(config, paginate(filtered, config));
    }
  }

  // ─── Admin Stock Entries ─────────────────────────────────────────────
  if (url.includes('/admin/estoque')) {
    if (method === 'get') {
      return ok(config, paginate(mockStock, config));
    }
    if (method === 'post') {
      return ok(config, { id: String(Date.now()), message: 'Entrada registrada' }, 201);
    }
  }

  // ─── Admin Reviews ───────────────────────────────────────────────────
  if (url.includes('/admin/avaliacoes')) {
    if (url.includes('/aprovar') || url.includes('/rejeitar')) {
      return ok(config, { message: 'Avaliação atualizada com sucesso' });
    }
    if (method === 'get') {
      return ok(config, paginate(mockReviews, config));
    }
  }

  // ─── Admin Suppliers (stub) ──────────────────────────────────────────
  if (url.includes('/admin/fornecedores')) {
    return ok(config, []);
  }

  // ─── Catalog / Public Books ──────────────────────────────────────────
  if (/\/livros\/[^/]+\/avaliacoes/.test(url)) {
    const bookId = url.match(/\/livros\/([^/]+)\/avaliacoes/)?.[1];
    const reviews = mockReviews.filter(r => r.livroId === bookId);
    return ok(config, paginate(reviews, config));
  }

  if (url.includes('/livros') && !url.includes('/admin')) {
    if (method === 'get') {
      if (/\/livros\/[^/]+$/.test(url)) {
        const id = url.split('/').pop();
        return ok(config, mockBooks.find(b => b.id === id) || mockBooks[0]);
      }
      return ok(config, paginate(mockBooks, config));
    }
    if (method === 'post') {
      // review submission
      return ok(config, { id: String(Date.now()), ...body(config) }, 201);
    }
  }

  // ─── Catalog Reference Data ──────────────────────────────────────────
  if (url.includes('/catalogo/categorias')) return ok(config, mockCategories);
  if (url.includes('/catalogo/autores'))    return ok(config, mockAuthors);
  if (url.includes('/catalogo/editoras'))   return ok(config, [{ id: '1', nome: 'Editora Demo' }]);

  // ─── Customer Profile ────────────────────────────────────────────────
  if (url.includes('/clientes/perfil') || url.includes('/clientes/me')) {
    if (method === 'put') return ok(config, { ...mockUser, ...body(config) });
    return ok(config, mockUser);
  }

  // ─── Customer Addresses ──────────────────────────────────────────────
  if (url.includes('/clientes/enderecos') || url.includes('/enderecosEntrega') || url.includes('/enderecos')) {
    if (method === 'get')    return ok(config, mockAddresses);
    if (method === 'post')   return ok(config, { id: String(Date.now()), ...body(config) }, 201);
    if (method === 'put')    return ok(config, { id: url.split('/').pop(), ...body(config) });
    if (method === 'delete') return ok(config, null, 204);
  }

  // ─── Customer Credit Cards ───────────────────────────────────────────
  if (url.includes('/clientes/cartoes') || url.includes('/cartoes')) {
    if (url.includes('/preferencial')) return ok(config, { message: 'Cartão preferencial atualizado' });
    if (method === 'get')    return ok(config, mockCreditCards);
    if (method === 'post')   return ok(config, { id: String(Date.now()), ...body(config) }, 201);
    if (method === 'put')    return ok(config, { id: url.split('/').pop(), ...body(config) });
    if (method === 'delete') return ok(config, null, 204);
  }

  // ─── Customer Orders (vendas/minhas) ─────────────────────────────────
  if (url.includes('/vendas/minhas')) {
    return ok(config, paginate(mockOrders, config));
  }

  // ─── Customer Transactions ───────────────────────────────────────────
  if (url.includes('/clientes/transacoes')) {
    return ok(config, paginate(mockOrders, config));
  }

  // ─── Customer Exchange Coupons ───────────────────────────────────────
  if (url.includes('/clientes/cupons-troca')) {
    return ok(config, []);
  }

  // ─── Customer Orders (non-admin) ─────────────────────────────────────
  if (url.includes('/pedidos') && !url.includes('/admin')) {
    if (url.includes('/trocas') && method === 'post') {
      return ok(config, { message: 'Troca solicitada com sucesso' });
    }
    if (method === 'get') {
      if (/\/pedidos\/[^/]+$/.test(url)) {
        const id = url.split('/').pop();
        return ok(config, mockOrders.find(o => o.id === id) || mockOrders[0]);
      }
      return ok(config, paginate(mockOrders, config));
    }
    if (method === 'post') {
      return ok(config, {
        id: String(Date.now()),
        numeroPedido: 'PED-' + Date.now(),
        status: 'CONFIRMADO',
      }, 201);
    }
  }

  // ─── Checkout ────────────────────────────────────────────────────────
  if (url.includes('/checkout')) {
    return ok(config, {
      id: String(Date.now()),
      numeroPedido: 'PED-' + Date.now(),
      status: 'SUCESSO',
      message: 'Pedido criado com sucesso em modo demo',
    });
  }

  // ─── Notifications ──────────────────────────────────────────────────
  if (url.includes('/notificacoes')) {
    if (method === 'get') return ok(config, mockNotifications);
    return ok(config, { success: true });
  }

  // ─── Pricing Groups ─────────────────────────────────────────────────
  if (url.includes('/grupos-precificacao')) return ok(config, []);

  // ─── Fallback ────────────────────────────────────────────────────────
  console.warn('[DEMO MODE] No mock handler for:', method.toUpperCase(), url);
  return ok(config, []);
};

/**
 * Install the mock adapter on the given axios instance.
 */
const createMockInterceptor = (axiosInstance) => {
  if (!DEMO_MODE) return;

  axiosInstance.defaults.adapter = (config) => {
    const response = getMockResponse(config);
    return Promise.resolve(response);
  };
};

export default createMockInterceptor;
export { DEMO_MODE };
