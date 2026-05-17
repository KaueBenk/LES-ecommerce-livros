
/**
 * cypress/e2e/checkout-new-card-address.cy.js
 * 7a entrega: cadastro de novo endereco e novo cartao durante o checkout.
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';
const PROMO_CODE = 'PROMO123';

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

const fillNewAddressForm = () => {
  cy.get('[data-testid="address-apelido-input"]').clear().type('Checkout 7a Entrega');
  cy.get('[data-testid="address-tipo-select"]').select('AMBOS');
  cy.get('[data-testid="address-residencia-select"]').select('CASA');
  cy.get('[data-testid="address-logradouro-tipo-select"]').select('RUA');
  cy.get('[data-testid="address-logradouro-input"]').clear().type('Rua do Checkout');
  cy.get('[data-testid="address-numero-input"]').clear().type('123');
  cy.get('[data-testid="address-bairro-input"]').clear().type('Centro');
  cy.get('[data-testid="address-cep-input"]').clear().type('01310-100');
  cy.get('[data-testid="address-cidade-input"]').clear().type('Sao Paulo');
  cy.get('[data-testid="address-estado-select"]').select('SP');
  cy.get('[data-testid="address-pais-input"]').clear().type('Brasil');
  cy.get('[data-testid="address-form-save-button"]').click();
};

const addNewCardInCheckout = (cardNumber = '4000000000003333') => {
  cy.get('[data-testid="add-card-btn"]').click();
  cy.get('[data-testid="credit-card-form-modal"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="credit-card-numero"]').clear().type(cardNumber);
  cy.get('[data-testid="credit-card-nome"]').clear().type('CHECKOUT TESTE');
  cy.get('[data-testid="credit-card-bandeira"]').select('VISA');
  cy.get('[data-testid="credit-card-cvv"]').clear().type('123');
  cy.get('[data-testid="credit-card-form-submit"]').click();
  cy.get('[data-testid="credit-card-form-modal"]', { timeout: 15000 }).should('not.exist');
};

describe('7a entrega - novo endereco e cartao no checkout', () => {
  beforeEach(() => {
    cy.desktop();
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    clearCartIfNeeded();
  });

  it('cadastra endereco e cartao no checkout e finaliza compra', () => {
    cy.addToCart(1, 1);

    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();
    cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="add-address-btn"]').click();
    cy.get('[data-testid="address-form-modal"]', { timeout: 10000 }).should('be.visible');
    fillNewAddressForm();

    cy.contains('[data-testid^="address-card-"]', 'Checkout 7a Entrega', { timeout: 15000 })
      .click();

    cy.get('[data-testid="shipping-fee-value"]', { timeout: 15000 }).should('contain.text', 'R$');

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 10000 }).should('be.visible');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="trade-coupon-checkbox-"]').length > 0) {
        cy.get('[data-testid^="trade-coupon-checkbox-"]').first().check({ force: true });
      }
    });

    cy.get('[data-testid="promo-coupon-input"]').clear().type(PROMO_CODE);
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');

    addNewCardInCheckout();

    cy.contains('[data-testid^="payment-card-digits-"]', '3333', { timeout: 15000 })
      .invoke('attr', 'data-testid')
      .then((testId) => {
        const cardId = String(testId).replace('payment-card-digits-', '');
        cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`).check({ force: true });
        cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
          const amount = parseCurrency(text);
          expect(amount).to.be.greaterThan(0);
          cy.get(`[data-testid="payment-card-value-${cardId}"]`)
            .clear()
            .type(amount.toFixed(2));
        });
      });

    cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();

    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 15000 }).should('be.visible');
  });
});
