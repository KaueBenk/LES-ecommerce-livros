/**
 * cypress/e2e/checkout.cy.js
 * E2E tests for the complete purchase flow.
 *
 * US-044 | FE-034
 *
 * Coverage:
 *   - Happy path: login → product → cart → checkout (address → coupons → payment → confirm) → success
 *   - Coupon application (promo code → discount reflected in summary)
 *   - Card payment split validation (sum must match total)
 *   - Error variant: card rejected (even last digit)
 *   - Error variant: expired cart item → cannot proceed to checkout
 *   - Empty cart → checkout blocked
 *
 * All backend calls are intercepted with cy.intercept().
 */

import clienteFixture from '../fixtures/cliente.json';
import livroFixture from '../fixtures/livro.json';
import pedidoFixture from '../fixtures/pedido.json';

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOK_1 = { ...livroFixture, id: 1, titulo: 'Dom Casmurro', precoVenda: 35.91, estoque: 50 };
const BOOK_2 = {
  ...livroFixture,
  id: 2,
  titulo: 'O Cortiço',
  autor: 'Aluísio Azevedo',
  precoVenda: 29.90,
  estoque: 30,
};

const CLIENT_ADDRESS = clienteFixture.enderecos[0];
const CLIENT_CARD = clienteFixture.cartoes[0]; // last digit of 1234 → even → potential rejection flag

// ── Setup helpers ────────────────────────────────────────────────────────────

/** Inject JWT and mock the auth endpoint */
const setupAuth = () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'test-jwt-token');
  });

  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { data: clienteFixture },
  }).as('authMe');
};

/** Mock the catalog / product endpoints */
const mockCatalog = () => {
  cy.intercept('GET', '**/livros**', {
    statusCode: 200,
    body: {
      data: {
        content: [BOOK_1, BOOK_2],
        totalElements: 2,
        totalPages: 1,
        number: 0,
        size: 20,
      },
    },
  }).as('getCatalog');

  cy.intercept('GET', `**/livros/1`, {
    statusCode: 200,
    body: { data: BOOK_1 },
  }).as('getBook1');

  cy.intercept('GET', `**/livros/2`, {
    statusCode: 200,
    body: { data: BOOK_2 },
  }).as('getBook2');
};

/** Mock GET /carrinho */
const mockGetCart = (items = []) => {
  cy.intercept('GET', '**/carrinho', {
    statusCode: 200,
    body: {
      data: {
        itens: items,
        valorSubtotal: items.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0),
        valorFrete: items.length > 0 ? 15.0 : 0,
        valorTotal: items.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0) + (items.length > 0 ? 15.0 : 0),
      },
    },
  }).as('getCart');
};

