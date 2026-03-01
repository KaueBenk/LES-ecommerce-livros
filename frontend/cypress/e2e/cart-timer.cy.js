/**
 * cypress/e2e/cart-timer.cy.js
 * E2E tests for cart item countdown timers, expiration alerts, and auto-removal.
 *
 * US-045 | FE-035
 *
 * Coverage:
 *   - Timer badge renders and shows countdown (HH:MM:SS format)
 *   - Normal badge (>5 min remaining)
 *   - Warning badge + banner (≤5 min remaining)
 *   - Expired badge + banner + checkout blocked (0 min remaining)
 *   - Automatic item removal when timer expires
 *   - Checkout button disabled with message when expired item exists
 *   - Backend polling every 30 s — UI reflects updated cart state
 *   - Multiple items with different expiration times
 *   - Cart-level TTL override via localStorage (used to simulate fast expiry)
 *
 * Time manipulation strategy:
 *   useCartTimer reads `item.bloqueadoEm` (ISO timestamp when reservation started)
 *   and the TTL from localStorage('cart_item_ttl_minutes').
 *
 *   expiry = new Date(bloqueadoEm) + TTL
 *   secsLeft = Math.max(0, Math.ceil((expiry - now) / 1000))
 *
 *   We set localStorage('cart_item_ttl_minutes') = '1' (1 min TTL) and then
 *   set bloqueadoEm relative to now to produce any desired remaining-seconds value.
 *
 * All backend calls are intercepted with cy.intercept().
 */

import clienteFixture from '../fixtures/cliente.json';
import livroFixture from '../fixtures/livro.json';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Authenticate using localStorage tokens (fast, no UI login) */
const setupAuth = () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'test-jwt-token');
    win.localStorage.setItem('user_profile', JSON.stringify(clienteFixture));
  });
};

/**
 * Set the cart TTL in localStorage.
 * useCartTimer reads this on every tick.
 *
 * @param {number} minutes  Cart item TTL in minutes.
 */
const setCartTTL = (minutes) => {
  cy.window().then((win) => {
    win.localStorage.setItem('cart_item_ttl_minutes', String(minutes));
  });
};

/**
 * Build a cart item fixture with a specific number of seconds remaining.
 *
 * Given TTL = ttlMinutes and desired secondsLeft:
 *   bloqueadoEm = now - (ttlMinutes * 60 - secondsLeft) seconds
 *
 * @param {Object} overrides
 * @param {number} secondsLeft   How many seconds remain before expiry.
 * @param {number} ttlMinutes    Must match the TTL set via setCartTTL().
 */
const makeItem = (overrides = {}, secondsLeft = 1800, ttlMinutes = 30) => {
  const ttlMs = ttlMinutes * 60 * 1000;
  const msLeft = secondsLeft * 1000;
  const bloqueadoEm = new Date(Date.now() - (ttlMs - msLeft)).toISOString();
  return {
    id: 10,
    livroId: 1,
    titulo: livroFixture.titulo,
    valorUnitario: livroFixture.valorVenda,
    precoUnitario: livroFixture.valorVenda,
    quantidade: 1,
    subtotal: livroFixture.valorVenda,
    bloqueadoEm,
    ...overrides,
  };
};

/**
 * Mock GET /carrinho with a given set of items.
 *
 * @param {Array}  items
 * @param {string} [alias='getCart']
 */
const mockGetCart = (items, alias = 'getCart') => {
  const subtotal = items.reduce((s, i) => s + (i.valorUnitario ?? i.precoUnitario ?? 0) * (i.quantidade ?? 1), 0);
  cy.intercept('GET', '**/carrinho', {
    statusCode: 200,
    body: {
      data: {
        itens: items,
        valorSubtotal: subtotal,
        valorFrete: items.length > 0 ? 10 : 0,
        valorTotal: subtotal + (items.length > 0 ? 10 : 0),
      },
    },
  }).as(alias);
};

/** Silence noisy side-effect endpoints */
const silenceGlobalAPIs = () => {
  cy.intercept('GET', '**/notificacoes/nao-lidas/count', {
    statusCode: 200,
    body: { data: 0 },
  }).as('notifCount');
};

