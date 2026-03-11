/**
 * cypress/e2e/admin-analytics.cy.js
 * Analytics admin com backend real + UI real.
 */

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';

describe('Admin Analytics (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
    cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.visit('/admin/analytics');
    cy.get('[data-testid="admin-analytics-section"]', { timeout: 15000 }).should('be.visible');
  });

  it('gera relatório por período com dados reais', () => {
    cy.get('[data-testid="filter-data-inicio"]').clear().type('2020-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2099-12-31');
    cy.get('[data-testid="filter-agrupamento"]').select('CATEGORIA');
    cy.get('[data-testid="filter-yaxis"]').select('quantidade');

    cy.get('[data-testid="analytics-submit"]').click();

    cy.get('[data-testid="period-error"]').should('not.exist');
    cy.get('[data-testid="period-chart-wrapper"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-testid="period-summary"]').should('be.visible');
  });

  it('gera relatório regional com dados reais', () => {
    cy.get('[data-testid="tab-region"]').click();
    cy.get('[data-testid="region-tab-content"]', { timeout: 10000 }).should('be.visible');

    cy.get('[data-testid="filter-data-inicio"]').clear().type('2020-01-01');
    cy.get('[data-testid="filter-data-fim"]').clear().type('2099-12-31');
    cy.get('[data-testid="filter-metric-region"]').select('quantidade');

    cy.get('[data-testid="analytics-submit"]').click();

    cy.get('[data-testid="region-error"]').should('not.exist');
    cy.get('[data-testid="region-chart-wrapper"]', { timeout: 20000 }).should('be.visible');
    cy.get('[data-testid="region-summary"]').should('be.visible');
  });
});
