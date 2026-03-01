/**
 * cypress/support/commands.js
 * Custom Cypress commands for the LES Ecommerce Livros application.
 *
 * Available commands:
 *   cy.login(email, password)
 *   cy.mockAPI(method, urlPattern, response, alias?)
 *   cy.addToCart(bookId, quantity)
 *   cy.logout()
 *   cy.loginByAPI(email, password)
 */

// ── cy.login ────────────────────────────────────────────────────────────────

/**
 * Log in via the UI login form.
 * Navigates to /login, fills credentials, submits, and waits for redirect.
 *
 * @param {string} email    - User email
 * @param {string} password - User password
 *
 * @example
 *   cy.login('cliente@example.com', 'senha123');
 */
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-testid="login-email"]', { timeout: 8000 })
    .should('be.visible')
    .clear()
    .type(email);
  cy.get('[data-testid="login-password"]').clear().type(password);
  cy.get('[data-testid="login-submit"]').click();
  // Wait until we leave the login page
  cy.url().should('not.include', '/login');
});

// ── cy.loginByAPI ────────────────────────────────────────────────────────────

/**
 * Log in programmatically via the API (much faster than UI login).
 * Stores the JWT in localStorage so subsequent page visits are authenticated.
 *
 * @param {string} email    - User email
 * @param {string} password - User password
 *
 * @example
 *   cy.loginByAPI('cliente@example.com', 'senha123');
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
        });
      }
    }
  });
  cy.visit('/');
});

// ── cy.mockAPI ───────────────────────────────────────────────────────────────

/**
 * Wrapper around cy.intercept() for easy API mocking.
 *
 * @param {string} method      - HTTP method (GET, POST, PATCH, …)
 * @param {string|RegExp} url  - URL pattern to intercept (relative or absolute)
 * @param {object|Array} body  - Response body to return
 * @param {string} [alias]     - Optional alias for cy.wait('@alias')
 *
 * @example
 *   cy.mockAPI('GET', '/api/v1/livros', { data: [] }, 'getLivros');
 *   cy.wait('@getLivros');
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
 * Navigate to a book's product page and add it to the cart.
 *
 * @param {number|string} bookId  - The book ID
 * @param {number}        [qty=1] - Quantity to add
 *
 * @example
 *   cy.addToCart(1, 2);
 */
Cypress.Commands.add('addToCart', (bookId, qty = 1) => {
  cy.visit(`/product/${bookId}`);
  cy.get('[data-testid="product-page"]', { timeout: 10000 }).should('exist');

  // Set quantity if field exists and qty > 1
  if (qty > 1) {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="quantity-input"]').length > 0) {
        cy.get('[data-testid="quantity-input"]').clear().type(String(qty));
      }
    });
  }

  cy.get('[data-testid="add-to-cart-btn"]').should('be.visible').click();

  // Wait for cart confirmation (badge update or success toast)
  cy.get('[data-testid="cart-badge"]', { timeout: 5000 }).should('exist');
});

// ── cy.logout ────────────────────────────────────────────────────────────────

/**
 * Log out by clearing localStorage and navigating to /login.
 *
 * @example
 *   cy.logout();
 */
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('auth_token');
    win.localStorage.removeItem('cart');
  });
  cy.visit('/login');
  cy.url().should('include', '/login');
});

// ── cy.setViewport helpers ───────────────────────────────────────────────────

/**
 * Switch to mobile viewport.
 * @example cy.mobile();
 */
Cypress.Commands.add('mobile', () => {
  cy.viewport(390, 844); // iPhone 14 dimensions
});

/**
 * Switch to tablet viewport.
 * @example cy.tablet();
 */
Cypress.Commands.add('tablet', () => {
  cy.viewport(768, 1024);
});

/**
 * Switch to desktop viewport.
 * @example cy.desktop();
 */
Cypress.Commands.add('desktop', () => {
  cy.viewport(1280, 720);
});
