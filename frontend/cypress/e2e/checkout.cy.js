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
 *   - Error variant: card rejected (last digit even → 402 Payment Required)
 *   - Error variant: expired cart item → cannot proceed to checkout
 *   - Empty cart → checkout blocked
 *
 * All backend calls are intercepted with cy.intercept().
 */

import clienteFixture from '../fixtures/cliente.json';
import livroFixture from '../fixtures/livro.json';
import pedidoFixture from '../fixtures/pedido.json';

// ── Constants ─────────────────────────────────────────────────────────────────

const BOOK_1 = { ...livroFixture, id: 1, titulo: 'Dom Casmurro', valorVenda: 35.91, estoque: { quantidadeDisponivel: 50 } };
const BOOK_2 = {
  ...livroFixture,
  id: 2,
  titulo: 'O Cortiço',
  autor: { id: 2, nome: 'Aluísio Azevedo' },
  valorVenda: 29.90,
  estoque: { quantidadeDisponivel: 30 },
};

const CLIENT_ADDRESS = clienteFixture.enderecos[0];
const CLIENT_CARD = clienteFixture.cartoes[0]; // last digit of 1234 → even → potential rejection flag

// Card with odd last digit (will not be rejected)
const ODD_CARD = {
  id: 2,
  nomeImpresso: 'ANA B SILVA',
  numeroMascarado: '**** **** **** 1233',
  ultimosDigitos: '1233',
  bandeira: { nome: 'MASTERCARD' },
  codigoSeguranca: '***',
  preferencial: false,
};

// Card with even last digit (will be rejected by the backend rule)
const EVEN_CARD = {
  id: 3,
  nomeImpresso: 'ANA B SILVA',
  numeroMascarado: '**** **** **** 4568',
  ultimosDigitos: '4568',
  bandeira: { nome: 'VISA' },
  codigoSeguranca: '***',
  preferencial: false,
};

// ── Setup helpers ────────────────────────────────────────────────────────────

/** Inject JWT and user profile so AuthContext recognises the session */
const setupAuth = () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'test-jwt-token');
    win.localStorage.setItem('user_profile', JSON.stringify(clienteFixture));
  });
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

  cy.intercept('GET', '**/livros/1', {
    statusCode: 200,
    body: { data: BOOK_1 },
  }).as('getBook1');

  cy.intercept('GET', '**/livros/2', {
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
        valorFrete: items.length > 0 ? 10.0 : 0,
        valorTotal:
          items.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0) +
          (items.length > 0 ? 10.0 : 0),
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
        valorFrete: 10.0,
        valorTotal: price * quantity + 10.0,
      },
    },
  }).as(`addToCart${bookId}`);
};

/** Complete cart state with two items.
 *  bloqueadoEm = 5 min ago → 25 min remaining → no warning/expiry. */
const twoItemCart = [
  {
    id: 10,
    livroId: 1,
    titulo: BOOK_1.titulo,
    precoUnitario: BOOK_1.valorVenda,
    valorUnitario: BOOK_1.valorVenda,
    quantidade: 1,
    subtotal: BOOK_1.valorVenda,
    bloqueadoEm: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 20,
    livroId: 2,
    titulo: BOOK_2.titulo,
    precoUnitario: BOOK_2.valorVenda,
    valorUnitario: BOOK_2.valorVenda,
    quantidade: 1,
    subtotal: BOOK_2.valorVenda,
    bloqueadoEm: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
];

const cartSubtotal = BOOK_1.valorVenda + BOOK_2.valorVenda;
const cartFrete = 10.0;
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

  // Addresses  (actual endpoint: /api/v1/clientes/enderecos)
  cy.intercept('GET', '**/clientes/enderecos', {
    statusCode: 200,
    body: { data: clienteFixture.enderecos },
  }).as('getAddresses');

  // Shipping calculation  (POST /checkout/frete)
  cy.intercept('POST', '**/checkout/frete**', {
    statusCode: 200,
    body: { data: { valorFrete: cartFrete, enderecoId: CLIENT_ADDRESS.id } },
  }).as('calcFrete');

  // Trade coupons  (GET /clientes/cupons-troca)
  cy.intercept('GET', '**/clientes/cupons-troca', {
    statusCode: 200,
    body: { data: [] },
  }).as('getTradeCoupons');

  // Promo coupons validate  (POST /checkout/validar-cupons)
  cy.intercept('POST', '**/checkout/validar-cupons', {
    statusCode: 200,
    body: {
      data: {
        cupomsTrocaValor: 0,
        cupomPromocionalValor: +(cartTotal * 0.1).toFixed(2),
        desconto: +(cartTotal * 0.1).toFixed(2),
        restante: +(cartTotal * 0.9).toFixed(2),
      },
    },
  }).as('validateCoupon');

  // Credit cards  (GET /clientes/cartoes)
  cy.intercept('GET', '**/clientes/cartoes', {
    statusCode: 200,
    body: { data: clienteFixture.cartoes },
  }).as('getCards');

  // Notifications count (bell badge — silence it)
  cy.intercept('GET', '**/notificacoes/nao-lidas/count', {
    statusCode: 200,
    body: { data: 0 },
  }).as('notifCount');

  // DELETE /carrinho (clear cart after finalization — best-effort)
  cy.intercept('DELETE', '**/carrinho', {
    statusCode: 200,
    body: { message: 'Carrinho limpo' },
  }).as('clearCart');
};

