/**
 * cypress/e2e/exchanges-reviews.cy.js
 * US-046 | FE-036
 *
 * Two describe blocks:
 *   1. Exchanges — user request, admin authorize, admin confirm receipt
 *   2. Reviews   — user submit, admin moderation, approved reviews on product page
 *
 * All backend calls are intercepted; no real API required.
 *
 * Key data-testid map:
 *  OrderHistoryPage:
 *    order-card-{id}, order-toggle-{id}, exchange-btn-{id}, orders-timeline,
 *    exchange-modal, exchange-modal-close, exchange-form,
 *    exchange-chk-{key}  (key = item.id or item.livroId),
 *    exchange-justificativa, exchange-submit-btn, exchange-cancel-btn,
 *    order-em-troca-badge
 *
 *  ExchangeWorkflow (admin /admin/trocas):
 *    admin-exchanges-section, tab-pending, tab-authorized,
 *    pending-exchanges-table, pending-exchange-row-{id},
 *    authorize-exchange-{id},
 *    authorized-exchanges-table, authorized-exchange-row-{id},
 *    return-checkbox-{exchangeId}-{itemId}, confirm-receipt-{id}
 *
 *  ReviewForm (ProductPage):
 *    review-form-container, star-btn-{n},
 *    review-texto-input, review-submit-btn,
 *    review-success, review-moderation-badge
 *
 *  ReviewModeration (admin /admin/avaliacoes):
 *    admin-reviews-section, admin-reviews-table,
 *    review-row-{id}, approve-review-{id}, reject-review-{id}
 *
 *  ReviewList (ProductPage):
 *    review-list, review-item-{id}
 */

import clienteFixture from '../fixtures/cliente.json';
import livroFixture from '../fixtures/livro.json';

// ── Auth helpers ──────────────────────────────────────────────────────────────

const setupCustomer = () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'customer-jwt');
    win.localStorage.setItem('user_profile', JSON.stringify(clienteFixture));
  });
};

const setupAdmin = () => {
  const adminProfile = { ...clienteFixture, role: 'ADMIN', roles: ['ADMIN'] };
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'admin-jwt');
    win.localStorage.setItem('user_profile', JSON.stringify(adminProfile));
  });
};

/** Silence noisy polling endpoints that have nothing to do with the tests */
const silenceGlobalAPIs = () => {
  cy.intercept('GET', '**/notificacoes/nao-lidas/count', {
    statusCode: 200,
    body: { data: 0 },
  }).as('notifCount');
};

// ── Order / Exchange fixtures ─────────────────────────────────────────────────

/** A delivered order with one item that has an explicit id */
const deliveredOrder = {
  id: 100,
  numero: 'PED-100',
  numeroNota: 'PED-100',
  dataPedido: '2026-02-15T10:00:00',
  status: 'ENTREGUE',
  valorFrete: 10,
  valorTotal: 45.91,
  itens: [
    {
      id: 200,           // explicit id → exchange checkbox key = 200
      livroId: 1,
      titulo: livroFixture.titulo,
      quantidade: 1,
      valorUnitario: livroFixture.valorVenda,
    },
  ],
};

/** Same order but with status updated to EM_TROCA (after exchange request) */
const exchangeOrder = { ...deliveredOrder, status: 'EM_TROCA' };

/** Pending exchange record (admin view) */
const pendingExchange = {
  id: 1,
  pedidoId: 100,
  numeroNota: 'PED-100',
  dataSolicitacao: '2026-02-16T08:00:00',
  status: 'EM_TROCA',
  itens: [
    { id: 200, livroId: 1, livroTitulo: livroFixture.titulo, quantidade: 1, justificativa: 'Páginas danificadas' },
  ],
};

/** Authorized exchange record (admin view) */
const authorizedExchange = {
  ...pendingExchange,
  status: 'TROCA_AUTORIZADA',
};

// ── Review fixtures ───────────────────────────────────────────────────────────