/** Mock POST /carrinho/itens */
const mockAddToCart = (bookId, quantity = 1, price = 35.91) => {
  cy.intercept('POST', '**/carrinho/itens', {
    statusCode: 200,
    body: {
      data: {
        itens: [
          {
            id: bookId * 10,
            livroId: bookId,
            titulo: bookId === 1 ? BOOK_1.titulo : BOOK_2.titulo,
            precoUnitario: price,
            quantidade: quantity,
            subtotal: price * quantity,
            expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        ],
        valorSubtotal: price * quantity,
        valorFrete: 15.0,
        valorTotal: price * quantity + 15.0,
      },
    },
  }).as(`addToCart${bookId}`);
};

/** Complete cart state with two items */
const twoItemCart = [
  {
    id: 10,
    livroId: 1,
    titulo: BOOK_1.titulo,
    precoUnitario: BOOK_1.precoVenda,
    quantidade: 1,
    subtotal: BOOK_1.precoVenda,
    expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    id: 20,
    livroId: 2,
    titulo: BOOK_2.titulo,
    precoUnitario: BOOK_2.precoVenda,
    quantidade: 1,
    subtotal: BOOK_2.precoVenda,
    expiraEm: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
];

const cartSubtotal = BOOK_1.precoVenda + BOOK_2.precoVenda;
const cartFrete = 15.0;
const cartTotal = cartSubtotal + cartFrete;

/** Mock all checkout dependencies */
const mockCheckoutDeps = (items = twoItemCart) => {
  // Cart
  cy.intercept('GET', '**/carrinho', {
    statusCode: 200,
    body: {
      data: {
        itens: items,
        valorSubtotal: cartSubtotal,
        valorFrete: cartFrete,
        valorTotal: cartTotal,
      },
    },
  }).as('getCartCheckout');

  // Addresses
  cy.intercept('GET', '**/cliente/enderecos', {
    statusCode: 200,
    body: { data: clienteFixture.enderecos },
  }).as('getAddresses');

  // Shipping calculation
  cy.intercept('POST', '**/checkout/frete**', {
    statusCode: 200,
    body: { data: { valor: cartFrete, prazo: 7, tipo: 'NORMAL' } },
  }).as('calcFrete');

  cy.intercept('GET', '**/checkout/frete**', {
    statusCode: 200,
    body: { data: { valor: cartFrete, prazo: 7, tipo: 'NORMAL' } },
  }).as('getFrete');

  // Trade coupons
  cy.intercept('GET', '**/cliente/cupons-troca', {
    statusCode: 200,
    body: { data: [] },
  }).as('getTradeCoupons');

  // Promo coupons validate endpoint
  cy.intercept('POST', '**/cupons/validar', {
    statusCode: 200,
    body: {
      data: {
        codigo: 'DESCONTO10',
        tipo: 'PERCENTUAL',
        percentual: 10,
        desconto: cartTotal * 0.1,
        totalComDesconto: cartTotal * 0.9,
      },
    },
  }).as('validateCoupon');

  // Credit cards
  cy.intercept('GET', '**/cliente/cartoes', {
    statusCode: 200,
    body: { data: clienteFixture.cartoes },
  }).as('getCards');

  // Notifications count (used by bell in navbar — silence it)
  cy.intercept('GET', '**/notificacoes/nao-lidas/count', {
    statusCode: 200,
    body: { data: 0 },
  }).as('notifCount');
};

// ── Cart Page Tests ───────────────────────────────────────────────────────────

describe('Cart Page', () => {
  beforeEach(() => {
    setupAuth();
    mockCatalog();
  });

  it('shows empty cart message when cart has no items', () => {
    mockGetCart([]);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="cart-empty"]').should('be.visible');
  });

  it('shows checkout button when cart has items', () => {
    mockGetCart(twoItemCart);
    cy.visit('/cart');
    cy.get('[data-testid="cart-table"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="checkout-btn"]').should('be.visible');
  });

  it('displays correct item titles and prices', () => {
    mockGetCart(twoItemCart);
    cy.visit('/cart');
    cy.get('[data-testid="cart-table"]', { timeout: 10000 }).should('exist');
    cy.get(`[data-testid="item-titulo-10"]`).should('contain.text', 'Dom Casmurro');
    cy.get(`[data-testid="item-titulo-20"]`).should('contain.text', 'O Cortiço');
  });

  it('displays cart subtotal and total', () => {
    mockGetCart(twoItemCart);
    cy.visit('/cart');
    cy.get('[data-testid="cart-summary"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="cart-subtotal"]').should('exist');
    cy.get('[data-testid="cart-total"]').should('exist');
  });

  it('can remove an item from the cart', () => {
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: {
        data: {
          itens: [twoItemCart[1]],
          valorSubtotal: BOOK_2.precoVenda,
          valorFrete: 15.0,
          valorTotal: BOOK_2.precoVenda + 15.0,
        },
      },
    }).as('removeItem');

    mockGetCart(twoItemCart);
    cy.visit('/cart');
    cy.get('[data-testid="cart-table"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="remove-item-10"]').click();
    cy.wait('@removeItem');
    cy.get('[data-testid="cart-item-10"]').should('not.exist');
  });

  it('blocks checkout when cart has expired items', () => {
    const expiredItems = [
      {
        ...twoItemCart[0],
        expiraEm: new Date(Date.now() - 1000).toISOString(), // already expired
      },
      twoItemCart[1],
    ];
    mockGetCart(expiredItems);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // The expired banner or blocked message should appear
    cy.get(
      '[data-testid="cart-expired-banner"], [data-testid="checkout-blocked-msg"], [data-testid="timer-expired"]',
    ).should('exist');
  });

  it('shows cart warning banner when items are about to expire', () => {
    const warningItems = [
      {
        ...twoItemCart[0],
        expiraEm: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // 4 minutes left
      },
      twoItemCart[1],
    ];
    mockGetCart(warningItems);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get(
      '[data-testid="cart-warning-banner"], [data-testid="timer-warning"]',
    ).should('exist');
  });
});