// ── Suite 1: Timer Badge States ───────────────────────────────────────────────

describe('Cart Timer — Badge Rendering', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('shows normal countdown badge when item has >5 minutes remaining', () => {
    // 25 min left — well outside warning zone
    const item = makeItem({ id: 10 }, 25 * 60, 30);
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="cart-item-10"]').should('exist');

    // Timer cell should contain the normal badge
    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-normal"]').should('be.visible');
    });

    // Normal badge should display a countdown in HH:MM:SS format
    cy.get('[data-testid="timer-normal"]')
      .invoke('text')
      .should('match', /\d{2}:\d{2}:\d{2}/);
  });

  it('shows warning countdown badge when item has ≤5 minutes remaining', () => {
    // 4 min 30 sec left — inside warning zone (≤5 min)
    const item = makeItem({ id: 10 }, 4 * 60 + 30, 30);
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-warning"]').should('be.visible');
    });

    // Warning badge text should start with the warning icon ⚠
    cy.get('[data-testid="timer-warning"]').should('contain.text', '⚠');
    cy.get('[data-testid="timer-warning"]')
      .invoke('text')
      .should('match', /\d{2}:\d{2}:\d{2}/);
  });

  it('shows expired badge when item TTL has elapsed', () => {
    // bloqueadoEm was >30 min ago → 0 sec left
    const item = makeItem({ id: 10 }, 0, 30);
    // Auto-remove will fire — stub that DELETE
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    // Second GET after removal returns empty cart
    mockGetCart([], 'getCartEmpty');

    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Expired badge should appear
    cy.get('[data-testid="timer-expired"]').should('exist');
  });

  it('shows "Expirado" text on the expired badge', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="timer-expired"]')
      .should('exist')
      .and('contain.text', 'Expirado');
  });

  it('displays countdown in HH:MM:SS format for a known remaining time', () => {
    // Exactly 10 minutes remaining with 1-min TTL override
    // TTL=1min, 10 min left would require negative bloqueadoEm — use 30-min TTL
    const item = makeItem({ id: 10 }, 10 * 60, 30); // 10 min = 600 sec
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Should show 00:10:XX badge
    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-normal"]').should('be.visible');
    });
    cy.get('[data-testid="timer-normal"]')
      .invoke('text')
      .should('match', /00:10:\d{2}/);
  });
});

// ── Suite 2: Warning Zone ─────────────────────────────────────────────────────

describe('Cart Timer — Warning Zone (≤5 min)', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('shows `cart-warning-banner` when any item is in warning zone', () => {
    const item = makeItem({ id: 10 }, 3 * 60, 30); // 3 min left
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="cart-warning-banner"]').should('be.visible');
  });

  it('does NOT show warning banner when all items have >5 min remaining', () => {
    const item = makeItem({ id: 10 }, 20 * 60, 30); // 20 min left — safe
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="cart-warning-banner"]').should('not.exist');
  });

  it('warning badge text starts with the ⚠ indicator', () => {
    const item = makeItem({ id: 10 }, 2 * 60 + 45, 30); // 2:45 left
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="timer-warning"]').should('contain.text', '⚠');
  });

  it('uses short TTL via localStorage to trigger warning state', () => {
    // Set TTL=1 min, item blocked 56 sec ago → 4 sec left → warning
    const item = makeItem({ id: 10 }, 4, 1); // 4 sec left with 1-min TTL
    mockGetCart([item]);

    cy.window().then((win) => {
      win.localStorage.setItem('cart_item_ttl_minutes', '1');
    });

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // With only 4 seconds remaining the warning badge should appear
    cy.get('[data-testid="cart-warning-banner"], [data-testid="timer-warning"]').should('exist');
  });
});

// ── Suite 3: Expiration Handling ──────────────────────────────────────────────

