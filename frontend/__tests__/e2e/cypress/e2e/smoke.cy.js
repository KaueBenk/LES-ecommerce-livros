/**
 * Smoke Test — App Loads
 * FE-001: Verifies the app loads with header and footer visible.
 */
describe('Smoke Test — App Loads', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it('should load homepage', () => {
    cy.visit('/');
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('should have navigation links', () => {
    cy.visit('/');
    cy.get('nav a').should('have.length.greaterThan', 0);
  });

  it('should render main content', () => {
    cy.visit('/');
    cy.get('[data-testid="home-page"]').should('exist');
  });

  it('should navigate to login page', () => {
    cy.visit('/');
    cy.get('[data-testid="nav-login"]').click();
    cy.url().should('include', '/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
  });

  it('should navigate to catalog page', () => {
    cy.visit('/');
    cy.get('[data-testid="nav-catalog"]').click();
    cy.url().should('include', '/catalog');
  });
});