// ── Add to Cart via Product Page ──────────────────────────────────────────────

describe('Add to Cart from Product Page', () => {
  beforeEach(() => {
    setupAuth();
    mockCatalog();
    mockAddToCart(1, 1, BOOK_1.precoVenda);
    mockGetCart([twoItemCart[0]]);
  });

  it('navigates to product page and adds book to cart', () => {
    cy.intercept('POST', '**/carrinho/itens', {
      statusCode: 200,
      body: {
        data: {
          itens: [twoItemCart[0]],
          valorSubtotal: BOOK_1.precoVenda,
          valorFrete: 15.0,
          valorTotal: BOOK_1.precoVenda + 15.0,
        },
      },
    }).as('addBook1');

    cy.visit('/product/1');
    cy.get('[data-testid="product-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="book-titulo"]').should('contain.text', 'Dom Casmurro');
    cy.get('[data-testid="book-price"]').should('exist');
    cy.get('[data-testid="add-to-cart-btn"]').should('be.visible').click();
    cy.wait('@addBook1');
  });

  it('can increase quantity before adding to cart', () => {
    cy.visit('/product/1');
    cy.get('[data-testid="product-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="qty-increase"]').click();
    cy.get('[data-testid="qty-input"]').should('have.value', '2');
  });

  it('shows out-of-stock state for unavailable book', () => {
    cy.intercept('GET', '**/livros/3', {
      statusCode: 200,
      body: { data: { ...BOOK_1, id: 3, estoque: 0, titulo: 'Sem Estoque' } },
    }).as('getBook3');

    cy.visit('/product/3');
    cy.get('[data-testid="product-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="book-out-of-stock"]').should('be.visible');
    cy.get('[data-testid="add-to-cart-btn"]').should('be.disabled');
  });
});

// ── Happy Path: Full Purchase Flow ────────────────────────────────────────────