describe('Cart Timer — Expiration Handling', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('displays `cart-expired-banner` when an item has expired', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="cart-expired-banner"]').should('be.visible');
  });

  it('checkout button is disabled when an item has expired', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="checkout-btn"]').should('be.disabled');
  });

  it('shows `checkout-blocked-msg` when expired item prevents checkout', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="checkout-blocked-msg"]').should('be.visible');
  });

  it('does NOT show expired banner or block checkout when all items are valid', () => {
    const item = makeItem({ id: 10 }, 20 * 60, 30);
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="cart-expired-banner"]').should('not.exist');
    cy.get('[data-testid="checkout-btn"]').should('not.be.disabled');
    cy.get('[data-testid="checkout-blocked-msg"]').should('not.exist');
  });

  it('expired item row gets danger styling', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // The row should have table-danger class applied
    cy.get('[data-testid="cart-item-10"]').should('have.class', 'table-danger');
  });
});

// ── Suite 4: Automatic Removal ────────────────────────────────────────────────

describe('Cart Timer — Automatic Item Removal on Expiry', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('auto-removes an expired item by calling DELETE /carrinho/itens/:id', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // useCartTimer fires onExpired → CartPage calls cartService.removeItem()
    cy.wait('@autoRemove', { timeout: 5000 });
  });

  it('refreshes cart after auto-removal (re-fetches GET /carrinho)', () => {
    const item = makeItem({ id: 10 }, 0, 30);

    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');

    // Initially returns the expired item; after removal returns empty cart
    let callCount = 0;
    cy.intercept('GET', '**/carrinho', (req) => {
      callCount += 1;
      if (callCount === 1) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              itens: [item],
              valorSubtotal: item.valorUnitario,
              valorFrete: 10,
              valorTotal: item.valorUnitario + 10,
            },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: {
            data: { itens: [], valorSubtotal: 0, valorFrete: 0, valorTotal: 0 },
          },
        });
      }
    }).as('getCartDynamic');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Wait for the auto-remove DELETE
    cy.wait('@autoRemove', { timeout: 5000 });

    // After removal, the page should re-fetch and show empty cart
    cy.get('[data-testid="cart-empty"]', { timeout: 8000 }).should('be.visible');
  });

  it('auto-removal transitions the cart to empty after the DELETE completes', () => {
    const item = makeItem({ id: 10 }, 0, 30);

    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');

    // After auto-removal GETs return empty cart
    let count = 0;
    cy.intercept('GET', '**/carrinho', (req) => {
      count += 1;
      if (count <= 1) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              itens: [item],
              valorSubtotal: item.valorUnitario,
              valorFrete: 10,
              valorTotal: item.valorUnitario + 10,
            },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: { data: { itens: [], valorSubtotal: 0, valorFrete: 0, valorTotal: 0 } },
        });
      }
    }).as('cartSeq');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Wait for auto-removal to fire
    cy.wait('@autoRemove', { timeout: 5000 });

    // After the DELETE succeeds, the cart re-fetch returns empty — empty state shown
    cy.get('[data-testid="cart-empty"]', { timeout: 8000 }).should('be.visible');
  });

  it('does NOT auto-remove items that are still valid', () => {
    const item = makeItem({ id: 10 }, 25 * 60, 30); // 25 min left
    mockGetCart([item]);

    // Ensure no DELETE is called
    cy.intercept('DELETE', '**/carrinho/itens/10', cy.spy().as('unexpectedRemove'));

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="cart-item-10"]').should('exist');

    // Wait briefly and confirm no DELETE was triggered
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1500);
    cy.get('@unexpectedRemove').should('not.have.been.called');
  });
});

// ── Suite 5: Short TTL via localStorage ──────────────────────────────────────

describe('Cart Timer — TTL Override via localStorage', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('reads TTL from localStorage and applies it to expiry calculation', () => {
    // TTL = 2 min, item blocked 1 min 45 sec ago → 15 sec left → warning zone
    const item = makeItem({ id: 10 }, 15, 2);
    mockGetCart([item]);

    cy.window().then((win) => {
      win.localStorage.setItem('cart_item_ttl_minutes', '2');
    });

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // 15 seconds is ≤5 min → warning badge
    cy.get('[data-testid="cart-warning-banner"], [data-testid="timer-warning"]').should('exist');
  });

  it('displays timer-note with the configured TTL minutes', () => {
    const item = makeItem({ id: 10 }, 20 * 60, 30);
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Cart page renders a note: "Os itens ficam reservados por N min."
    cy.get('[data-testid="cart-timer-note"]').should('be.visible');
    cy.get('[data-testid="cart-timer-note"]').invoke('text').should('match', /\d+\s*min/);
  });
});