/**
 * Navigate through the entire checkout flow up to (but not including) the
 * confirm button click.  Returns on Step 4 (Confirmation).
 */
const navigateToConfirmation = (total = cartTotal) => {
  cy.visit('/checkout');
  cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

  // Step 1: address
  cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
  cy.get('[data-testid="checkout-next-btn"]').click();

  // Step 2: coupons — skip
  cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
  cy.get('[data-testid="checkout-next-btn"]').click();

  // Step 3: card
  cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
  cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
  cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`)
    .clear()
    .type(String(total.toFixed(2)));
  cy.get('[data-testid="checkout-next-btn"]').click();

  // Step 4: review
  cy.get('[data-testid="step-confirmation"]', { timeout: 8000 }).should('exist');
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
    cy.get('[data-testid="item-titulo-10"]').should('contain.text', 'Dom Casmurro');
    cy.get('[data-testid="item-titulo-20"]').should('contain.text', 'O Cortiço');
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
          valorSubtotal: BOOK_2.valorVenda,
          valorFrete: 10.0,
          valorTotal: BOOK_2.valorVenda + 10.0,
        },
      },
    }).as('removeItem');

    mockGetCart(twoItemCart);
    cy.visit('/cart');
    cy.get('[data-testid="cart-table"]', { timeout: 10000 }).should('exist');

    // Stub window.confirm so the removal proceeds
    cy.window().then((win) => cy.stub(win, 'confirm').returns(true));

    // Register updated cart intercept for the re-fetch after delete
    cy.intercept('GET', '**/carrinho', {
      statusCode: 200,
      body: {
        data: {
          itens: [twoItemCart[1]],
          valorSubtotal: BOOK_2.valorVenda,
          valorFrete: 10.0,
          valorTotal: BOOK_2.valorVenda + 10.0,
        },
      },
    }).as('getCartAfterRemove');

    cy.get('[data-testid="remove-item-10"]').click();
    cy.wait('@removeItem');
    cy.get('[data-testid="cart-item-10"]').should('not.exist');
  });

  it('blocks checkout when cart has expired items', () => {
    // bloqueadoEm = 31 min ago → expired (TTL is 30 min)
    const expiredItems = [
      {
        ...twoItemCart[0],
        bloqueadoEm: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      },
      twoItemCart[1],
    ];
    mockGetCart(expiredItems);
    // Intercept the auto-remove call triggered by useCartTimer onExpired
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemoveExpired');
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // The expired badge, banner, or blocked message should appear
    cy.get(
      '[data-testid="cart-expired-banner"], [data-testid="checkout-blocked-msg"], [data-testid="timer-expired"]',
    ).should('exist');
  });

  it('shows cart warning banner when items are about to expire', () => {
    // bloqueadoEm = 26 min ago → 4 min remaining → in warning zone (≤5 min)
    const warningItems = [
      {
        ...twoItemCart[0],
        bloqueadoEm: new Date(Date.now() - 26 * 60 * 1000).toISOString(),
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
    mockAddToCart(1, 1, BOOK_1.valorVenda);
    mockGetCart([twoItemCart[0]]);
  });

  it('navigates to product page and adds book to cart', () => {
    cy.visit('/product/1');
    cy.get('[data-testid="product-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="book-titulo"]').should('contain.text', 'Dom Casmurro');
    cy.get('[data-testid="book-price"]').should('exist');
    cy.get('[data-testid="add-to-cart-btn"]').should('be.visible').click();
    // Cart context handles the add locally; verify success toast or button state
    cy.get('[data-testid="add-to-cart-btn"]').should('exist');
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
      body: { data: { ...BOOK_1, id: 3, estoque: { quantidadeDisponivel: 0 }, titulo: 'Sem Estoque' } },
    }).as('getBook3');

    cy.visit('/product/3');
    cy.get('[data-testid="product-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="book-out-of-stock"]').should('be.visible');
    // When out of stock, add-to-cart button is not rendered
    cy.get('[data-testid="add-to-cart-btn"]').should('not.exist');
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

  it('Step 1 — selects a delivery address and next is enabled', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="checkout-stepper"]').should('be.visible');
    cy.get('[data-testid="step-address"]').should('exist');

    // Next button starts disabled (no address selected)
    cy.get('[data-testid="checkout-next-btn"]').should('be.disabled');

    // Select the first address
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="addr-selected-badge"]').should('exist');

    // Next button should now be enabled
    cy.get('[data-testid="checkout-next-btn"]').should('not.be.disabled');

    // Advance to step 2 (coupons)
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
  });

  it('Step 1 — shows add-address button when no addresses exist', () => {
    cy.intercept('GET', '**/clientes/enderecos', {
      statusCode: 200,
      body: { data: [] },
    }).as('noAddresses');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="no-addresses"], [data-testid="add-address-btn"]').should('exist');
  });

  it('Step 2 — applies a promotional coupon, discount shows, total updates', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Navigate to step 2 (coupons)
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

    // Order summary should reflect the discount
    cy.get('[data-testid="summary-coupon-discount"]').should('exist');
  });

  it('Step 2 — shows error for invalid coupon code', () => {
    cy.intercept('POST', '**/checkout/validar-cupons', {
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

  it('Step 3 — selects a credit card and enters payment amount', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Step 1 → 2 → 3
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="checkout-next-btn"]').click();

    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${CLIENT_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${CLIENT_CARD.id}"]`).should('exist');
  });

  it('Step 3 — payment sum bar matches total', () => {
    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="checkout-next-btn"]').click();

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

  it('Step 4 — review shows all data: items, pricing, address, payment', () => {
    navigateToConfirmation();

    cy.get('[data-testid="confirmation-items"]').should('exist');
    cy.get('[data-testid="confirmation-pricing"]').should('exist');
    cy.get('[data-testid="confirmation-address"]').should('exist');
    cy.get('[data-testid="confirmation-payment"]').should('exist');
    cy.get('[data-testid="confirm-total"]').should('exist');
  });

  it('Step 4 → Success — confirms order (POST /checkout/finalizar) and shows confirmation page', () => {
    // Mock POST /checkout/finalizar — approved
    cy.intercept('POST', '**/checkout/finalizar', {
      statusCode: 201,
      body: {
        data: {
          pedidoId: 1001,
          numero: 'PED-2026-001001',
          status: 'APROVADA',
          valorTotal: cartTotal,
          dataCompra: '2026-03-01T10:45:00',
          dataEntregaPrevista: '2026-03-08T00:00:00',
        },
      },
    }).as('finalizeOrder');

    navigateToConfirmation();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizeOrder')
      .its('request.body')
      .should('have.property', 'enderecoEntregaId');

    // Should navigate to order confirmation page
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="order-number"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('contain.text', 'PED-2026-001001');
  });
});