/** Pending review (admin moderation) */
const pendingReview = {
  id: 50,
  livroId: 1,
  livroTitulo: livroFixture.titulo,
  clienteNome: clienteFixture.nome,
  estrelas: 5,
  texto: 'Livro excelente, muito bem escrito e recomendado.',
  dataAvaliacao: '2026-02-18T12:00:00',
  aprovada: false,
};

/** Approved review (shown on product page) */
const approvedReview = {
  ...pendingReview,
  aprovada: true,
  cliente: { id: 1, nome: clienteFixture.nome },
};

// ── Shared mock helpers ───────────────────────────────────────────────────────

/**
 * Mock GET /clientes/transacoes
 * @param {Array} orders
 */
const mockGetTransactions = (orders, alias = 'getTransactions') => {
  cy.intercept('GET', '**/clientes/transacoes', {
    statusCode: 200,
    body: {
      data: {
        content: orders,
        totalElements: orders.length,
        totalPages: 1,
        currentPage: 0,
        size: 20,
      },
    },
  }).as(alias);
};

/**
 * Mock GET /livros/:id
 */
const mockGetBook = (bookId = 1) => {
  cy.intercept('GET', `**/livros/${bookId}`, {
    statusCode: 200,
    body: {
      data: {
        ...livroFixture,
        id: bookId,
        estoque: { quantidadeTotal: 50, quantidadeDisponivel: 45, quantidadeBloqueada: 5 },
      },
    },
  }).as('getBook');
};

/**
 * Mock GET /livros/:id/avaliacoes
 */
const mockGetReviews = (bookId = 1, reviews = []) => {
  cy.intercept('GET', `**/livros/${bookId}/avaliacoes*`, {
    statusCode: 200,
    body: {
      data: {
        content: reviews,
        totalElements: reviews.length,
        totalPages: reviews.length > 0 ? 1 : 0,
        currentPage: 0,
        size: 10,
      },
    },
  }).as('getReviews');
};

// ─────────────────────────────────────────────────────────────────────────────
//  DESCRIBE 1 — Exchanges
// ─────────────────────────────────────────────────────────────────────────────

