/**
 * cypress/e2e/admin-clients-lifecycle.cy.js
 * Fluxo real de inativação/ativação de cliente via UI administrativa.
 */

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';
const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';

const loginAsAdminAndVisit = (path = '/admin/clientes') => {
  cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  cy.visit(path);
};

const resolveLoginClientId = () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    expect(token, 'token de admin autenticado').to.be.a('string').and.not.be.empty;

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiBaseUrl')}/admin/clientes`,
      qs: { email: CUSTOMER_EMAIL, page: 0, size: 50 },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      const content = Array.isArray(response.body?.data?.content) ? response.body.data.content : [];
      const ids = content
        .filter((client) => (client?.email || '').toLowerCase() === CUSTOMER_EMAIL)
        .map((client) => Number(client.id))
        .filter((id) => Number.isFinite(id))
        .sort((a, b) => a - b);

      expect(ids, 'ids do cliente alvo para login').to.have.length.greaterThan(0);
      cy.wrap(ids[0]).as('loginClientId');
    });
  });
};

const filterByCustomerEmail = (email) => {
  cy.get('[data-testid="admin-clients-section"]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-testid="filter-email"]').clear().type(email);
  cy.get('[data-testid="filter-submit"]').click();
  cy.get('[data-testid="admin-clients-table"]', { timeout: 15000 }).should('be.visible');
};

const setCustomerStatus = (shouldBeActive) => {
  filterByCustomerEmail(CUSTOMER_EMAIL);

  cy.get('@loginClientId').then((clientId) => {
    const rowSelector = `[data-testid="admin-client-row-${clientId}"]`;

    cy.get(rowSelector, { timeout: 15000 }).within(() => {
      cy.get('[data-testid^="client-status-"]').invoke('text').then((rawText) => {
        const statusText = (rawText || '').trim();
        const isActive = statusText.includes('Ativo');

        if (isActive !== shouldBeActive) {
          cy.intercept(
            'PATCH',
            shouldBeActive
              ? '**/api/v1/admin/clientes/*/ativar'
              : '**/api/v1/admin/clientes/*/inativar',
          ).as('toggleClientStatus');
          cy.get('[data-testid^="toggle-client-"]').click();
          cy.wait('@toggleClientStatus').its('response.statusCode').should('eq', 200);
        }
      });
    });

    filterByCustomerEmail(CUSTOMER_EMAIL);
    cy.get(rowSelector, { timeout: 15000 }).within(() => {
      cy.get('[data-testid^="client-status-"]').should(
        'contain.text',
        shouldBeActive ? 'Ativo' : 'Inativo',
      );
    });
  });
};

describe('Admin Clients Lifecycle (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('inativa cliente, bloqueia login e depois reativa cliente', () => {
    loginAsAdminAndVisit('/admin/clientes');
    resolveLoginClientId();

    // Estado inicial determinístico
    setCustomerStatus(true);

    // RF0023 — inativar cliente
    setCustomerStatus(false);
    cy.logout();

    // RN de segurança — cliente inativo não autentica
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.intercept('POST', '**/api/v1/auth/login').as('blockedLogin');
    cy.get('[data-testid="email-input"]').clear().type(CUSTOMER_EMAIL);
    cy.get('[data-testid="password-input"]').clear().type(CUSTOMER_PASSWORD);
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@blockedLogin').then((interception) => {
      const statusCode = interception?.response?.statusCode;
      expect(statusCode).to.eq(403);
    });
    cy.get('[data-testid="login-error-message"]', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/login');

    // RF0023 — reativar cliente
    loginAsAdminAndVisit('/admin/clientes');
    setCustomerStatus(true);
    cy.logout();

    // Login volta a funcionar
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.get('[data-testid="nav-user-menu"]', { timeout: 15000 }).should('be.visible');
  });
});
