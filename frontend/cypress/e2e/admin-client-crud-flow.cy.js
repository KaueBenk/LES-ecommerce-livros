/**
 * cypress/e2e/admin-client-crud-flow.cy.js
 * Fluxo completo de CRUD de cliente (Create, Read, Update, Delete)
 * usando backend real + UI real.
 */

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';

const CUSTOMER_PASSWORD = 'Senha@123';

const generateValidCpf = () => {
  const randomDigit = () => Math.floor(Math.random() * 9);
  const n = Array.from({ length: 9 }, randomDigit);

  let d1 = n.reduce((total, digit, index) => total + digit * (10 - index), 0) % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  n.push(d1);

  let d2 = n.reduce((total, digit, index) => total + digit * (11 - index), 0) % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  n.push(d2);

  return n.join('');
};

const uniqueEmail = (prefix = 'crud.cliente') =>
  `${prefix}.${Date.now()}.${Cypress._.random(1000, 9999)}@example.com`;

const fillRegistrationForm = ({ name, email, cpf }) => {
  cy.get('[data-testid="name-input"]').clear().type(name);
  cy.get('[data-testid="gender-select"]').select('MASCULINO');
  cy.get('[data-testid="cpf-input"]').clear().type(cpf);
  cy.get('[data-testid="birth-date-input"]').clear().type('1992-07-10');
  cy.get('[data-testid="email-input"]').clear().type(email);
  cy.get('[data-testid="password-input"]').clear().type(CUSTOMER_PASSWORD);
  cy.get('[data-testid="password-confirm-input"]').clear().type(CUSTOMER_PASSWORD);

  cy.get('[data-testid="phone-ddd-0"]').clear().type('11');
  cy.get('[data-testid="phone-number-0"]').clear().type('987654321');

  cy.get('[data-testid="address-apelido-0"]').clear().type('Casa');
  cy.get('[data-testid="address-type-0"]').select('AMBOS');
  cy.get('[data-testid="address-residence-type-0"]').select('CASA');
  cy.get('[data-testid="address-street-type-0"]').select('RUA');
  cy.get('[data-testid="address-street-0"]').clear().type('Rua CRUD Cypress');
  cy.get('[data-testid="address-number-0"]').clear().type('101');
  cy.get('[data-testid="address-neighborhood-0"]').clear().type('Centro');
  cy.get('[data-testid="address-cep-0"]').clear().type('01310-100');
  cy.get('[data-testid="address-city-0"]').clear().type('São Paulo');
  cy.get('[data-testid="address-state-0"]').select('SP');
  cy.get('[data-testid="address-country-0"]').clear().type('Brasil');
};

const filterByCustomerEmail = (email) => {
  cy.get('[data-testid="admin-clients-section"]', { timeout: 15000 }).should('be.visible');
  cy.get('[data-testid="filter-email"]').clear().type(email);
  cy.get('[data-testid="filter-submit"]').click();
  cy.get('[data-testid="admin-clients-table"]', { timeout: 15000 }).should('be.visible');
};

describe('Admin Client CRUD Flow (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('executa CRUD completo de cliente via fluxo real', () => {
    const createdName = `Cliente CRUD ${Date.now()}`;
    const updatedName = `${createdName} Atualizado`;
    const customerEmail = uniqueEmail();
    const customerCpf = generateValidCpf();

    // Create
    cy.visit('/register');
    cy.get('[data-testid="register-form"]', { timeout: 15000 }).should('be.visible');
    fillRegistrationForm({ name: createdName, email: customerEmail, cpf: customerCpf });
    cy.get('[data-testid="register-submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/login');

    // Update (cliente atualiza o próprio nome)
    cy.login(customerEmail, CUSTOMER_PASSWORD);
    cy.visit('/account/profile');
    cy.get('[data-testid="profile-form"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="profile-edit-button"]').click();
    cy.get('[data-testid="profile-nome-input"]').clear().type(updatedName);
    cy.get('[data-testid="profile-save-button"]').click();
    cy.get('[data-testid="profile-success-message"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="profile-nome-input"]').should('have.value', updatedName);
    cy.logout();

    // Read (admin localiza e abre detalhe do cliente)
    cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
    cy.visit('/admin/clientes');
    filterByCustomerEmail(customerEmail);
    cy.contains('[data-testid="admin-clients-table"] tbody tr', customerEmail, { timeout: 15000 })
      .as('clientRow')
      .should('be.visible')
      .click();

    cy.get('[data-testid="client-detail-modal"]', { timeout: 15000 })
      .should('be.visible')
      .and('contain.text', customerEmail)
      .and('contain.text', updatedName);
    cy.get('[data-testid="client-detail-close"]').click();

    // Delete (admin exclui cliente)
    filterByCustomerEmail(customerEmail);
    cy.intercept('DELETE', '**/api/v1/admin/clientes/*').as('deleteClient');
    cy.on('window:confirm', () => true);
    cy.contains('[data-testid="admin-clients-table"] tbody tr', customerEmail, { timeout: 15000 })
      .within(() => {
        cy.get('[data-testid^="delete-client-"]').click();
      });
    cy.wait('@deleteClient').its('response.statusCode').should('eq', 200);

    // Confirma remoção na listagem
    cy.get('[data-testid="filter-email"]').clear().type(customerEmail);
    cy.get('[data-testid="filter-submit"]').click();
    cy.get('[data-testid="admin-no-clients"]', { timeout: 15000 }).should('be.visible');
    cy.logout();

    // Confirma que login do cliente excluído falha
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.intercept('POST', '**/api/v1/auth/login').as('deletedCustomerLogin');
    cy.get('[data-testid="email-input"]').clear().type(customerEmail);
    cy.get('[data-testid="password-input"]').clear().type(CUSTOMER_PASSWORD);
    cy.get('[data-testid="login-submit"]').click();
    cy.wait('@deletedCustomerLogin').its('response.statusCode').should('eq', 401);
    cy.get('[data-testid="login-error-message"]', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/login');
  });
});