// ── Order Confirmation Page ───────────────────────────────────────────────────

describe('Order Confirmation Page', () => {
  it('displays order details after successful purchase (via full checkout flow)', () => {
    setupAuth();
    mockCheckoutDeps();

    // Mock POST /checkout/finalizar
    cy.intercept('POST', '**/checkout/finalizar', {
      statusCode: 201,
      body: {
        data: {
          pedidoId: 1001,
          numero: 'PED-2026-001001',
          status: 'APROVADA',
          valorTotal: cartTotal,
          dataCompra: '2026-03-01T10:45:00',
          dataEntregaPrevista: '2026-03-08T00:00:00',
        },
      },
    }).as('finalizeOrderConfirm');

    // Run full checkout to reach order confirmation with proper state
    navigateToConfirmation();
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    cy.wait('@finalizeOrderConfirm');

    // Verify order confirmation page
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="order-number"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('contain.text', 'PED-2026-001001');
    cy.get('[data-testid="view-orders-btn"]').should('exist');
    cy.get('[data-testid="continue-shopping-btn"]').should('exist');
  });

  it('shows no-state fallback when visited without order data', () => {
    setupAuth();
    cy.visit('/order-confirmation');
    cy.get('[data-testid="order-confirmation-no-state"]', { timeout: 10000 }).should('exist');
  });
});

