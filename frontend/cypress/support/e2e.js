/**
 * cypress/support/e2e.js
 * Main support entry-point. Imported automatically before every spec file.
 */

import './commands';

Cypress.on('uncaught:exception', (err) => {
  // Ignore known browser noise, but do not mask backend/network failures.
  if (err.message.includes('ResizeObserver loop')) return false;
  if (err.message.includes('Failed to fetch dynamically imported module')) return false;
  return true;
});
