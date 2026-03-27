/**
 * cypress/e2e/auth.cy.js
 * Fluxos de autenticação com backend real + UI real.
 */

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

const uniqueEmail = (prefix = 'e2e') =>
  `${prefix}.${Date.now()}.${Cypress._.random(1000, 9999)}@example.com`;

const fillRegistrationForm = ({ email, cpf }) => {
  cy.get('[data-testid="name-input"]').clear().type('João Teste Cypress');
  cy.get('[data-testid="gender-select"]').select('MASCULINO');
  cy.get('[data-testid="cpf-input"]').clear().type(cpf);
  cy.get('[data-testid="birth-date-input"]').clear().type('1990-05-20');
  cy.get('[data-testid="email-input"]').clear().type(email);
  cy.get('[data-testid="password-input"]').clear().type('Senha@123');
  cy.get('[data-testid="password-confirm-input"]').clear().type('Senha@123');

  cy.get('[data-testid="phone-ddd-0"]').clear().type('11');
  cy.get('[data-testid="phone-number-0"]').clear().type('987654321');

  cy.get('[data-testid="address-apelido-0"]').clear().type('Casa');
  cy.get('[data-testid="address-type-0"]').select('AMBOS');
  cy.get('[data-testid="address-residence-type-0"]').select('CASA');
  cy.get('[data-testid="address-street-type-0"]').select('RUA');
  cy.get('[data-testid="address-street-0"]').clear().type('Rua dos Testes');
  cy.get('[data-testid="address-number-0"]').clear().type('42');
  cy.get('[data-testid="address-neighborhood-0"]').clear().type('Centro');
  cy.get('[data-testid="address-cep-0"]').clear().type('01310-100');
  cy.get('[data-testid="address-city-0"]').clear().type('São Paulo');
  cy.get('[data-testid="address-state-0"]').select('SP');
  cy.get('[data-testid="address-country-0"]').clear().type('Brasil');
};

describe('Autenticação (real backend + real UI)', () => {
  it('cadastra novo cliente e redireciona para login', () => {
    cy.visit('/register');
    cy.get('[data-testid="register-form"]', { timeout: 15000 }).should('be.visible');

    fillRegistrationForm({
      email: uniqueEmail('register'),
      cpf: generateValidCpf(),
    });

    cy.get('[data-testid="register-submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/login');
  });

  it('bloqueia cadastro com email duplicado', () => {
    const email = uniqueEmail('dup');

    cy.visit('/register');
    fillRegistrationForm({ email, cpf: generateValidCpf() });
    cy.get('[data-testid="register-submit"]').click();
    cy.url({ timeout: 15000 }).should('include', '/login');

    cy.visit('/register');
    fillRegistrationForm({ email, cpf: generateValidCpf() });
    cy.get('[data-testid="register-submit"]').click();

    cy.get('[data-testid="register-error-message"]', { timeout: 15000 }).should('be.visible');
  });

  it('exibe erro para credenciais inválidas', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').should('be.visible');

    cy.get('[data-testid="email-input"]').type('invalido@example.com');
    cy.get('[data-testid="password-input"]').type('SenhaErrada@1');
    cy.get('[data-testid="login-submit"]').click();

    cy.get('[data-testid="login-error-message"]', { timeout: 10000 }).should('be.visible');
    cy.url().should('include', '/login');
  });

  it('realiza login e logout pelo menu do usuário', () => {
    cy.login('joao@example.com', 'Admin@123');

    cy.get('[data-testid="nav-user-menu"]').should('be.visible').click();
    cy.get('[data-testid="nav-logout"]').click();

    cy.url({ timeout: 10000 }).should('include', '/login');
    cy.get('[data-testid="nav-login"]').should('be.visible');
  });
});