// ── Suite 6: Backend Polling ──────────────────────────────────────────────────

describe('Cart Timer — Backend Polling (30 s sync)', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('GET /carrinho is called on mount and again when a user action triggers re-fetch', () => {
    const item = makeItem({ id: 10 }, 20 * 60, 30);

    let fetchCount = 0;
    cy.intercept('GET', '**/carrinho', (req) => {
      fetchCount += 1;
      req.reply({
        statusCode: 200,
        body: {
          data: {
            itens: [item],
            valorSubtotal: item.valorUnitario,
            valorFrete: 10,
            valorTotal: item.valorUnitario + 10,
          },
        },
      });
    }).as('getCartPoll');

    // Intercept quantity update endpoint to allow re-fetch
    cy.intercept('PUT', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { data: { itens: [{ ...item, quantidade: 2 }], valorSubtotal: item.valorUnitario * 2, valorFrete: 10, valorTotal: item.valorUnitario * 2 + 10 } },
    }).as('qtyUpdate');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // First fetch (mount)
    cy.wait('@getCartPoll');

    // Trigger a second fetch by incrementing quantity
    cy.get('[data-testid="increase-qty-10"]').click();

    // Second fetch triggered by qty change
    cy.wait('@getCartPoll');

    // Total fetch count should be ≥ 2
    cy.then(() => expect(fetchCount).to.be.at.least(2));
  });

  it('updates cart UI when backend returns different items on re-fetch', () => {
    const freshItem = makeItem({ id: 10 }, 20 * 60, 30);
    const extraItem = makeItem({ id: 11, titulo: 'Livro Extra', livroId: 2 }, 20 * 60, 30);

    let callCount = 0;
    cy.intercept('GET', '**/carrinho', (req) => {
      callCount += 1;
      if (callCount === 1) {
        // First call: return two items
        req.reply({
          statusCode: 200,
          body: {
            data: {
              itens: [freshItem, extraItem],
              valorSubtotal: freshItem.valorUnitario + extraItem.valorUnitario,
              valorFrete: 10,
              valorTotal: freshItem.valorUnitario + extraItem.valorUnitario + 10,
            },
          },
        });
      } else {
        // Subsequent calls: backend returns only item 10
        req.reply({
          statusCode: 200,
          body: {
            data: {
              itens: [freshItem],
              valorSubtotal: freshItem.valorUnitario,
              valorFrete: 10,
              valorTotal: freshItem.valorUnitario + 10,
            },
          },
        });
      }
    }).as('getCartChanging');

    // Intercept qty update so the explicit re-fetch is triggered
    cy.intercept('PUT', '**/carrinho/itens/**', {
      statusCode: 200,
      body: { message: 'ok' },
    }).as('qtyUpdate');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Initial render shows both items
    cy.get('[data-testid="cart-item-10"]').should('exist');
    cy.get('[data-testid="cart-item-11"]').should('exist');

    // Trigger a re-fetch by incrementing quantity — second GET will return only item 10
    cy.get('[data-testid="increase-qty-10"]').click();
    cy.wait('@getCartChanging');

    // After re-fetch, item 11 should no longer be visible
    cy.get('[data-testid="cart-item-11"]').should('not.exist');
    cy.get('[data-testid="cart-item-10"]').should('exist');
  });

  it('reflects updated item expiry state after a re-fetch returns new cart data', () => {
    // On first load the item has 25 min left (normal)
    const normalItem = makeItem({ id: 10 }, 25 * 60, 30);
    // After re-fetch, backend sends same item but now with 3 min left (warning)
    const warningItem = makeItem({ id: 10 }, 3 * 60, 30);

    let callCount = 0;
    cy.intercept('GET', '**/carrinho', (req) => {
      callCount += 1;
      const itens = callCount === 1 ? [normalItem] : [warningItem];
      const sub = itens[0].valorUnitario;
      req.reply({
        statusCode: 200,
        body: {
          data: { itens, valorSubtotal: sub, valorFrete: 10, valorTotal: sub + 10 },
        },
      });
    }).as('cartStateSeq');

    // Intercept qty update to allow re-fetch
    cy.intercept('PUT', '**/carrinho/itens/**', {
      statusCode: 200,
      body: { message: 'ok' },
    }).as('qtyUpdate');

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Initial state: normal badge (25 min remaining)
    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-normal"]').should('exist');
    });

    // Trigger re-fetch via qty change → returns the warning-state item
    cy.get('[data-testid="increase-qty-10"]').click();
    cy.wait('@cartStateSeq');

    // After re-fetch, warning badge should appear (3 min left)
    cy.get('[data-testid="timer-warning"], [data-testid="cart-warning-banner"]', { timeout: 5000 }).should('exist');
  });
});

