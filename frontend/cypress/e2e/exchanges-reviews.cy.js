/**
 * cypress/e2e/exchanges-reviews.cy.js
 * Fluxos reais de troca e avaliação/moderação.
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';

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

const loginCustomer = () => cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
const loginAdmin = () => cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);

const logoutViaUi = () => {
  cy.get('[data-testid="nav-user-menu"]').click();
  cy.get('[data-testid="nav-logout"]').click();
  cy.url({ timeout: 10000 }).should('include', '/login');
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

const completeCheckoutWithOddCard = () => {
  clearCartIfNeeded();
  cy.addToCart(1, 1);

  cy.visit('/cart');
  cy.get('[data-testid="checkout-btn"]').click();

  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-testid^="address-card-"]').first().click();
  cy.get('[data-testid="shipping-fee-value"]', { timeout: 15000 }).should('contain.text', 'R$');

  cy.get('[data-testid="checkout-next-btn"]').click();
  cy.get('[data-testid="step-payment"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="checkout-next-btn"]').click();
  cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');

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
    expect(odd, 'cartão ímpar para aprovação').to.exist;
    cy.wrap(odd.cardId).as('oddCardId');
  });

  cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
    const amount = parseCurrency(text);
    cy.get('@oddCardId').then((cardId) => {
      cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`).check({ force: true });
      cy.get(`[data-testid="payment-card-value-${cardId}"]`, { timeout: 10000 })
        .clear()
        .type(amount.toFixed(2));
    });
  });

  cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="checkout-next-btn"]').click();
  cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');

  cy.get('[data-testid="checkout-finish-btn"]').click();
  cy.url({ timeout: 20000 }).should('include', '/order-confirmation');

  cy.get('[data-testid="order-number"]').invoke('text').then((raw) => {
    const orderNumber = raw.trim();
    expect(orderNumber.length).to.be.greaterThan(0);
    cy.wrap(orderNumber).as('createdOrderNumber');
  });
};

const dispatchAndDeliverOrderAsAdmin = () => {
  cy.get('@createdOrderNumber').then((orderNumber) => {
    cy.visit('/admin/logistica');
    cy.get('[data-testid="logistics-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="filter-status"]').select('APROVADA');
    cy.get('[data-testid="filter-submit"]').click();

    cy.contains('[data-testid^="order-row-"]', orderNumber, { timeout: 20000 }).within(() => {
      cy.get('[data-testid^="dispatch-btn-"]').click();
    });

    cy.get('[data-testid="confirm-modal-ok"]').click();

    cy.get('[data-testid="filter-status"]').select('EM_TRANSITO');
    cy.get('[data-testid="filter-submit"]').click();

    cy.contains('[data-testid^="order-row-"]', orderNumber, { timeout: 20000 }).within(() => {
      cy.get('[data-testid^="deliver-btn-"]').click();
    });

    cy.get('[data-testid="confirm-modal-ok"]').click();
  });
};

describe('Trocas (cliente + admin) com backend real', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('realiza ciclo completo: solicitar troca, autorizar e confirmar recebimento', () => {
    const exchangeMarker = `TROCA-E2E-${Date.now()}`;

    loginCustomer();
    completeCheckoutWithOddCard();
    logoutViaUi();

    loginAdmin();
    dispatchAndDeliverOrderAsAdmin();
    logoutViaUi();

    loginCustomer();
    cy.get('@createdOrderNumber').then((orderNumber) => {
      const orderPattern = toOrderPattern(orderNumber);
      cy.visit('/account/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 15000 }).should('be.visible');

      cy.contains('[data-testid="order-numero"]', orderPattern, { timeout: 20000 })
        .closest('[data-testid^="order-card-"]')
        .within(() => {
          cy.get('[data-testid^="order-toggle-"]').click();
          cy.get('[data-testid^="exchange-btn-"]').click();
        });

      cy.get('[data-testid="exchange-modal"]', { timeout: 10000 }).should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type(
        `${exchangeMarker} Produto com defeito identificado em teste E2E real.`,
      );
      cy.get('[data-testid="exchange-submit-btn"]').click();
      cy.get('[data-testid="exchange-modal"]', { timeout: 10000 }).should('not.exist');
    });

    logoutViaUi();

    loginAdmin();
    cy.get('@createdOrderNumber').then(() => {
      cy.visit('/admin/trocas');
      cy.get('[data-testid="admin-exchanges-section"]', { timeout: 15000 }).should('be.visible');

      cy.contains('[data-testid^="pending-exchange-row-"]', exchangeMarker, { timeout: 20000 })
        .should('be.visible')
        .invoke('attr', 'data-testid')
        .then((rowTestId) => {
          const exchangeId = String(rowTestId).replace('pending-exchange-row-', '');
          cy.wrap(exchangeId).as('exchangeId');
          cy.get(`[data-testid="authorize-exchange-${exchangeId}"]`).click();
        });

      cy.get('[data-testid="tab-authorized"]').click();

      cy.get('@exchangeId').then((exchangeId) => {
        cy.get(`[data-testid="authorized-exchange-row-${exchangeId}"]`, { timeout: 20000 })
          .within(() => {
            cy.get(`[data-testid="confirm-receipt-${exchangeId}"]`).click();
          });
        });
    });

    logoutViaUi();

    loginCustomer();
    cy.get('@createdOrderNumber').then((orderNumber) => {
      const orderPattern = toOrderPattern(orderNumber);
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', orderPattern, { timeout: 20000 })
        .closest('[data-testid^="order-card-"]')
        .within(() => {
          cy.get('[data-testid^="order-toggle-"]').click();
          cy.get('[data-testid="order-status-badge"]').invoke('text').should((text) => {
            expect(text.trim()).to.match(/Troca|Trocado|TROCADO/i);
          });
        });
    });
  });
});

describe('Avaliações (cliente + moderação admin) com backend real', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('cliente envia avaliação e admin aprova, tornando-a visível publicamente', () => {
    const marker = `E2E-${Date.now()}`;
    const reviewText = `${marker} Livro excelente para estudo e prática profissional.`;

    loginCustomer();
    cy.visit('/product/1');
    cy.get('[data-testid="review-form-container"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="star-btn-5"]').click();
    cy.get('[data-testid="review-texto-input"]').type(reviewText);
    cy.get('[data-testid="review-submit-btn"]').click();

    cy.get('[data-testid="review-success"]', { timeout: 15000 }).should('be.visible');
    logoutViaUi();

    loginAdmin();
    cy.visit('/admin/avaliacoes');
    cy.get('[data-testid="admin-reviews-section"]', { timeout: 15000 }).should('be.visible');

    cy.contains('[data-testid^="review-row-"]', marker, { timeout: 20000 }).within(() => {
      cy.get('[data-testid^="approve-review-"]').click();
    });

    cy.contains('[data-testid^="review-row-"]', marker).should('not.exist');
    logoutViaUi();

    loginCustomer();
    cy.visit('/product/1');
    cy.get('[data-testid="review-list"]', { timeout: 15000 }).should('be.visible');
    cy.contains('[data-testid="review-texto"]', marker, { timeout: 20000 }).should('be.visible');
  });
});
