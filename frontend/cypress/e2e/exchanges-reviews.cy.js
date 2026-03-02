/**
 * cypress/e2e/exchanges-reviews.cy.js
 * US-046 | FE-036
 */

import clienteFixture from '../fixtures/cliente.json';
import livroFixture from '../fixtures/livro.json';

const deliveredOrder = {
  id: 100,
  numero: 'PED-100',
  status: 'ENTREGUE',
  dataPedido: '2026-02-20T10:00:00',
  valorFrete: 10,
  valorTotal: 45.91,
  itens: [
    {
      id: 200,
      livroId: 1,
      titulo: livroFixture.titulo,
      quantidade: 1,
      valorUnitario: livroFixture.valorVenda,
    },
  ],
};

const setupCustomerVisit = (url) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'customer-jwt');
      win.localStorage.setItem('user_profile', JSON.stringify(clienteFixture));
    },
  });
};

const setupAdminVisit = (url) => {
  const adminProfile = { ...clienteFixture, role: 'ADMIN', roles: ['ADMIN'] };
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'admin-jwt');
      win.localStorage.setItem('user_profile', JSON.stringify(adminProfile));
    },
  });
};

const silenceGlobalAPIs = () => {
  cy.intercept('GET', '**/notificacoes/nao-lidas/count', {
    statusCode: 200,
    body: { data: 0 },
  });
  cy.intercept('GET', '**/clientes/perfil', {
    statusCode: 200,
    body: { data: clienteFixture },
  });
  cy.intercept('GET', '**/carrinho', {
    statusCode: 200,
    body: { data: { itens: [], valorSubtotal: 0, valorFrete: 0, valorTotal: 0 } },
  });
  cy.intercept('GET', '**/carrinhos/**', {
    statusCode: 200,
    body: { data: { itens: [], quantidade: 0, valorTotal: 0 } },
  });
  cy.intercept('GET', '**/categorias**', {
    statusCode: 200,
    body: { data: [] },
  });
};

const mockBookAndReviews = (reviews = []) => {
  cy.intercept('GET', '**/livros/1', {
    statusCode: 200,
    body: {
      data: {
        ...livroFixture,
        id: 1,
        estoque: { quantidadeDisponivel: 20, quantidadeTotal: 30, quantidadeBloqueada: 10 },
      },
    },
  }).as('getBook');

  cy.intercept('GET', '**/livros/1/avaliacoes*', {
    statusCode: 200,
    body: {
      data: {
        content: reviews,
        totalElements: reviews.length,
        totalPages: reviews.length ? 1 : 0,
        currentPage: 0,
        size: 10,
      },
    },
  }).as('getReviews');
};