describe('Exchanges — User and Admin Workflow', () => {

  // ── User flow: submit exchange request ────────────────────────────────────

  describe('User: submit exchange request from order history', () => {
    beforeEach(() => {
      setupCustomer();
      silenceGlobalAPIs();
    });

    it('shows Solicitar Troca button only for ENTREGUE orders', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      // Expand the order card
      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();

      // Exchange button visible for ENTREGUE
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).should('be.visible');
    });

    it('does NOT show exchange button for orders not in ENTREGUE status', () => {
      const processingOrder = { ...deliveredOrder, id: 200, status: 'EM_PROCESSAMENTO' };
      mockGetTransactions([processingOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${processingOrder.id}"]`).click();

      cy.get(`[data-testid="exchange-btn-${processingOrder.id}"]`).should('not.exist');
    });

    it('opens exchange modal when clicking Solicitar Troca', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

      cy.get('[data-testid="exchange-modal"]').should('be.visible');
    });

    it('modal contains item rows for each order item', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

      cy.get('[data-testid="exchange-modal"]').should('be.visible');

      // Item row with the item id as key (item.id = 200)
      const itemKey = deliveredOrder.itens[0].id;
      cy.get(`[data-testid="exchange-item-row-${itemKey}"]`).should('exist');
      cy.get(`[data-testid="exchange-chk-${itemKey}"]`).should('not.be.checked');
    });

    it('shows error when submitting without selecting an item', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

      cy.get('[data-testid="exchange-submit-btn"]').click();

      cy.get('[data-testid="exchange-error"]')
        .should('be.visible')
        .and('contain.text', 'Selecione pelo menos um item');
    });

    it('shows error when submitting without justification', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

      // Select item but leave justification empty
      const itemKey = deliveredOrder.itens[0].id;
      cy.get(`[data-testid="exchange-chk-${itemKey}"]`).check();
      cy.get('[data-testid="exchange-submit-btn"]').click();

      cy.get('[data-testid="exchange-error"]')
        .should('be.visible')
        .and('contain.text', 'justificativa');
    });

    it('submits exchange request — POST /pedidos/{id}/trocas is called', () => {
      mockGetTransactions([deliveredOrder]);

      cy.intercept('POST', `**/pedidos/${deliveredOrder.id}/trocas`, {
        statusCode: 201,
        body: {
          statusCode: 201,
          data: { id: 1, status: 'EM_TROCA', dataSolicitacao: '2026-03-01T11:00:00' },
          message: 'Solicitação de troca enviada',
        },
      }).as('submitExchange');

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

      const itemKey = deliveredOrder.itens[0].id;
      cy.get(`[data-testid="exchange-chk-${itemKey}"]`).check();
      cy.get('[data-testid="exchange-justificativa"]').type('Páginas danificadas e rasgadas.');
      cy.get('[data-testid="exchange-submit-btn"]').click();

      cy.wait('@submitExchange').its('request.body').should('deep.include', {
        itens: [{ itemPedidoId: itemKey, quantidade: 1, justificativa: 'Páginas danificadas e rasgadas.' }],
      });
    });

    it('closes modal after successful exchange request', () => {
      let callCount = 0;
      cy.intercept('GET', '**/clientes/transacoes', (req) => {
        callCount += 1;
        const content = callCount === 1 ? [deliveredOrder] : [exchangeOrder];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: 1, totalPages: 1, currentPage: 0, size: 20 },
          },
        });
      }).as('transactions');

      cy.intercept('POST', `**/pedidos/${deliveredOrder.id}/trocas`, {
        statusCode: 201,
        body: {
          data: { id: 1, status: 'EM_TROCA', dataSolicitacao: '2026-03-01T11:00:00' },
          message: 'Solicitação de troca enviada',
        },
      }).as('submitExchange');

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();
      cy.get('[data-testid="exchange-modal"]').should('be.visible');

      const itemKey = deliveredOrder.itens[0].id;
      cy.get(`[data-testid="exchange-chk-${itemKey}"]`).check();
      cy.get('[data-testid="exchange-justificativa"]').type('Produto com defeito de fabricação.');
      cy.get('[data-testid="exchange-submit-btn"]').click();

      cy.wait('@submitExchange');

      // Modal should close
      cy.get('[data-testid="exchange-modal"]').should('not.exist');
    });

    it('order status updates to EM_TROCA after successful exchange request', () => {
      let callCount = 0;
      cy.intercept('GET', '**/clientes/transacoes', (req) => {
        callCount += 1;
        const content = callCount === 1 ? [deliveredOrder] : [exchangeOrder];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: 1, totalPages: 1, currentPage: 0, size: 20 },
          },
        });
      }).as('transactions');

      cy.intercept('POST', `**/pedidos/${deliveredOrder.id}/trocas`, {
        statusCode: 201,
        body: {
          data: { id: 1, status: 'EM_TROCA' },
          message: 'Solicitação de troca enviada',
        },
      }).as('submitExchange');

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

      const itemKey = deliveredOrder.itens[0].id;
      cy.get(`[data-testid="exchange-chk-${itemKey}"]`).check();
      cy.get('[data-testid="exchange-justificativa"]').type('Livro diferente do anunciado.');
      cy.get('[data-testid="exchange-submit-btn"]').click();

      cy.wait('@submitExchange');

      // Re-expand card to see updated status (page re-fetched)
      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get('[data-testid="order-status-badge"]').should('contain.text', 'Em Troca');
    });

    it('exchange modal closes when clicking Cancel', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();
      cy.get('[data-testid="exchange-modal"]').should('be.visible');

      cy.get('[data-testid="exchange-cancel-btn"]').click();
      cy.get('[data-testid="exchange-modal"]').should('not.exist');
    });

    it('exchange modal closes when clicking the X button', () => {
      mockGetTransactions([deliveredOrder]);

      cy.visit('/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
      cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();
      cy.get('[data-testid="exchange-modal"]').should('be.visible');

      cy.get('[data-testid="exchange-modal-close"]').click();
      cy.get('[data-testid="exchange-modal"]').should('not.exist');
    });
  });

  // ── Admin flow: authorize pending exchange ────────────────────────────────

  describe('Admin: authorize pending exchange (EM_TROCA)', () => {
    beforeEach(() => {
      setupAdmin();
      silenceGlobalAPIs();
    });

    it('admin exchange page loads and shows pending tab by default', () => {
      cy.intercept('GET', '**/admin/trocas*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingExchange],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 20,
          },
        },
      }).as('getPendingExchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="tab-pending"]').should('have.class', 'active');
    });

    it('displays pending exchanges in the table', () => {
      cy.intercept('GET', '**/admin/trocas*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingExchange],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 20,
          },
        },
      }).as('getPendingExchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getPendingExchanges');

      cy.get(`[data-testid="pending-exchange-row-${pendingExchange.id}"]`).should('exist');
    });

    it('shows "no pending exchanges" message when list is empty', () => {
      cy.intercept('GET', '**/admin/trocas*', {
        statusCode: 200,
        body: {
          data: { content: [], totalElements: 0, totalPages: 0, currentPage: 0, size: 20 },
        },
      }).as('emptyExchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@emptyExchanges');

      cy.get('[data-testid="no-pending-exchanges"]').should('be.visible');
    });

    it('authorize button calls PATCH /admin/trocas/{id}/autorizar', () => {
      cy.intercept('GET', '**/admin/trocas*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingExchange],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 20,
          },
        },
      }).as('getPendingExchanges');

      cy.intercept('PATCH', `**/admin/trocas/${pendingExchange.id}/autorizar`, {
        statusCode: 200,
        body: { message: 'Troca autorizada com sucesso' },
      }).as('authorizeExchange');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getPendingExchanges');

      cy.get(`[data-testid="authorize-exchange-${pendingExchange.id}"]`).click();
      cy.wait('@authorizeExchange');
    });

    it('pending exchange list refreshes after authorization', () => {
      let callCount = 0;
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        callCount += 1;
        const content = callCount === 1 ? [pendingExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.intercept('PATCH', `**/admin/trocas/${pendingExchange.id}/autorizar`, {
        statusCode: 200,
        body: { message: 'Troca autorizada com sucesso' },
      }).as('authorizeExchange');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get(`[data-testid="pending-exchange-row-${pendingExchange.id}"]`).should('exist');

      cy.get(`[data-testid="authorize-exchange-${pendingExchange.id}"]`).click();
      cy.wait('@authorizeExchange');

      // After refresh, the row should be gone (list is now empty)
      cy.get('[data-testid="no-pending-exchanges"]', { timeout: 8000 }).should('be.visible');
    });
  });

  // ── Admin flow: confirm receipt —  TROCA_AUTORIZADA → TROCADO ─────────────

  describe('Admin: confirm exchange receipt (TROCA_AUTORIZADA)', () => {
    beforeEach(() => {
      setupAdmin();
      silenceGlobalAPIs();
    });

    it('clicking Autorizadas tab fetches exchanges with TROCA_AUTORIZADA status', () => {
      // First GET (pending tab on mount) → empty
      // Second GET (authorized tab) → authorized exchange
      let callCount = 0;
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        callCount += 1;
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        const content = isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');

      // Click the authorized tab
      cy.get('[data-testid="tab-authorized"]').click();
      cy.wait('@exchanges');
    });

    it('authorized exchange row appears after switching to Autorizadas tab', () => {
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        const content = isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="tab-authorized"]').click();
      cy.wait('@exchanges');

      cy.get(`[data-testid="authorized-exchange-row-${authorizedExchange.id}"]`).should('exist');
    });

    it('return-to-stock checkboxes are visible and checked by default', () => {
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        const content = isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="tab-authorized"]').click();
      cy.wait('@exchanges');

      const itemId = authorizedExchange.itens[0].id;
      cy.get(`[data-testid="return-checkbox-${authorizedExchange.id}-${itemId}"]`)
        .should('exist')
        .and('be.checked');
    });

    it('return-to-stock checkbox can be toggled', () => {
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        const content = isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="tab-authorized"]').click();
      cy.wait('@exchanges');

      const itemId = authorizedExchange.itens[0].id;
      const checkboxTestId = `return-checkbox-${authorizedExchange.id}-${itemId}`;

      cy.get(`[data-testid="${checkboxTestId}"]`).should('be.checked');
      cy.get(`[data-testid="${checkboxTestId}"]`).uncheck();
      cy.get(`[data-testid="${checkboxTestId}"]`).should('not.be.checked');
    });

    it('Confirmar Recebimento calls PATCH /admin/trocas/{id}/confirmar-recebimento', () => {
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        const content = isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.intercept('PATCH', `**/admin/trocas/${authorizedExchange.id}/confirmar-recebimento`, {
        statusCode: 200,
        body: { message: 'Troca finalizada' },
      }).as('confirmReceipt');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="tab-authorized"]').click();
      cy.wait('@exchanges');

      cy.get(`[data-testid="confirm-receipt-${authorizedExchange.id}"]`).click();
      cy.wait('@confirmReceipt');
    });

    it('payload includes item ids and retornarAoEstoque flags', () => {
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        const content = isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.intercept('PATCH', `**/admin/trocas/${authorizedExchange.id}/confirmar-recebimento`, {
        statusCode: 200,
        body: { message: 'Troca finalizada' },
      }).as('confirmReceipt');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="tab-authorized"]').click();
      cy.wait('@exchanges');

      cy.get(`[data-testid="confirm-receipt-${authorizedExchange.id}"]`).click();

      cy.wait('@confirmReceipt').its('request.body').should((body) => {
        expect(body.itens).to.be.an('array').that.has.length.at.least(1);
        body.itens.forEach((item) => {
          expect(item).to.have.property('id');
          expect(item).to.have.property('retornarAoEstoque');
        });
      });
    });

    it('authorized exchange list refreshes after confirming receipt', () => {
      let callCount = 0;
      cy.intercept('GET', '**/admin/trocas*', (req) => {
        const isAuthorized = req.url.includes('TROCA_AUTORIZADA');
        callCount += 1;
        // After first click fetch, return empty
        const content = (isAuthorized && callCount > 1) ? [] : isAuthorized ? [authorizedExchange] : [];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: content.length > 0 ? 1 : 0, currentPage: 0, size: 20 },
          },
        });
      }).as('exchanges');

      cy.intercept('PATCH', `**/admin/trocas/${authorizedExchange.id}/confirmar-recebimento`, {
        statusCode: 200,
        body: { message: 'Troca finalizada' },
      }).as('confirmReceipt');

      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="tab-authorized"]').click();
      cy.get(`[data-testid="authorized-exchange-row-${authorizedExchange.id}"]`).should('exist');

      cy.get(`[data-testid="confirm-receipt-${authorizedExchange.id}"]`).click();
      cy.wait('@confirmReceipt');

      // List refreshes — row disappears
      cy.get('[data-testid="no-authorized-exchanges"]', { timeout: 8000 }).should('be.visible');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  DESCRIBE 2 — Reviews
