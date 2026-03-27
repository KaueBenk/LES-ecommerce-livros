/**
 * cypress/e2e/checkout.cy.js
 * Checkout com backend real + UI real (sem respostas mockadas).
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';

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

const prepareCheckoutToPaymentStep = () => {
  cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
  clearCartIfNeeded();

  cy.addToCart(1, 1);

  cy.visit('/cart');
  cy.get('[data-testid^="cart-item-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
  cy.get('[data-testid="checkout-btn"]').click();

  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-testid^="address-card-"]').first().click();
  cy.get('[data-testid="shipping-fee-value"]', { timeout: 15000 }).should('contain.text', 'R$');

  cy.get('[data-testid="checkout-next-btn"]').click(); // step 2
  cy.get('[data-testid="step-payment"]', { timeout: 10000 }).should('be.visible');

  cy.get('[data-testid="checkout-next-btn"]').click(); // step 3
  cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');
};

const selectCardByParityAndFillFullAmount = (wantOddLastDigit) => {
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
        return wantOddLastDigit ? lastDigit % 2 === 1 : lastDigit % 2 === 0;
      });

      expect(selected, 'cartão compatível com a paridade esperada').to.exist;
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

describe('Checkout (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('finaliza compra com cartão de final ímpar (aprovação)', () => {
    prepareCheckoutToPaymentStep();
    selectCardByParityAndFillFullAmount(true);

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('POST', '**/api/v1/checkout/finalizar').as('finalizeApproval');
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    cy.wait('@finalizeApproval').its('response.statusCode').should('eq', 201);

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="order-number"]').should('be.visible');
  });

  it('rejeita compra com cartão de final par', () => {
    prepareCheckoutToPaymentStep();
    selectCardByParityAndFillFullAmount(false);

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('POST', '**/api/v1/checkout/finalizar').as('finalizeDeclined');
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    cy.wait('@finalizeDeclined').then((interception) => {
      const statusCode = interception?.response?.statusCode;
      const requestBody = interception?.request?.body;
      expect(statusCode, JSON.stringify(requestBody)).to.eq(402);
    });

    cy.get('[data-testid="finalize-error"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="finalize-error"]').should('contain.text', 'Pagamento não aprovado');
    cy.url().should('include', '/checkout');
  });
});
