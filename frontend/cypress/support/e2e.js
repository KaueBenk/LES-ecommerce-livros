/**
 * cypress/support/e2e.js
 * Main support entry-point. Imported automatically before every spec file.
 */

// Import custom commands
import './commands';

// ── Global hooks ────────────────────────────────────────────────────────────

/**
 * Silence uncaught exceptions caused by third-party scripts or hot-reload
 * so they don't fail unrelated tests.
 */
Cypress.on('uncaught:exception', (err) => {
  // Ignore ResizeObserver loop errors from Bootstrap/Vite
  if (err.message.includes('ResizeObserver loop')) return false;
  // Ignore Vite HMR disconnection noise
  if (err.message.includes('Failed to fetch dynamically imported module')) return false;
  // Ignore network/connection errors from unmocked API calls in test environment
  if (err.message.includes('Network Error')) return false;
  if (err.message.includes('ERR_CONNECTION_REFUSED')) return false;
  if (err.message.includes('ECONNREFUSED')) return false;
  if (err.message.includes('net::ERR_')) return false;
  // Ignore Axios cancellation / timeout that may surface during fast test teardown
  if (err.message.includes('Request aborted')) return false;
  if (err.message.includes('Request failed')) return false;
  return true;
});