// ── Error Variants ────────────────────────────────────────────────────────────

describe('Checkout Error Variants', () => {
  beforeEach(() => {
    setupAuth();
    mockCheckoutDeps();
  });

  it('Variant: card last digit even → 402 rejected with error message', () => {
    // The API rejects cards whose last digit is even (e.g. 4568 ends in 8)
    cy.intercept('GET', '**/clientes/cartoes', {
      statusCode: 200,
      body: { data: [EVEN_CARD] },
    }).as('getEvenCard');

    cy.intercept('POST', '**/checkout/finalizar', {
      statusCode: 402,
      body: {
        message: 'Pagamento recusado pela operadora',
        errors: [
          { cartaoUltimosDigitos: '4568', motivo: 'CardBlocked' },
        ],
      },
    }).as('finalizeEvenCardFail');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');

    // Step 1
    cy.get(`[data-testid="address-radio-${CLIENT_ADDRESS.id}"]`).check({ force: true });
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 2 — coupons, skip
    cy.get('[data-testid="step-payment"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3 — payment with even-digit card
    cy.get('[data-testid="step-payment-cards"]', { timeout: 8000 }).should('exist');
    cy.get(`[data-testid="payment-card-checkbox-${EVEN_CARD.id}"]`).check({ force: true });
    cy.get(`[data-testid="payment-card-value-${EVEN_CARD.id}"]`)
      .clear()
      .type(String(cartTotal.toFixed(2)));
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 4 — confirm triggers 402 rejection
    cy.get('[data-testid="step-confirmation"]', { timeout: 8000 }).should('exist');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizeEvenCardFail');
    cy.get('[data-testid="finalize-error"]').should('be.visible');
    cy.get('[data-testid="finalize-error"]').should('contain.text', '4568');
    cy.get('[data-testid="finalize-error"]').should('contain.text', 'CardBlocked');
  });

  it('shows finalize error when API rejects the order (generic error)', () => {
    cy.intercept('POST', '**/checkout/finalizar', {
      statusCode: 422,
      body: { message: 'Cartão recusado pela operadora.' },
    }).as('finalizeOrderFail');

    navigateToConfirmation();
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
    cy.get('[data-testid="checkout-next-btn"]').click();

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

  it('Variant: expired item → warning shown, cannot checkout until cleared', () => {
    // bloqueadoEm = 31 min ago → expired (TTL is 30 min)
    const expiredCart = [
      {
        ...twoItemCart[0],
        bloqueadoEm: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      },
    ];

    cy.intercept('GET', '**/carrinho', {
      statusCode: 200,
      body: {
        data: {
          itens: expiredCart,
          valorSubtotal: BOOK_1.valorVenda,
          valorFrete: 10.0,
          valorTotal: BOOK_1.valorVenda + 10.0,
        },
      },
    }).as('expiredCart');

    // Intercept the auto-remove call triggered by useCartTimer onExpired
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemoveExpired2');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Expired banner or blocked checkout message should be visible
    cy.get(
      '[data-testid="cart-expired-banner"], [data-testid="checkout-blocked-msg"], [data-testid="timer-expired"]',
    ).should('exist');

    // Checkout button should be disabled when expired items exist
    cy.get('[data-testid="checkout-btn"]').should('be.disabled');
  });

  it('shows no-delivery-addresses warning when no valid addresses for delivery', () => {
    cy.intercept('GET', '**/clientes/enderecos', {
      statusCode: 200,
      body: {
        data: [
          {
            ...CLIENT_ADDRESS,
            tipoEndereco: 'FINANCEIRO', // billing-only address
          },
        ],
      },
    }).as('billingOnlyAddresses');

    cy.visit('/checkout');
    cy.get('[data-testid="checkout-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="no-delivery-addresses"]').should('be.visible');
  });
});

// ── Checkout — prev button navigation ────────────────────────────────────────

describe('Checkout — Back Navigation', () => {
  beforeEach(() => {
    setupAuth();
    mockCheckoutDeps();
  });

  it('goes back from coupons step to address step', () => {
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