describe('Exchanges workflow (customer + admin)', () => {
  beforeEach(() => {
    silenceGlobalAPIs();
  });

  it('ENTREGUE -> solicitar troca -> EM_TROCA, depois admin autoriza e confirma recebimento', () => {
    let customerOrdersState = [deliveredOrder];

    cy.intercept('GET', '**/clientes/transacoes**', {
      statusCode: 200,
      body: {
        data: {
          content: customerOrdersState,
          totalElements: 1,
          totalPages: 1,
          currentPage: 0,
          size: 20,
        },
      },
    }).as('getTransactions');

    cy.intercept('POST', `**/pedidos/${deliveredOrder.id}/trocas`, (req) => {
      expect(req.body).to.deep.equal({
        itens: [
          {
            itemPedidoId: 200,
            quantidade: 1,
            justificativa: 'Produto veio com páginas rasgadas',
          },
        ],
      });

      customerOrdersState = [{ ...deliveredOrder, status: 'EM_TROCA' }];

      req.reply({
        statusCode: 201,
        body: {
          data: { id: 1, status: 'EM_TROCA' },
          message: 'Solicitação de troca enviada',
        },
      });
    }).as('postExchange');

    setupCustomerVisit('/account/orders');
    cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
    cy.get(`[data-testid="exchange-btn-${deliveredOrder.id}"]`).click();

    cy.get('[data-testid="exchange-modal"]').should('be.visible');
    cy.get('[data-testid="exchange-chk-200"]').check();
    cy.get('[data-testid="exchange-justificativa"]').type('Produto veio com páginas rasgadas');
    cy.get('[data-testid="exchange-submit-btn"]').click();

    cy.wait('@postExchange');
    cy.get('[data-testid="exchange-modal"]').should('not.exist');

    cy.reload();
    cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
    cy.get('[data-testid="order-status-badge"]').should('contain.text', 'Em Troca');

    const exchangePending = {
      id: 1,
      pedidoId: deliveredOrder.id,
      numeroNota: 'PED-100',
      dataSolicitacao: '2026-02-21T11:00:00',
      status: 'EM_TROCA',
      itens: [
        {
          id: 200,
          livroId: 1,
          livroTitulo: livroFixture.titulo,
          quantidade: 1,
          justificativa: 'Produto veio com páginas rasgadas',
        },
      ],
    };

    const exchangeAuthorized = { ...exchangePending, status: 'TROCA_AUTORIZADA' };
    let adminState = { pending: [exchangePending], authorized: [] };

    cy.intercept('GET', '**/api/**admin/trocas**', (req) => {
      const wantsPending = req.url.includes('status=EM_TROCA');
      const wantsAuthorized =
        req.url.includes('status=TROCA_AUTORIZADA') || req.url.includes('status=EM_TROCA_AUTORIZADA');
      const content = wantsAuthorized ? adminState.authorized : wantsPending ? adminState.pending : adminState.pending;

      req.reply({
        statusCode: 200,
        body: {
          data: {
            content,
            totalElements: content.length,
            totalPages: content.length ? 1 : 0,
            currentPage: 0,
            size: 20,
          },
        },
      });
    }).as('getAdminExchanges');

    cy.intercept('PATCH', `**/api/**admin/trocas/${exchangePending.id}/autorizar`, (req) => {
      adminState = { pending: [], authorized: [exchangeAuthorized] };
      req.reply({
        statusCode: 200,
        body: {
          data: { id: exchangePending.id, status: 'EM_TROCA_AUTORIZADA' },
          message: 'Troca autorizada com sucesso',
        },
      });
    }).as('authorizeExchange');

    cy.intercept('PATCH', `**/api/**admin/trocas/${exchangePending.id}/confirmar-recebimento`, (req) => {
      expect(req.body).to.deep.equal({
        itens: [{ id: 200, retornarAoEstoque: true }],
      });

      adminState = { pending: [], authorized: [] };

      req.reply({
        statusCode: 200,
        body: {
          data: { id: exchangePending.id, status: 'TROCADO' },
          message: 'Troca finalizada',
        },
      });
    }).as('confirmReceipt');

    setupAdminVisit('/admin/trocas');
    cy.get('[data-testid="admin-exchanges-section"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="pending-exchange-row-1"]').should('exist');

    cy.get('[data-testid="authorize-exchange-1"]').click();
    cy.wait('@authorizeExchange').its('response.body.data.status').should('eq', 'EM_TROCA_AUTORIZADA');
    cy.get('[data-testid="no-pending-exchanges"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="tab-authorized"]').click();
    cy.get('[data-testid="authorized-exchange-row-1"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="return-checkbox-1-200"]').should('be.checked');
    cy.get('[data-testid="confirm-receipt-1"]').click();

    cy.wait('@confirmReceipt').its('response.body.data.status').should('eq', 'TROCADO');
    cy.get('[data-testid="no-authorized-exchanges"]', { timeout: 10000 }).should('be.visible');
  });
});

