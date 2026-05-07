/**
 * cypress/support/commands.js
 * Custom Cypress commands for the LES Ecommerce Livros application.
 */

// ── cy.login ────────────────────────────────────────────────────────────────

/**
 * Log in via the real UI login form.
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]', { timeout: 10000 }).should('be.visible').clear().type(email);
  cy.get('[data-testid="password-input"]').clear().type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.url({ timeout: 15000 }).should('not.include', '/login');
});

// ── cy.loginByAPI ────────────────────────────────────────────────────────────

/**
 * Log in programmatically via the API (kept for compatibility in legacy specs).
 */
Cypress.Commands.add('loginByAPI', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiBaseUrl')}/auth/login`,
    body: { email, senha: password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      const token =
        response.body?.data?.token ||
        response.body?.token ||
        response.body?.accessToken;

      if (token) {
        cy.window().then((win) => {
          win.localStorage.setItem('auth_token', token);
          if (response.body?.data) {
            const data = response.body.data;
            const role = data.role?.startsWith('ROLE_') ? data.role.replace('ROLE_', '') : data.role;
            win.localStorage.setItem(
              'user_profile',
              JSON.stringify({ ...data, role, roles: role ? [role] : [] }),
            );
          }
        });
      }
    }
  });
  cy.visit('/');
});

// ── cy.mockAPI ───────────────────────────────────────────────────────────────

/**
 * Wrapper around cy.intercept() for explicit mock usage in legacy specs.
 */
Cypress.Commands.add('mockAPI', (method, url, body, alias) => {
  const intercept = cy.intercept(method, url, {
    statusCode: 200,
    body,
    headers: { 'Content-Type': 'application/json' },
  });

  if (alias) {
    intercept.as(alias);
  }
});

// ── cy.addToCart ─────────────────────────────────────────────────────────────

/**
 * Navigate to a book product page and add it to cart using real UI flow.
 */
Cypress.Commands.add('addToCart', (bookId, qty = 1) => {
  const addFromCatalog = () => {
    cy.visit('/');
    cy.get('[data-testid^="add-to-cart-btn-"]', { timeout: 15000 })
      .first()
      .should('be.visible')
      .click();
    cy.contains('adicionado ao carrinho', { timeout: 10000 }).should('be.visible');
  };

  if (!bookId) {
    addFromCatalog();
    return;
  }

  cy.visit(`/product/${bookId}`);
  cy.get('[data-testid="product-page"]', { timeout: 20000 }).should('be.visible');
  
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="add-to-cart-btn"]').length === 0) {
      cy.log('Add to cart button not found on product page, falling back to catalog');
      addFromCatalog();
      return;
    }

    if (qty > 1) {
      cy.get('[data-testid="qty-input"]').clear().type(String(qty));
    }

    cy.get('[data-testid="add-to-cart-btn"]').should('be.visible').click();
    cy.contains('adicionado ao carrinho', { timeout: 15000 }).should('be.visible');
  });
});

// ── cy.logout ────────────────────────────────────────────────────────────────

/**
 * Prefer UI logout; fallback to localStorage cleanup when menu is unavailable.
 */
Cypress.Commands.add('logout', () => {
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="nav-user-menu"]').length > 0) {
      cy.get('[data-testid="nav-user-menu"]').click();
      cy.get('[data-testid="nav-logout"]').click();
      cy.url({ timeout: 10000 }).should('include', '/login');
      return;
    }

    cy.window().then((win) => {
      win.localStorage.removeItem('auth_token');
      win.localStorage.removeItem('user_profile');
      win.localStorage.removeItem('cart_session');
    });
    cy.visit('/login');
    cy.url().should('include', '/login');
  });
});

// ── cy.clearCart ─────────────────────────────────────────────────────────────

Cypress.Commands.add('clearCart', () => {
  cy.visit('/cart');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="cart-empty"]').length > 0) return;
    if ($body.find('[data-testid="clear-cart-btn"]').length > 0) {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      cy.get('[data-testid="clear-cart-btn"]').click();
      cy.get('[data-testid="cart-empty"]', { timeout: 15000 }).should('be.visible');
    }
  });
});

// ── cy.confirmActionModal ──────────────────────────────────────────────────────

Cypress.Commands.add('confirmActionModal', () => {
  cy.get('[data-testid="confirm-action-modal"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="confirm-modal-ok"]').click();
  cy.get('[data-testid="confirm-action-modal"]', { timeout: 15000 }).should('not.exist');
});

// ── cy.setViewport helpers ───────────────────────────────────────────────────

Cypress.Commands.add('mobile', () => {
  cy.viewport(390, 844);
});

Cypress.Commands.add('tablet', () => {
  cy.viewport(768, 1024);
});

Cypress.Commands.add('desktop', () => {
  cy.viewport(1280, 720);
});
