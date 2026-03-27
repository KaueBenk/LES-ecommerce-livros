/**
 * cypress/e2e/account.cy.js
 * Fluxos de conta com backend real + UI real.
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';

const loginCustomer = () => {
  cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
};

describe('Minha conta (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
    loginCustomer();
  });

  it('edita dados de perfil e persiste alteração', () => {
    const updatedName = `João Cypress ${Date.now()}`;

    cy.visit('/account/profile');
    cy.get('[data-testid="profile-form"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="profile-edit-button"]').click();
    cy.get('[data-testid="profile-nome-input"]').clear().type(updatedName);
    cy.get('[data-testid="profile-save-button"]').click();

    cy.get('[data-testid="profile-success-message"]', { timeout: 15000 }).should('be.visible');
    cy.reload();
    cy.get('[data-testid="profile-form"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="profile-nome-display"]').should('contain.text', updatedName);
  });

  it('adiciona um novo endereço pela interface real', () => {
    const addressLabel = `E2E ${Date.now()}`;

    cy.visit('/account/addresses');
    cy.get('[data-testid="address-list"]', { timeout: 15000 }).should('be.visible');

    cy.get('body').then(($body) => {
      const beforeCount = $body.find('[data-testid^="address-card-"]').length;

      cy.get('[data-testid="add-address-button"]').click();
      cy.get('[data-testid="address-form-modal"]').should('be.visible');

      cy.get('[data-testid="address-apelido-input"]').type(addressLabel);
      cy.get('[data-testid="address-tipo-select"]').select('AMBOS');
      cy.get('[data-testid="address-residencia-select"]').select('CASA');
      cy.get('[data-testid="address-logradouro-tipo-select"]').select('RUA');
      cy.get('[data-testid="address-logradouro-input"]').type('Rua Cypress Real');
      cy.get('[data-testid="address-numero-input"]').type('100');
      cy.get('[data-testid="address-bairro-input"]').type('Centro');
      cy.get('[data-testid="address-cep-input"]').type('01310-100');
      cy.get('[data-testid="address-cidade-input"]').type('São Paulo');
      cy.get('[data-testid="address-estado-select"]').select('SP');

      cy.get('[data-testid="address-form-save-button"]').click();

      cy.get('[data-testid="addresses-success-message"]', { timeout: 15000 }).should('be.visible');
      cy.contains('[data-testid^="address-card-"]', addressLabel).should('exist');
      cy.get('[data-testid^="address-card-"]').should('have.length.greaterThan', beforeCount);
    });
  });

  it('adiciona cartão de crédito e permite definir preferencial', () => {
    const cardNumber = `411111111111${Cypress._.random(1000, 9999)}`;

    cy.visit('/account/credit-cards');
    cy.get('[data-testid="credit-card-list"]', { timeout: 15000 }).should('be.visible');

    cy.get('body').then(($body) => {
      const beforeCount = $body.find('[data-testid^="credit-card-item-"]').length;

      cy.get('[data-testid="credit-card-add-btn"]').click();
      cy.get('[data-testid="credit-card-form-modal"]').should('be.visible');

      cy.get('[data-testid="credit-card-numero"]').type(cardNumber);
      cy.get('[data-testid="credit-card-nome"]').type('JOAO E2E');
      cy.get('[data-testid="credit-card-bandeira"]').select('VISA');
      cy.get('[data-testid="credit-card-cvv"]').type('321');

      cy.get('[data-testid="credit-card-form-submit"]').click();

      cy.get('[data-testid="cards-success-message"]', { timeout: 15000 }).should('be.visible');
      cy.get('[data-testid^="credit-card-item-"]').should('have.length.greaterThan', beforeCount);
    });

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="card-set-preferred-btn-"]').length > 0) {
        cy.get('[data-testid^="card-set-preferred-btn-"]').first().click();
        cy.get('[data-testid="cards-success-message"]', { timeout: 15000 }).should('be.visible');
      }
    });
  });

  it('valida erro de confirmação de senha divergente (UI real)', () => {
    cy.visit('/account/change-password');
    cy.get('[data-testid="change-password-form"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="change-password-senhaAtual"]').type('Admin@123');
    cy.get('[data-testid="change-password-novaSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="change-password-confirmacaoSenha"]').type('SenhaDiferente@789');
    cy.get('[data-testid="change-password-submit"]').click();

    cy.get('[data-testid="change-password-confirmacaoSenha-error"]').should('be.visible');
  });
});
