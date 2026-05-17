
/**
 * cypress/e2e/sales-checkout-consultation-4entrega.cy.js
 *
 * 4a entrega: fluxo completo de insercao e consulta de venda com backend real + UI real.
 * Cobertura principal:
 * - Realizar compra (RF0033 / RF0037)
 * - Definir entrega e frete (RF0034 / RF0035)
 * - Definir pagamento com cupom promocional + cupom de troca + multiplos cartoes (RF0036, RN0033-RN0036)
 * - Consultar a venda apos finalizar (RF0025)
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

const addItemAndOpenCheckout = () => {
  cy.addToCart(1, 1);

  cy.visit('/cart');
  cy.get('[data-testid^="cart-item-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
  cy.get('[data-testid="checkout-btn"]').click();

  cy.get('[data-testid="checkout-page"]', { timeout: 15000 }).should('be.visible');
};

const selectAddressAndGoToCouponsStep = () => {
  addItemAndOpenCheckout();
  cy.get('[data-testid^="address-card-"]').first().click();
  cy.get('[data-testid="shipping-fee-value"]', { timeout: 15000 }).should('contain.text', 'R$');

  cy.get('[data-testid="checkout-next-btn"]').click();
  cy.get('[data-testid="step-payment"]', { timeout: 10000 }).should('be.visible');
};

const goToPaymentStepWithCoupons = () => {
  selectAddressAndGoToCouponsStep();

  cy.get('[data-testid^="trade-coupon-checkbox-"]').first().check({ force: true });
  cy.get('[data-testid="promo-coupon-input"]').clear().type(PROMO_CODE);
  cy.get('[data-testid="promo-coupon-apply-btn"]').click();

  cy.get('[data-testid="coupon-discount-result"]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-testid="trade-coupon-discount-value"]').should('contain.text', 'R$');
  cy.get('[data-testid="promo-coupon-discount-value"]').should('contain.text', 'R$');

  cy.get('[data-testid="checkout-next-btn"]').click();
  cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');
};

const goToPaymentStepWithoutCoupons = () => {
  selectAddressAndGoToCouponsStep();
  cy.get('[data-testid="checkout-next-btn"]').click();
  cy.get('[data-testid="step-payment-cards"]', { timeout: 10000 }).should('be.visible');
};

const getCardsByParity = () => {
  return cy.get('[data-testid^="payment-card-digits-"]').then(($els) => {
    const parsed = [...$els]
      .map((el) => {
        const testId = el.getAttribute('data-testid') || '';
        const cardId = testId.replace('payment-card-digits-', '');
        const text = (el.textContent || '').trim();
        const lastDigit = Number(text.slice(-1));
        return { cardId, lastDigit };
      })
      .filter((c) => !Number.isNaN(c.lastDigit));

    return {
      odd: parsed.filter((c) => c.lastDigit % 2 === 1),
      even: parsed.filter((c) => c.lastDigit % 2 === 0),
    };
  });
};

const payWithTwoOddCards = () => {
  getCardsByParity().then(({ odd }) => {
    expect(odd.length, 'cartoes impares disponiveis para split').to.be.greaterThan(1);
    cy.wrap(odd[0].cardId).as('cardA');
    cy.wrap(odd[1].cardId).as('cardB');
  });

  cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
    const remaining = parseCurrency(text);
    expect(remaining, 'valor restante apos cupons').to.be.greaterThan(0);

    const firstHalf = Number((remaining / 2).toFixed(2));
    const secondHalf = Number((remaining - firstHalf).toFixed(2));

    cy.get('@cardA').then((cardA) => {
      cy.get(`[data-testid="payment-card-checkbox-${cardA}"]`, { timeout: 10000 }).check({ force: true });
      cy.get(`[data-testid="payment-card-value-${cardA}"]`, { timeout: 10000 })
        .clear()
        .type(firstHalf.toFixed(2));
    });

    cy.get('@cardB').then((cardB) => {
      cy.get(`[data-testid="payment-card-checkbox-${cardB}"]`, { timeout: 10000 }).check({ force: true });
      cy.get(`[data-testid="payment-card-value-${cardB}"]`, { timeout: 10000 })
        .clear()
        .type(secondHalf.toFixed(2));
    });
  });

  cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
};

const payWithSingleCardById = (cardId) => {
  cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
    const remaining = parseCurrency(text);
    expect(remaining).to.be.greaterThan(0);

    cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`, { timeout: 10000 }).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${cardId}"]`, { timeout: 10000 })
      .clear()
      .type(remaining.toFixed(2));
  });
};

describe('4a entrega - insercao e consulta de venda', () => {
  beforeEach(() => {
    cy.desktop();
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    clearCartIfNeeded();
  });

  it('edge: bloqueia avancar no checkout sem endereco/frete selecionado', () => {
    addItemAndOpenCheckout();
    cy.get('[data-testid="shipping-fee-value"]').should('not.exist');
    cy.get('[data-testid="checkout-next-btn"]').should('be.disabled');
  });

  it('edge: exibe erro para cupom promocional invalido', () => {
    selectAddressAndGoToCouponsStep();

    cy.get('[data-testid="promo-coupon-input"]').clear().type('CUPOM_INEXISTENTE');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();

    cy.get('[data-testid="coupon-validation-error"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain.text', 'Cupom promocional');
  });

  it('edge: impede split com valor minimo invalido por cartao quando sem cupom', () => {
    goToPaymentStepWithoutCoupons();

    getCardsByParity().then(({ odd }) => {
      expect(odd.length, 'cartoes impares disponiveis').to.be.greaterThan(1);
      const first = odd[0].cardId;
      const second = odd[1].cardId;

      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
        const remaining = parseCurrency(text);
        expect(remaining).to.be.greaterThan(20);

        const lowValue = 5;
        const otherValue = Number((remaining - lowValue).toFixed(2));

        cy.get(`[data-testid="payment-card-checkbox-${first}"]`).check({ force: true });
        cy.get(`[data-testid="payment-card-value-${first}"]`).clear().type(lowValue.toFixed(2));

        cy.get(`[data-testid="payment-card-checkbox-${second}"]`).check({ force: true });
        cy.get(`[data-testid="payment-card-value-${second}"]`).clear().type(otherValue.toFixed(2));

        cy.get(`[data-testid="payment-card-error-${first}"]`).should('be.visible');
        cy.get('[data-testid="checkout-next-btn"]').should('be.disabled');
      });
    });
  });

  it('edge: rejeita compra com cartao de final par', () => {
    goToPaymentStepWithoutCoupons();

    getCardsByParity().then(({ even }) => {
      expect(even.length, 'cartoes pares disponiveis').to.be.greaterThan(0);
      payWithSingleCardById(even[0].cardId);
    });

    cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');

    cy.intercept('POST', '**/api/v1/checkout/finalizar').as('finalizeDeclined');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizeDeclined').then((interception) => {
      expect(interception?.response?.statusCode).to.eq(402);
    });

    cy.get('[data-testid="finalize-error"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain.text', 'Pagamento')
      .and('contain.text', 'aprovado');
    cy.url().should('include', '/checkout');
  });

  it('realiza compra com cupons + multiplos cartoes e consulta pedido no historico', () => {
    cy.intercept('GET', '**/api/v1/clientes/cupons-troca').as('getTradeCoupons');

    goToPaymentStepWithCoupons();

    cy.wait('@getTradeCoupons').then((interception) => {
      const coupons = Array.isArray(interception?.response?.body?.data)
        ? interception.response.body.data
        : [];
      expect(coupons.length, 'cupons de troca disponiveis no seed').to.be.greaterThan(0);
    });

    payWithTwoOddCards();

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-confirmation"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="confirm-shipping"]').should('contain.text', 'R$');
    cy.get('[data-testid="confirm-discount"]').should('be.visible');

    cy.intercept('POST', '**/api/v1/checkout/finalizar').as('finalizePurchase');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizePurchase').then((interception) => {
      const statusCode = interception?.response?.statusCode;
      expect(statusCode).to.eq(201);

      const reqBody = interception?.request?.body || {};
      expect(reqBody.cupomPromocional).to.eq(PROMO_CODE);
      expect(Array.isArray(reqBody.cupomsTroca)).to.eq(true);
      expect(reqBody.cupomsTroca.length).to.be.greaterThan(0);
      expect(Array.isArray(reqBody.formasPagamento)).to.eq(true);
      expect(reqBody.formasPagamento.length).to.eq(2);
    });

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="order-number"]').invoke('text').then((raw) => {
      const orderNumber = raw.trim();
      expect(orderNumber.length).to.be.greaterThan(0);
      cy.wrap(orderNumber).as('orderNumber');
    });

    cy.get('@orderNumber').then((orderNumber) => {
      const orderPattern = toOrderPattern(orderNumber);

      cy.visit('/account/orders');
      cy.get('[data-testid="order-history-page"]', { timeout: 15000 }).should('be.visible');

      cy.contains('[data-testid="order-numero"]', orderPattern, { timeout: 20000 })
        .closest('[data-testid^="order-card-"]')
        .within(() => {
          cy.get('[data-testid^="order-toggle-"]').click();
          cy.get('[data-testid="order-status-badge"]').invoke('text').should((text) => {
            expect(text.trim()).to.match(/Processamento|Aprovad[ao]/i);
          });
          cy.get('[data-testid="order-payment"]').should('contain.text', 'final');
          cy.get('[data-testid="order-address"]').should('be.visible');
        });
    });
  });
});