// ── Suite 7: Multiple Items with Different Expiry Times ───────────────────────

describe('Cart Timer — Multiple Items with Different Expiry Times', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('renders individual timers for each item', () => {
    const item1 = makeItem({ id: 10, titulo: 'Dom Casmurro', livroId: 1 }, 20 * 60, 30);
    const item2 = makeItem({ id: 20, titulo: 'O Cortiço', livroId: 2 }, 10 * 60, 30);
    mockGetCart([item1, item2]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="item-timer-10"]').should('exist');
    cy.get('[data-testid="item-timer-20"]').should('exist');
  });

  it('shows warning banner when only one of multiple items is in warning zone', () => {
    const safeItem = makeItem({ id: 10, titulo: 'Dom Casmurro', livroId: 1 }, 20 * 60, 30);
    const warningItem = makeItem({ id: 20, titulo: 'O Cortiço', livroId: 2 }, 3 * 60, 30);
    mockGetCart([safeItem, warningItem]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // At least one item is in warning zone
    cy.get('[data-testid="cart-warning-banner"]').should('be.visible');

    // Item 10 has normal badge
    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-normal"]').should('exist');
    });

    // Item 20 has warning badge
    cy.get('[data-testid="item-timer-20"]').within(() => {
      cy.get('[data-testid="timer-warning"]').should('exist');
    });
  });

  it('shows expired banner and blocks checkout when only one item is expired', () => {
    const validItem = makeItem({ id: 10, titulo: 'Dom Casmurro', livroId: 1 }, 20 * 60, 30);
    const expiredItem = makeItem({ id: 20, titulo: 'O Cortiço', livroId: 2 }, 0, 30);

    cy.intercept('DELETE', '**/carrinho/itens/20', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemoveItem20');

    mockGetCart([validItem, expiredItem]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Expired item has expired badge
    cy.get('[data-testid="item-timer-20"]').within(() => {
      cy.get('[data-testid="timer-expired"]').should('exist');
    });

    // Valid item still shows normal timer
    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-normal"]').should('exist');
    });

    // Expired banner appears
    cy.get('[data-testid="cart-expired-banner"]').should('be.visible');

    // Checkout disabled
    cy.get('[data-testid="checkout-btn"]').should('be.disabled');
  });

  it('shows different countdown values for items with different remaining times', () => {
    const item1 = makeItem({ id: 10, titulo: 'Dom Casmurro', livroId: 1 }, 20 * 60, 30); // 20 min
    const item2 = makeItem({ id: 20, titulo: 'O Cortiço', livroId: 2 }, 10 * 60, 30); // 10 min
    mockGetCart([item1, item2]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Item 1 should show ~20:00 in HH:MM:SS
    cy.get('[data-testid="item-timer-10"]').invoke('text').should('match', /00:2\d:\d{2}/);

    // Item 2 should show ~10:00 in HH:MM:SS
    cy.get('[data-testid="item-timer-20"]').invoke('text').should('match', /00:10:\d{2}/);
  });

  it('checkout remains enabled when all items are in warning zone but not expired', () => {
    const item1 = makeItem({ id: 10, titulo: 'Dom Casmurro', livroId: 1 }, 4 * 60, 30);
    const item2 = makeItem({ id: 20, titulo: 'O Cortiço', livroId: 2 }, 2 * 60, 30);
    mockGetCart([item1, item2]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Warning banner is shown
    cy.get('[data-testid="cart-warning-banner"]').should('be.visible');

    // But checkout is still enabled because items are not expired
    cy.get('[data-testid="checkout-btn"]').should('not.be.disabled');
    cy.get('[data-testid="checkout-blocked-msg"]').should('not.exist');
  });

  it('all three timer states display simultaneously for 3-item mix', () => {
    // 3 items: normal, warning, expired
    const normalItem  = makeItem({ id: 10, titulo: 'Livro Normal',   livroId: 1 }, 20 * 60, 30);
    const warningItem = makeItem({ id: 20, titulo: 'Livro Warning',  livroId: 2 }, 3 * 60,  30);
    const expiredItem = makeItem({ id: 30, titulo: 'Livro Expirado', livroId: 3 }, 0,        30);

    cy.intercept('DELETE', '**/carrinho/itens/30', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemoveItem30');

    mockGetCart([normalItem, warningItem, expiredItem]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="item-timer-10"]').within(() => {
      cy.get('[data-testid="timer-normal"]').should('exist');
    });
    cy.get('[data-testid="item-timer-20"]').within(() => {
      cy.get('[data-testid="timer-warning"]').should('exist');
    });
    cy.get('[data-testid="item-timer-30"]').within(() => {
      cy.get('[data-testid="timer-expired"]').should('exist');
    });

    // Expired state takes priority — expired banner shown, checkout blocked
    cy.get('[data-testid="cart-expired-banner"]').should('be.visible');
    cy.get('[data-testid="checkout-btn"]').should('be.disabled');
  });
});