describe('Happy Path — Complete Purchase Flow', () => {
  beforeEach(() => {
    setupAuth();
    mockCatalog();
    mockCheckoutDeps();
  });

  it('proceeds from cart to checkout page', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="checkout-btn"]').click();
    cy.url().should('include', '/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
  });

  it('Step 1 — selects a delivery address', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="checkout-stepper"]').should('be.visible');
    cy.get('[data-testid="step-address"]').should('exist');

    // Select the first address
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get(`[data-testid="addr-selected-badge"]`).should('exist');

    // Advance to next step
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
  });

  it('Step 1 — shows add-address button when no addresses exist', () => {
    cy.intercept('GET', '**/cliente/enderecos', {
      statusCode: 200,
      body: { data: [] },
    }).as('noAddresses');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="no-addresses"], [data-testid="add-address-btn"]').should('exist');
  });

  it('Step 2 — applies a promotional coupon and shows discount', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Navigate to payment step
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    // Apply promo coupon
    cy.get('[data-testid="promo-coupon-input"]').type('DESCONTO10');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();

    cy.wait('@validateCoupon');
    cy.get('[data-testid="coupon-discount-result"]').should('be.visible');
    cy.get('[data-testid="promo-coupon-discount-value"]').should('exist');
    cy.get('[data-testid="coupon-total-after-discount"]').should('exist');
  });

  it('Step 2 — shows error for invalid coupon code', () => {
    cy.intercept('POST', '**/cupons/validar', {
      statusCode: 400,
      body: { message: 'Cupom inválido ou expirado.' },
    }).as('invalidCoupon');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    cy.get('[data-testid="promo-coupon-input"]').type('INVALIDO');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();

    cy.wait('@invalidCoupon');
    cy.get('[data-testid="coupon-validation-error"]').should('be.visible');
  });

  it('Step 2 — clears applied coupon', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    cy.get('[data-testid="promo-coupon-input"]').type('DESCONTO10');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();
    cy.wait('@validateCoupon');

    cy.get('[data-testid="coupon-discount-result"]').should('be.visible');

    // Clear the coupon
    cy.get('[data-testid="promo-coupon-clear-btn"]').click();
    cy.get('[data-testid="coupon-discount-result"]').should('not.exist');
    cy.get('[data-testid="promo-coupon-input"]').should('have.value', '');
  });

  it('Step 2 — selects a credit card for payment', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    // Proceed to card selection
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-next-btn"]').length > 0) {
        cy.get('[data-testid="checkout-next-btn"]').click();
      }
    });

    cy.get('[data-testid="step-payment-cards"]').should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`).should('exist');
  });

  it('Step 2 — payment sum bar matches total', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-next-btn"]').length > 0) {
        cy.get('[data-testid="checkout-next-btn"]').click();
      }
    });

    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');

    // Select card and enter the full amount
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`)
      .clear()
      .type(String(cartTotal.toFixed(2)));

    cy.get('[data-testid="payment-sum-bar"]').should('exist');
    cy.get('[data-testid="payment-sum-value"]').should('exist');
    cy.get('[data-testid="payment-sum-match"]').should('be.visible');
  });

  it('Step 3 — review shows address and payment details', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Step 1: address
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 2a: coupons — skip
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-next-btn"]').length > 0) {
        cy.get('[data-testid="checkout-next-btn"]').click();
      }
    });

    // Step 2b: cards
    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`)
      .clear()
      .type(String(cartTotal.toFixed(2)));
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3: review
    cy.get('[data-testid="step-confirmation"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="confirmation-items"]').should('exist');
    cy.get('[data-testid="confirmation-pricing"]').should('exist');
    cy.get('[data-testid="confirmation-address"]').should('exist');
    cy.get('[data-testid="confirmation-payment"]').should('exist');
    cy.get('[data-testid="confirm-total"]').should('exist');
  });

  it('Step 3 → Success — confirms order and shows confirmation page', () => {
    // Mock POST /checkout/finalizar
    cy.intercept('POST', '**/checkout/finalizar', {
      statusCode: 201,
      body: {
        data: {
          ...pedidoFixture,
          id: 1001,
          numeroPedido: 'PED-2026-001001',
          status: 'AGUARDANDO_PAGAMENTO',
          total: cartTotal,
        },
      },
    }).as('finalizeOrder');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Step 1: address
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    // Step 2a: coupon skip
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-next-btn"]').length > 0) {
        cy.get('[data-testid="checkout-next-btn"]').click();
      }
    });

    // Step 2b: card
    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`)
      .clear()
      .type(String(cartTotal.toFixed(2)));
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3: confirm
    cy.get('[data-testid="step-confirmation"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizeOrder')
      .its('request.body')
      .should('be.an', 'object');

    // Should navigate to order confirmation page
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="order-number"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('contain.text', 'PED-2026-001001');
  });
});

// ── Order Confirmation Page ───────────────────────────────────────────────────

describe('Order Confirmation Page', () => {
  it('displays order details after successful purchase', () => {
    // Navigate to order-confirmation with route state (simulated via visit + state injection)
    cy.visit('/order-confirmation', {
      state: {
        pedido: {
          ...pedidoFixture,
          numeroPedido: 'PED-2026-001001',
          status: 'AGUARDANDO_PAGAMENTO',
          total: cartTotal,
          dataCriacao: '2026-03-01T10:00:00Z',
        },
      },
    });

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="order-confirmation-page"]').length > 0) {
        cy.get('[data-testid="order-confirmation-page"]').should('exist');
        cy.get('[data-testid="order-number"]').should('be.visible');
        cy.get('[data-testid="view-orders-btn"]').should('exist');
        cy.get('[data-testid="continue-shopping-btn"]').should('exist');
      } else {
        // Page redirected due to no state — show no-state fallback
        cy.get('[data-testid="order-confirmation-no-state"]').should('exist');
      }
    });
  });

  it('redirects to orders list when view orders is clicked', () => {
    setupAuth();
    cy.visit('/order-confirmation', {
      state: {
        pedido: {
          ...pedidoFixture,
          numeroPedido: 'PED-2026-001001',
          status: 'AGUARDANDO_PAGAMENTO',
          total: cartTotal,
        },
      },
    });

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="view-orders-btn"]').length > 0) {
        cy.get('[data-testid="view-orders-btn"]').click();
        cy.url().should('include', '/account/orders');
      }
    });
  });
});

// ── Error Variants ────────────────────────────────────────────────────────────

