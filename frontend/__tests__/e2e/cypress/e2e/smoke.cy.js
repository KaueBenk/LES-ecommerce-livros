/**
 * Smoke Test — App Loads
 * FE-001: Verifies the app loads with header and footer visible.
 */
describe('Smoke Test — App Loads', () => {
  it('should load homepage', () => {
    cy.visit('http://localhost:5173');
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('should have navigation links', () => {
    cy.visit('http://localhost:5173');
    cy.get('nav a').should('have.length.greaterThan', 0);
  });

  it('should render main content', () => {
    cy.visit('http://localhost:5173');
    cy.get('[data-testid="home-page"]').should('exist');
  });

  it('should navigate to login page', () => {
    cy.visit('http://localhost:5173');
    cy.get('[data-testid="nav-login"]').click();
    cy.url().should('include', '/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
  });

  it('should navigate to catalog page', () => {
    cy.visit('http://localhost:5173');
    cy.get('[data-testid="nav-catalog"]').click();
    cy.url().should('include', '/catalog');
  });
});