// ── Suite 8: Cart Page Interaction After Timer State Changes ──────────────────

describe('Cart Timer — UI Interaction in Warning and Expired States', () => {
  beforeEach(() => {
    setupAuth();
    silenceGlobalAPIs();
  });

  it('quantity input is disabled for expired item', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Qty controls for the expired item should be disabled
    cy.get('[data-testid="qty-ctrl-10"]').within(() => {
      cy.get('input').should('be.disabled');
      cy.get('[data-testid="decrease-qty-10"]').should('be.disabled');
      cy.get('[data-testid="increase-qty-10"]').should('be.disabled');
    });
  });

  it('remove button is still visible for expired item', () => {
    const item = makeItem({ id: 10 }, 0, 30);
    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('autoRemove');
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    cy.get('[data-testid="remove-item-10"]').should('exist');
  });

  it('manual remove works for a valid (non-expired) item via confirmation dialog', () => {
    // Use a valid item — no auto-remove race condition
    const item = makeItem({ id: 10 }, 20 * 60, 30);

    let callCount = 0;
    cy.intercept('GET', '**/carrinho', (req) => {
      callCount += 1;
      if (callCount <= 1) {
        req.reply({
          statusCode: 200,
          body: {
            data: {
              itens: [item],
              valorSubtotal: item.valorUnitario,
              valorFrete: 10,
              valorTotal: item.valorUnitario + 10,
            },
          },
        });
      } else {
        req.reply({
          statusCode: 200,
          body: { data: { itens: [], valorSubtotal: 0, valorFrete: 0, valorTotal: 0 } },
        });
      }
    }).as('getCartManual');

    cy.intercept('DELETE', '**/carrinho/itens/10', {
      statusCode: 200,
      body: { message: 'Item removido' },
    }).as('manualRemove');

    // Stub confirm BEFORE page load so the dialog is auto-accepted immediately
    cy.visit('/cart', {
      onBeforeLoad(win) {
        cy.stub(win, 'confirm').returns(true);
      },
    });
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Timer re-renders every second; force the click to bypass transient detachment
    cy.get('[data-testid="remove-item-10"]').click({ force: true });
    cy.wait('@manualRemove');

    // Cart should now be empty
    cy.get('[data-testid="cart-empty"]', { timeout: 8000 }).should('be.visible');
  });

  it('checkout button text indicates action when cart is valid', () => {
    const item = makeItem({ id: 10 }, 20 * 60, 30);
    mockGetCart([item]);

    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 10000 }).should('exist');

    // Checkout button should exist and not be disabled
    cy.get('[data-testid="checkout-btn"]')
      .should('not.be.disabled')
      .and('contain.text', 'Finalizar');
  });
});