describe('Reviews workflow (customer submit + admin moderation)', () => {
  beforeEach(() => {
    silenceGlobalAPIs();
  });

  it('usuário autenticado com pedido entregue vê form, envia avaliação e admin aprova/rejeita pendentes', () => {
    cy.intercept('GET', '**/clientes/transacoes**', {
      statusCode: 200,
      body: {
        data: {
          content: [deliveredOrder],
          totalElements: 1,
          totalPages: 1,
          currentPage: 0,
          size: 20,
        },
      },
    }).as('getTransactionsDelivered');

    mockBookAndReviews([]);

    cy.intercept('POST', '**/livros/1/avaliacoes', (req) => {
      expect(req.body).to.deep.equal({
        estrelas: 5,
        texto: 'Livro excelente, escrita envolvente e conteúdo muito útil.',
      });

      req.reply({
        statusCode: 201,
        body: {
          data: { id: 501, aprovada: false },
          message: 'Avaliação enviada para moderação',
        },
      });
    }).as('postReview');

    setupCustomerVisit('/account/orders');
    cy.get('[data-testid="order-history-page"]', { timeout: 10000 }).should('exist');
    cy.get(`[data-testid="order-toggle-${deliveredOrder.id}"]`).click();
    cy.get('[data-testid="order-status-badge"]').should('contain.text', 'Entregue');

    setupCustomerVisit('/product/1');
    cy.get('[data-testid="review-form-container"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="star-btn-5"]').click();
    cy.get('[data-testid="review-texto-input"]').type('Livro excelente, escrita envolvente e conteúdo muito útil.');
    cy.get('[data-testid="review-submit-btn"]').click();

    cy.wait('@postReview');
    cy.get('[data-testid="review-success"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="review-moderation-badge"]').should('contain.text', 'moderação');

    const pendingReviews = [
      {
        id: 501,
        livroId: 1,
        livroTitulo: livroFixture.titulo,
        clienteNome: clienteFixture.nome,
        estrelas: 5,
        texto: 'Livro excelente, escrita envolvente e conteúdo muito útil.',
        dataAvaliacao: '2026-02-22T12:00:00',
        aprovada: false,
      },
      {
        id: 502,
        livroId: 1,
        livroTitulo: livroFixture.titulo,
        clienteNome: 'Outro Cliente',
        estrelas: 2,
        texto: 'Não curti tanto o livro.',
        dataAvaliacao: '2026-02-22T13:00:00',
        aprovada: false,
      },
    ];

    cy.intercept('GET', '**/api/**admin/avaliacoes**', {
      statusCode: 200,
      body: {
        data: {
          content: pendingReviews,
          totalElements: pendingReviews.length,
          totalPages: 1,
          currentPage: 0,
          size: 10,
        },
      },
    }).as('getAdminReviews');

    cy.intercept('PATCH', '**/api/**admin/avaliacoes/501/aprovar', {
      statusCode: 200,
      body: { data: { id: 501, aprovada: true }, message: 'Avaliação aprovada' },
    }).as('approve501');

    cy.intercept('PATCH', '**/api/**admin/avaliacoes/502/rejeitar', {
      statusCode: 200,
      body: { data: { id: 502, aprovada: false, rejeitada: true }, message: 'Avaliação rejeitada' },
    }).as('reject502');

    setupAdminVisit('/admin/avaliacoes');
    cy.get('[data-testid="admin-reviews-section"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="review-row-501"]').should('exist');
    cy.get('[data-testid="review-row-502"]').should('exist');

    cy.get('[data-testid="approve-review-501"]').click();
    cy.wait('@approve501');
    cy.get('[data-testid="review-row-501"]').should('not.exist');

    cy.get('[data-testid="reject-review-502"]').click();
    cy.wait('@reject502');
    cy.get('[data-testid="review-row-502"]').should('not.exist');
  });

  it('avaliações aprovadas aparecem na página de detalhe do livro', () => {
    const approvedReviews = [
      {
        id: 700,
        livroId: 1,
        estrelas: 4,
        texto: 'Boa leitura, recomendo para quem está começando.',
        dataAvaliacao: '2026-02-23T14:00:00',
        cliente: { id: 12, nome: 'Cliente Aprovado' },
        aprovada: true,
      },
    ];

    mockBookAndReviews(approvedReviews);

    setupCustomerVisit('/product/1');
    cy.get('[data-testid="review-list"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="review-item-700"]').should('exist');
    cy.get('[data-testid="review-item-700"]').within(() => {
      cy.get('[data-testid="review-cliente"]').should('contain.text', 'Cliente Aprovado');
      cy.get('[data-testid="review-texto"]').should('contain.text', 'Boa leitura, recomendo para quem está começando.');
    });
  });
});
