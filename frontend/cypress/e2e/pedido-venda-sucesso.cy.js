/* global cy, describe, it, beforeEach, expect */

/**
 * cypress/e2e/pedido-venda-sucesso.cy.js
 *
 * Cenário de entrega: registro de pedido de venda com sucesso.
 * Data de entrega esperada na confirmação: 06/10/2025.
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';
const STEP_DELAY_MS = Number(Cypress.env('STEP_DELAY_MS') || 1800);

const parseCurrency = (raw) => {
  const normalized = (raw || '')
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.');
  return Number(normalized);
};

const clearCartIfNeeded = () => {
  cy.visit('/cart');
  cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('exist');

  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="clear-cart-btn"]').length > 0) {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      cy.get('[data-testid="clear-cart-btn"]').click();
      cy.get('[data-testid="cart-empty"]', { timeout: 15000 }).should('be.visible');
    }
  });
};

const pauseForDemo = () => cy.wait(STEP_DELAY_MS);
const pauseForTransition = () => cy.wait(STEP_DELAY_MS * 2);

const toOrderPattern = (orderNumber) => {
  const numeric = Number(String(orderNumber || '').replace(/\D/g, ''));
  if (Number.isNaN(numeric)) {
    return new RegExp(String(orderNumber).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  return new RegExp(`PED-0*${numeric}\\b`);
};

const showExistingOrdersBeforePurchase = () => {
  cy.visit('/account/orders');
  cy.get('[data-testid="order-history-page"]', { timeout: 20000 }).should('be.visible');
  pauseForTransition();

  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="orders-empty"]').length > 0) {
      cy.get('[data-testid="orders-empty"]').should('be.visible');
      pauseForTransition();
      return;
    }

    cy.get('[data-testid^="order-card-"]', { timeout: 20000 }).should('have.length.greaterThan', 0);
    cy.get('[data-testid^="order-card-"]').first().within(() => {
      cy.get('[data-testid="order-numero"]').should('be.visible');
      cy.get('[data-testid^="order-toggle-"]').click();
      cy.get('[data-testid="order-status-badge"]').should('be.visible');
      cy.get('[data-testid="order-payment"]').should('be.visible');
    });
    pauseForTransition();
  });
};

const prepareCheckoutToPaymentStep = () => {
  cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  pauseForTransition();
  showExistingOrdersBeforePurchase();

  clearCartIfNeeded();
  pauseForDemo();

  cy.addToCart(1, 1);
  pauseForDemo();

  cy.visit('/cart');
  cy.get('[data-testid^="cart-item-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
  cy.get('[data-testid="checkout-btn"]').click();
  pauseForTransition();

  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-testid^="address-card-"]').first().click();
  pauseForTransition();
  cy.get('[data-testid="shipping-fee-value"]', { timeout: 15000 }).should('contain.text', 'R$');

  cy.get('[data-testid="checkout-next-btn"]').click(); // step 2
  pauseForTransition();
  cy.get('[data-testid="step-payment"]', { timeout: 10000 }).should('be.visible');

  cy.get('[data-testid="checkout-next-btn"]').click(); // step 3
  pauseForTransition();
  cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');
};

const selectOddCardAndFillFullAmount = () => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('auth_token');
    expect(token, 'token de autenticação no localStorage').to.be.a('string').and.not.be.empty;

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiBaseUrl')}/clientes/cartoes`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then((response) => {
      const cards = Array.isArray(response.body?.data) ? response.body.data : [];
      const selected = cards.find((card) => {
        const digits = String(card?.numero || '').replace(/\D/g, '');
        if (!digits) return false;
        const lastDigit = Number(digits.slice(-1));
        return lastDigit % 2 === 1;
      });

      expect(selected, 'cartão de final ímpar disponível').to.exist;
      cy.wrap(String(selected.id)).as('selectedCardId');
    });
  });

  cy.get('@selectedCardId').then((cardId) => {
    cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`, { timeout: 10000 }).check({ force: true });
    cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
      const amount = parseCurrency(text);
      expect(amount).to.be.greaterThan(0);

      cy.get(`[data-testid="payment-card-value-${cardId}"]`, { timeout: 10000 })
        .clear()
        .type(amount.toFixed(2));
    });
  });

  cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
};

describe('Entrega - Registro de pedido de venda com sucesso', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('registra pedido com sucesso e exibe entrega prevista em 06/10/2025', () => {
    prepareCheckoutToPaymentStep();

    selectOddCardAndFillFullAmount();
    pauseForTransition();

    cy.get('[data-testid="checkout-next-btn"]').click();
    pauseForTransition();
    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="confirm-purchase-btn"]').click();
    pauseForTransition();

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="order-number"]').should('be.visible').invoke('text').then((text) => {
      const orderNumber = text.trim();
      expect(orderNumber).to.match(/^PED-\d+/);
      cy.wrap(orderNumber).as('orderNumber');
    });
    cy.get('[data-testid="order-delivery-date"]').invoke('text').should((text) => {
      expect(text.trim()).to.match(/\d{2}\/\d{2}\/\d{4}/);
    });
    pauseForTransition();

    // Evidência 1: pedido existe no histórico do cliente.
    cy.get('[data-testid="view-orders-btn"]').click();
    pauseForTransition();
    cy.url({ timeout: 15000 }).should('include', '/account/orders');
    cy.get('[data-testid="order-history-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('@orderNumber').then((orderNumber) => {
      const orderPattern = toOrderPattern(orderNumber);
      cy.contains('[data-testid="order-numero"]', orderPattern, { timeout: 20000 })
        .closest('[data-testid^="order-card-"]')
        .within(() => {
          cy.get('[data-testid^="order-toggle-"]').click();
          cy.get('[data-testid="order-status-badge"]').invoke('text').should((text) => {
            expect(text.trim()).to.match(/Processamento|Aprovad[ao]/i);
          });
          cy.get('[data-testid="order-payment"]').should('be.visible');
        });
    });
    pauseForTransition();

    // Evidência 2: login como admin e visualização do mesmo pedido no painel logístico.
    cy.logout();
    pauseForTransition();

    cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    pauseForTransition();

    cy.visit('/admin/logistica');
    cy.get('[data-testid="logistics-page"]', { timeout: 20000 }).should('be.visible');
    pauseForTransition();

    cy.get('@orderNumber').then((orderNumber) => {
      const orderPattern = toOrderPattern(orderNumber);

      cy.contains('[data-testid^="order-numero-"]', orderPattern, { timeout: 20000 })
        .closest('tr')
        .as('adminOrderRow');

      cy.get('@adminOrderRow').click();
      cy.get('[data-testid="order-detail-modal"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid="modal-order-numero"]').should('contain.text', orderNumber);
      cy.get('[data-testid="modal-order-status"]').invoke('text').should((text) => {
        expect(text.trim()).to.match(/Aprovad[ao]|Em Processamento/i);
      });
      cy.get('[data-testid="modal-client-email"]').should('contain.text', CUSTOMER_EMAIL);
    });
    pauseForTransition();
  });
});