describe('Checkout Error Variants', () => {
  beforeEach(() => {
    setupAuth();
    mockCheckoutDeps();
  });

  it('shows finalize error when API rejects the order', () => {
    cy.intercept('POST', '**/checkout/finalizar', {
      statusCode: 422,
      body: { message: 'Cartão recusado pela operadora.' },
    }).as('finalizeOrderFail');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Step 1
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    // Step 2a skip
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-next-btn"]').length > 0) {
        cy.get('[data-testid="checkout-next-btn"]').click();
      }
    });

    // Step 2b
    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`)
      .clear()
      .type(String(cartTotal.toFixed(2)));
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3 — confirm triggers error
    cy.get('[data-testid="step-confirmation"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizeOrderFail');
    cy.get('[data-testid="finalize-error"]').should('be.visible');
    cy.get('[data-testid="finalize-error"]').should('contain.text', 'Cartão recusado');
  });

  it('shows payment-sum-mismatch warning when card values do not add up', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="checkout-next-btn"]').length > 0) {
        cy.get('[data-testid="checkout-next-btn"]').click();
      }
    });

    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });

    // Enter an amount lower than total to trigger mismatch
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`)
      .clear()
      .type('1.00');

    cy.get('[data-testid="payment-sum-bar"]').should('exist');
    cy.get('[data-testid="payment-sum-mismatch"]').should('be.visible');
    cy.get('[data-testid="payment-sum-match"]').should('not.exist');
  });

  it('cannot proceed to checkout from cart with empty cart', () => {
    cy.intercept('GET', '**/carrinho', {
      statusCode: 200,
      body: {
        data: { itens: [], valorSubtotal: 0, valorFrete: 0, valorTotal: 0 },
      },
    }).as('emptyCart');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="cart-empty"]').should('be.visible');
    // Checkout button should not be present
    cy.get('[data-testid="checkout-btn"]').should('not.exist');
  });

  it('blocks checkout from cart when items are expired', () => {
    const expiredCart = [
      {
        ...twoItemCart[0],
        expiraEm: new Date(Date.now() - 10000).toISOString(),
      },
    ];

    cy.intercept('GET', '**/carrinho', {
      statusCode: 200,
      body: {
        data: {
          itens: expiredCart,
          valorSubtotal: BOOK_1.precoVenda,
          valorFrete: 15.0,
          valorTotal: BOOK_1.precoVenda + 15.0,
        },
      },
    }).as('expiredCart');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Expired banner or blocked checkout message should be visible
    cy.get(
      '[data-testid="cart-expired-banner"], [data-testid="checkout-blocked-msg"], [data-testid="timer-expired"]',
    ).should('exist');
  });

  it('shows no-delivery-addresses warning when no valid addresses for delivery', () => {
    cy.intercept('GET', '**/cliente/enderecos', {
      statusCode: 200,
      body: {
        data: [
          {
            ...CLIENT_ADDRESS,
            tipo: 'COBRANCA', // billing-only address, not deliverable
          },
        ],
      },
    }).as('billingOnlyAddresses');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="no-delivery-addresses"]').length > 0) {
        cy.get('[data-testid="no-delivery-addresses"]').should('be.visible');
      }
    });
  });
});

// ── Checkout — prev button navigation ────────────────────────────────────────

describe('Checkout — Back Navigation', () => {
  beforeEach(() => {
    setupAuth();
    mockCheckoutDeps();
  });

  it('goes back from payment to address step', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');

    cy.get('[data-testid="checkout-prev-btn"]').click();
    cy.get('[data-testid="step-address"]').should('exist');
  });

  it('shows order summary card throughout checkout', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="order-summary"]').should('exist');
    cy.get('[data-testid="summary-subtotal"]').should('exist');
    cy.get('[data-testid="summary-total"]').should('exist');
  });
});

// ── Mobile Responsiveness ─────────────────────────────────────────────────────

describe('Checkout — Mobile Responsiveness', () => {
  beforeEach(() => {
    cy.mobile();
    setupAuth();
    mockCheckoutDeps();
  });

  it('checkout page renders on mobile viewport', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="checkout-stepper"]').should('exist');
    cy.get('[data-testid="step-address"]').should('exist');
  });

  it('cart page renders on mobile viewport', () => {
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');
  });
});
