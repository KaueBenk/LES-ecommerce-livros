/**
 * cypress/support/e2e.js
 * Main support entry-point. Imported automatically before every spec file.
 */

// Import custom commands
import './commands';

// ── Global hooks ────────────────────────────────────────────────────────────

/**
 * Preserve auth_token across tests within the same spec to avoid repeated logins.
 * Remove this if tests should start fully logged out.
 */
Cypress.Cookies.defaults({
  preserve: ['auth_token'],
});

/**
 * Silence uncaught exceptions caused by third-party scripts or hot-reload
 * so they don't fail unrelated tests.
 */
Cypress.on('uncaught:exception', (err) => {
  // Ignore ResizeObserver loop errors from Bootstrap/Vite
  if (err.message.includes('ResizeObserver loop')) return false;
  // Ignore Vite HMR disconnection noise
  if (err.message.includes('Failed to fetch dynamically imported module')) return false;
  return true;
});