// ─────────────────────────────────────────────────────────────────────────────

describe('Reviews — User Submission and Admin Moderation', () => {

  // ── User: ReviewForm on ProductPage ──────────────────────────────────────

  describe('User: submit review from product page', () => {
    beforeEach(() => {
      setupCustomer();
      silenceGlobalAPIs();
      mockGetBook(1);
      mockGetReviews(1, []); // initially empty
    });

    it('review form is visible for authenticated users on product page', () => {
      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('be.visible');
    });

    it('star selector renders 5 clickable stars', () => {
      cy.visit('/product/1');
      cy.get('[data-testid="star-selector"]', { timeout: 10000 }).should('exist');

      for (let i = 1; i <= 5; i++) {
        cy.get(`[data-testid="star-btn-${i}"]`).should('exist');
      }
    });

    it('clicking a star selects the rating and shows label', () => {
      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="star-btn-5"]').click();
      cy.get('[data-testid="star-label"]').should('contain.text', 'Excelente');
    });

    it('review text input accepts text', () => {
      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="review-texto-input"]').type('Este livro é muito bom e recomendado.');
      cy.get('[data-testid="review-texto-input"]').should('have.value', 'Este livro é muito bom e recomendado.');
    });

    it('shows validation error when submitting with no stars', () => {
      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="review-texto-input"]').type('Ótimo livro, muito bem escrito.');
      cy.get('[data-testid="review-submit-btn"]').click();

      cy.get('[data-testid="review-error"]').should('contain.text', 'nota');
    });

    it('shows validation error when text is too short', () => {
      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="star-btn-4"]').click();
      cy.get('[data-testid="review-texto-input"]').type('Bom');
      cy.get('[data-testid="review-submit-btn"]').click();

      cy.get('[data-testid="review-error"]').should('contain.text', '10 caracteres');
    });

    it('submits review — POST /livros/{id}/avaliacoes is called', () => {
      cy.intercept('POST', '**/livros/1/avaliacoes', {
        statusCode: 201,
        body: {
          statusCode: 201,
          data: { id: 50, success: true },
          message: 'Avaliação enviada para moderação',
        },
      }).as('submitReview');

      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="star-btn-5"]').click();
      cy.get('[data-testid="review-texto-input"]').type('Livro excelente, muito bem escrito e recomendado para todos.');
      cy.get('[data-testid="review-submit-btn"]').click();

      cy.wait('@submitReview').its('request.body').should('deep.equal', {
        estrelas: 5,
        texto: 'Livro excelente, muito bem escrito e recomendado para todos.',
      });
    });

    it('shows success message after review is submitted', () => {
      cy.intercept('POST', '**/livros/1/avaliacoes', {
        statusCode: 201,
        body: {
          statusCode: 201,
          data: { id: 50, success: true },
          message: 'Avaliação enviada para moderação',
        },
      }).as('submitReview');

      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="star-btn-4"]').click();
      cy.get('[data-testid="review-texto-input"]').type('Ótimo livro, ajudou muito no aprendizado.');
      cy.get('[data-testid="review-submit-btn"]').click();

      cy.wait('@submitReview');
      cy.get('[data-testid="review-success"]', { timeout: 8000 }).should('be.visible');
    });

    it('success message shows "Aguardando moderação" badge', () => {
      cy.intercept('POST', '**/livros/1/avaliacoes', {
        statusCode: 201,
        body: {
          statusCode: 201,
          data: { id: 50, success: true },
          message: 'Avaliação enviada para moderação',
        },
      }).as('submitReview');

      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="star-btn-3"]').click();
      cy.get('[data-testid="review-texto-input"]').type('Livro com conteúdo razoável, mas muito útil para iniciantes.');
      cy.get('[data-testid="review-submit-btn"]').click();

      cy.wait('@submitReview');
      cy.get('[data-testid="review-moderation-badge"]', { timeout: 8000 })
        .should('be.visible')
        .and('contain.text', 'moderação');
    });

    it('review form resets after successful submission', () => {
      cy.intercept('POST', '**/livros/1/avaliacoes', {
        statusCode: 201,
        body: {
          statusCode: 201,
          data: { id: 50, success: true },
          message: 'Avaliação enviada para moderação',
        },
      }).as('submitReview');

      cy.visit('/product/1');
      cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="star-btn-5"]').click();
      cy.get('[data-testid="review-texto-input"]').type('Conteúdo muito rico e didático, muito recomendado.');
      cy.get('[data-testid="review-submit-btn"]').click();

      cy.wait('@submitReview');

      // Text input cleared after submission
      cy.get('[data-testid="review-texto-input"]').should('have.value', '');
    });

    it('shows login prompt for unauthenticated users', () => {
      // Visit without setting up auth
      cy.window().then((win) => {
        win.localStorage.removeItem('auth_token');
        win.localStorage.removeItem('user_profile');
      });

      cy.visit('/product/1');
      cy.get('[data-testid="review-login-prompt"]', { timeout: 10000 }).should('be.visible');
    });
  });

  // ── Admin: review moderation ──────────────────────────────────────────────

  describe('Admin: review moderation workflow', () => {
    beforeEach(() => {
      setupAdmin();
      silenceGlobalAPIs();
    });

    it('admin review moderation page loads', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
    });

    it('pending reviews are shown in the table', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).should('exist');
    });

    it('shows book title in review row', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-book-${pendingReview.id}"]`)
        .should('contain.text', pendingReview.livroTitulo);
    });

    it('shows client name in review row', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-client-${pendingReview.id}"]`)
        .should('contain.text', pendingReview.clienteNome);
    });

    it('approve button calls PATCH /admin/avaliacoes/{id}/aprovar', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.intercept('PATCH', `**/admin/avaliacoes/${pendingReview.id}/aprovar`, {
        statusCode: 200,
        body: { message: 'Avaliação aprovada com sucesso' },
      }).as('approveReview');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="approve-review-${pendingReview.id}"]`).click();
      cy.wait('@approveReview');
    });

    it('approved review is removed from pending list after approval', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.intercept('PATCH', `**/admin/avaliacoes/${pendingReview.id}/aprovar`, {
        statusCode: 200,
        body: { message: 'Avaliação aprovada' },
      }).as('approveReview');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).should('exist');
      cy.get(`[data-testid="approve-review-${pendingReview.id}"]`).click();
      cy.wait('@approveReview');

      // Optimistic update removes the row immediately
      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).should('not.exist');
    });

    it('reject button calls PATCH /admin/avaliacoes/{id}/rejeitar', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.intercept('PATCH', `**/admin/avaliacoes/${pendingReview.id}/rejeitar`, {
        statusCode: 200,
        body: { message: 'Avaliação rejeitada' },
      }).as('rejectReview');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="reject-review-${pendingReview.id}"]`).click();
      cy.wait('@rejectReview');
    });

    it('rejected review is removed from pending list', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.intercept('PATCH', `**/admin/avaliacoes/${pendingReview.id}/rejeitar`, {
        statusCode: 200,
        body: { message: 'Avaliação rejeitada' },
      }).as('rejectReview');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).should('exist');
      cy.get(`[data-testid="reject-review-${pendingReview.id}"]`).click();
      cy.wait('@rejectReview');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).should('not.exist');
    });

    it('status filter buttons are visible', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: { content: [], totalElements: 0, totalPages: 0, currentPage: 0, size: 10 },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="filter-status-pending"]').should('exist');
      cy.get('[data-testid="filter-status-approved"]').should('exist');
      cy.get('[data-testid="filter-status-all"]').should('exist');
    });

    it('clicking Aprovadas filter fetches reviews with aprovada=true', () => {
      const approvedReviewAdmin = { ...pendingReview, aprovada: true };

      let lastUrl = '';
      cy.intercept('GET', '**/admin/avaliacoes*', (req) => {
        lastUrl = req.url;
        const isApproved = req.url.includes('aprovada=true');
        const content = isApproved ? [approvedReviewAdmin] : [pendingReview];
        req.reply({
          statusCode: 200,
          body: {
            data: { content, totalElements: content.length, totalPages: 1, currentPage: 0, size: 10 },
          },
        });
      }).as('getReviewsFiltered');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');

      cy.get('[data-testid="filter-status-approved"]').click();
      cy.wait('@getReviewsFiltered');

      // The approve button should not appear for already approved reviews
      cy.get(`[data-testid="approve-review-${approvedReviewAdmin.id}"]`).should('not.exist');
    });

    it('clicking a review row opens the detail modal', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).click();
      cy.get('[data-testid="review-detail-modal"]').should('be.visible');
    });

    it('detail modal can be closed', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).click();
      cy.get('[data-testid="review-detail-modal"]').should('be.visible');

      cy.get('[data-testid="review-detail-close"]').click();
      cy.get('[data-testid="review-detail-modal"]').should('not.exist');
    });

    it('modal approve button calls PATCH /admin/avaliacoes/{id}/aprovar', () => {
      cy.intercept('GET', '**/admin/avaliacoes*', {
        statusCode: 200,
        body: {
          data: {
            content: [pendingReview],
            totalElements: 1,
            totalPages: 1,
            currentPage: 0,
            size: 10,
          },
        },
      }).as('getReviews');

      cy.intercept('PATCH', `**/admin/avaliacoes/${pendingReview.id}/aprovar`, {
        statusCode: 200,
        body: { message: 'Avaliação aprovada' },
      }).as('modalApprove');

      cy.visit('/admin/avaliacoes');
      cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
      cy.wait('@getReviews');

      cy.get(`[data-testid="review-row-${pendingReview.id}"]`).click();
      cy.get('[data-testid="review-detail-modal"]').should('be.visible');

      cy.get(`[data-testid="modal-approve-${pendingReview.id}"]`).click();
      cy.wait('@modalApprove');
    });
  });

  // ── Approved reviews appear on book detail page ───────────────────────────

  describe('Approved reviews appear on book detail (product) page', () => {
    beforeEach(() => {
      silenceGlobalAPIs();
      mockGetBook(1);
    });

    it('review list renders approved reviews', () => {
      mockGetReviews(1, [approvedReview]);

      cy.visit('/product/1');
      cy.get('[data-testid="review-list"]', { timeout: 10000 }).should('exist');
      cy.get(`[data-testid="review-item-${approvedReview.id}"]`).should('exist');
    });

    it('approved review shows customer name', () => {
      mockGetReviews(1, [approvedReview]);

      cy.visit('/product/1');
      cy.get('[data-testid="review-list"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="review-item-${approvedReview.id}"]`).within(() => {
        cy.get('[data-testid="review-cliente"]').should('contain.text', approvedReview.cliente.nome);
      });
    });

    it('approved review shows star rating', () => {
      mockGetReviews(1, [approvedReview]);

      cy.visit('/product/1');
      cy.get('[data-testid="review-list"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="review-item-${approvedReview.id}"]`).within(() => {
        cy.get('[data-testid="review-stars"]').should('exist');
      });
    });

    it('approved review shows review text', () => {
      mockGetReviews(1, [approvedReview]);

      cy.visit('/product/1');
      cy.get('[data-testid="review-list"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="review-item-${approvedReview.id}"]`).within(() => {
        cy.get('[data-testid="review-texto"]').should('contain.text', approvedReview.texto);
      });
    });

    it('shows empty state when no approved reviews exist', () => {
      mockGetReviews(1, []);

      cy.visit('/product/1');
      cy.get('[data-testid="reviews-empty"]', { timeout: 10000 }).should('be.visible');
    });

    it('review list calls GET /livros/{id}/avaliacoes with aprovada=true', () => {
      let capturedUrl = '';
      cy.intercept('GET', '**/livros/1/avaliacoes*', (req) => {
        capturedUrl = req.url;
        req.reply({
          statusCode: 200,
          body: {
            data: { content: [approvedReview], totalElements: 1, totalPages: 1, currentPage: 0, size: 10 },
          },
        });
      }).as('getBookReviews');

      cy.visit('/product/1');
      cy.wait('@getBookReviews');
      cy.then(() => expect(capturedUrl).to.include('aprovada=true'));
    });

    it('multiple approved reviews all render in the list', () => {
      const review2 = { ...approvedReview, id: 51, texto: 'Também muito bom e recomendado para todos.', estrelas: 4 };
      mockGetReviews(1, [approvedReview, review2]);

      cy.visit('/product/1');
      cy.get('[data-testid="review-list"]', { timeout: 10000 }).should('exist');

      cy.get(`[data-testid="review-item-${approvedReview.id}"]`).should('exist');
      cy.get(`[data-testid="review-item-${review2.id}"]`).should('exist');
    });
  });
});
