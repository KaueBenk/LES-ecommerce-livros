/**
 * cypress/e2e/cart-timer.cy.js
 * Validação do timer de carrinho com backend real + UI real.
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';

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

describe('Cart timer (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    clearCartIfNeeded();
  });

  afterEach(() => {
    cy.window().then((win) => {
      win.localStorage.removeItem('cart_item_ttl_minutes');
    });
  });

  it('mostra aviso e remove item quando o tempo de reserva expira', () => {
    cy.addToCart(1, 1);

    cy.visit('/cart', {
      onBeforeLoad(win) {
        // 0.1 min = 6 segundos (warning imediato e expiração rápida)
        win.localStorage.setItem('cart_item_ttl_minutes', '0.1');
      },
    });

    cy.get('[data-testid^="cart-item-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
    cy.get('[data-testid="timer-warning"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="cart-empty"]', { timeout: 25000 }).should('be.visible');
  });
});
