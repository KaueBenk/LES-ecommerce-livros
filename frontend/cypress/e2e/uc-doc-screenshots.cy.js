
/**
 * cypress/e2e/uc-doc-screenshots.cy.js
 *
 * Captura de screenshots para documentação de Caso de Uso.
 * Fluxo: catálogo -> produto -> carrinho -> checkout -> confirmação -> histórico.
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

const toOrderPattern = (orderNumber) => {
  const numeric = Number(String(orderNumber || '').replace(/\D/g, ''));
  if (Number.isNaN(numeric)) {
    return new RegExp(String(orderNumber).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  return new RegExp(`PED-0*${numeric}\\b`);
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

describe('UC Doc - Captura de screenshots (fluxo real)', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('captura telas do fluxo de compra', () => {
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    clearCartIfNeeded();

    // 1) Catálogo
    cy.visit('/catalog');
    cy.get('[data-testid="catalog-page"]', { timeout: 15000 }).should('be.visible');
    cy.screenshot('uc-doc/01-catalogo');

    // 2) Produto
    cy.visit('/product/1');
    cy.get('[data-testid="product-page"]', { timeout: 15000 }).should('be.visible');
    cy.screenshot('uc-doc/02-produto');

    // 3) Carrinho
    // Usa o comando customizado para tolerar variações de estoque/botão no detalhe.
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid^="cart-item-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
    cy.screenshot('uc-doc/03-carrinho');

    // 4) Checkout - Endereço
    cy.get('[data-testid="checkout-btn"]').click();
    cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="step-address"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="shipping-fee-value"]', { timeout: 15000 }).should('contain.text', 'R$');
    cy.screenshot('uc-doc/04-checkout-endereco');

    // 5) Checkout - Cupons
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 10000 }).should('be.visible');
    cy.screenshot('uc-doc/05-checkout-cupons');

    // Tenta aplicar cupom promocional de seed (se existir)
    cy.get('[data-testid="promo-coupon-input"]').clear().type(PROMO_CODE);
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="coupon-discount-result"]').length > 0) {
        cy.get('[data-testid="coupon-discount-result"]').should('be.visible');
      }
    });
    cy.screenshot('uc-doc/06-checkout-cupons-aplicados');

    // 6) Checkout - Pagamento
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');
    cy.screenshot('uc-doc/07-checkout-pagamento');

    // Seleciona cartão com final ímpar e paga o valor restante total
    cy.get('[data-testid^="payment-card-digits-"]').then(($els) => {
      const cards = [...$els]
        .map((el) => {
          const testId = el.getAttribute('data-testid') || '';
          const cardId = testId.replace('payment-card-digits-', '');
          const text = (el.textContent || '').trim();
          const lastDigit = Number(text.slice(-1));
          return { cardId, lastDigit };
        })
        .filter((c) => !Number.isNaN(c.lastDigit));

      const odd = cards.find((c) => c.lastDigit % 2 === 1);
      expect(odd, 'cartão de final ímpar disponível').to.exist;
      cy.wrap(odd.cardId).as('oddCardId');
    });

    cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
      const amount = parseCurrency(text);
      expect(amount).to.be.greaterThan(0);

      cy.get('@oddCardId').then((cardId) => {
        cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`, { timeout: 10000 }).check({ force: true });
        cy.get(`[data-testid="payment-card-value-${cardId}"]`, { timeout: 10000 })
          .clear()
          .type(amount.toFixed(2));
      });
    });

    cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');

    // 7) Checkout - Confirmação
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');
    cy.screenshot('uc-doc/08-checkout-confirmacao');

    // 8) Pedido confirmado
    cy.intercept('POST', '**/api/v1/checkout/finalizar').as('finalizeOrder');
    cy.get('[data-testid="checkout-finish-btn"]').click();
    cy.wait('@finalizeOrder').its('response.statusCode').should('eq', 201);

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 15000 }).should('be.visible');
    cy.screenshot('uc-doc/09-confirmacao-pedido');

    cy.get('[data-testid="order-number"]').invoke('text').then((raw) => {
      const orderNumber = raw.trim();
      expect(orderNumber.length).to.be.greaterThan(0);
      cy.wrap(orderNumber).as('orderNumber');
    });

    // 9) Histórico de pedidos
    cy.visit('/account/orders');
    cy.get('[data-testid="order-history-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('@orderNumber').then((orderNumber) => {
      const orderPattern = toOrderPattern(orderNumber);

      cy.contains('[data-testid="order-numero"]', orderPattern, { timeout: 20000 })
        .closest('[data-testid^="order-card-"]')
        .within(() => {
          cy.get('[data-testid^="order-toggle-"]').click();
          cy.get('[data-testid="order-status-badge"]').should('be.visible');
        });
    });

    cy.screenshot('uc-doc/10-historico-pedidos');
  });
});
