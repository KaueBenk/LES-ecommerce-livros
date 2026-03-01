/**
 * cypress/e2e/account.cy.js
 * E2E tests for Account management — Profile, Addresses, Credit Cards, Password Change.
 *
 * US-042 | FE-032
 *
 * All tests mock API responses so they don't depend on a running backend.
 */

import clienteFixture from '../fixtures/cliente.json';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Seed localStorage with a JWT and mock the /auth/me (or /cliente/perfil) endpoint
 * so the app renders content for an authenticated user.
 */
const setupAuth = () => {
  cy.window().then((win) => {
    win.localStorage.setItem('auth_token', 'test-jwt-token');
  });

  // Mock the initial "who am I" call the app may make on mount
  cy.intercept('GET', '**/auth/me', {
    statusCode: 200,
    body: { data: clienteFixture },
  }).as('authMe');

  cy.intercept('GET', '**/cliente/perfil', {
    statusCode: 200,
    body: { data: clienteFixture },
  }).as('perfil');
};

// ── Edit Profile ──────────────────────────────────────────────────────────────

describe('Edit Profile', () => {
  beforeEach(() => {
    setupAuth();

    // Mock profile GET
    cy.intercept('GET', '**/cliente/perfil', {
      statusCode: 200,
      body: { data: clienteFixture },
    }).as('getProfile');

    cy.visit('/account/profile');
    cy.get('[data-testid="profile-form"], [data-testid="profile-loading"]', {
      timeout: 10000,
    });
  });

  it('displays the profile form with user data', () => {
    cy.get('[data-testid="profile-form"]').should('exist');
    cy.get('[data-testid="profile-nome-display"], [data-testid="profile-nome-input"]').should('exist');
  });

  it('enables edit mode when edit button is clicked', () => {
    cy.get('[data-testid="profile-edit-button"]').click();
    cy.get('[data-testid="profile-nome-input"]').should('be.visible');
    cy.get('[data-testid="profile-save-button"]').should('be.visible');
    cy.get('[data-testid="profile-cancel-button"]').should('be.visible');
  });

  it('cancels edit without saving', () => {
    cy.get('[data-testid="profile-edit-button"]').click();
    cy.get('[data-testid="profile-nome-input"]').clear().type('Nome Temporário');
    cy.get('[data-testid="profile-cancel-button"]').click();
    // Name input should no longer be visible (read-only mode restored)
    cy.get('[data-testid="profile-nome-input"]').should('not.exist');
  });

  it('saves updated name and calls PUT API', () => {
    const updatedNome = 'Ana Beatriz Alterada';

    cy.intercept('PUT', '**/cliente/perfil', {
      statusCode: 200,
      body: { data: { ...clienteFixture, nome: updatedNome } },
    }).as('updateProfile');

    cy.get('[data-testid="profile-edit-button"]').click();
    cy.get('[data-testid="profile-nome-input"]').clear().type(updatedNome);
    cy.get('[data-testid="profile-save-button"]').click();

    cy.wait('@updateProfile').its('request.body').should('deep.include', { nome: updatedNome });
    cy.get('[data-testid="profile-success-message"]').should('be.visible');
  });

  it('shows error message when profile update fails', () => {
    cy.intercept('PUT', '**/cliente/perfil', {
      statusCode: 500,
      body: { message: 'Erro interno do servidor.' },
    }).as('updateProfileFail');

    cy.get('[data-testid="profile-edit-button"]').click();
    cy.get('[data-testid="profile-nome-input"]').clear().type('Qualquer Nome');
    cy.get('[data-testid="profile-save-button"]').click();

    cy.wait('@updateProfileFail');
    cy.get('[data-testid="profile-error-message"]').should('be.visible');
  });
});

// ── Addresses ─────────────────────────────────────────────────────────────────

describe('Addresses', () => {
  const addressId = 99;
  const mockAddress = {
    id: addressId,
    apelido: 'Casa',
    tipo: 'RESIDENCIAL',
    tipoResidencia: 'CASA',
    tipoLogradouro: 'Rua',
    logradouro: 'Rua dos Testes',
    numero: '42',
    complemento: 'Ap 1',
    bairro: 'TesteBairro',
    cep: '01310-100',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    principal: false,
  };

  beforeEach(() => {
    setupAuth();

    cy.intercept('GET', '**/cliente/enderecos', {
      statusCode: 200,
      body: { data: [{ ...clienteFixture.enderecos[0] }] },
    }).as('getAddresses');

    cy.visit('/account/addresses');
    cy.get('[data-testid="address-list"], [data-testid="address-list-loading"]', {
      timeout: 10000,
    });
  });

  it('displays the address list', () => {
    cy.get('[data-testid="address-list"]').should('exist');
  });

  it('opens the add address modal', () => {
    cy.get('[data-testid="add-address-button"]').click();
    cy.get('[data-testid="address-form-modal"]').should('be.visible');
    cy.get('[data-testid="address-form"]').should('exist');
  });

  it('adds a new address and it appears in the list', () => {
    cy.intercept('POST', '**/cliente/enderecos', {
      statusCode: 201,
      body: { data: mockAddress },
    }).as('addAddress');

    // Refetch list after add (return both original + new)
    cy.intercept('GET', '**/cliente/enderecos', {
      statusCode: 200,
      body: {
        data: [{ ...clienteFixture.enderecos[0] }, mockAddress],
      },
    }).as('getAddressesAfterAdd');

    cy.get('[data-testid="add-address-button"]').click();
    cy.get('[data-testid="address-form-modal"]').should('be.visible');

    // Fill required fields
    cy.get('[data-testid="address-logradouro-input"]').type(mockAddress.logradouro);
    cy.get('[data-testid="address-numero-input"]').type(mockAddress.numero);
    cy.get('[data-testid="address-bairro-input"]').type(mockAddress.bairro);
    cy.get('[data-testid="address-cep-input"]').type(mockAddress.cep);
    cy.get('[data-testid="address-cidade-input"]').type(mockAddress.cidade);
    cy.get('[data-testid="address-estado-select"]').select(mockAddress.estado);

    cy.get('[data-testid="address-form-save-button"]').click();
    cy.wait('@addAddress');

    // Modal should close
    cy.get('[data-testid="address-form-modal"]').should('not.exist');
    // New address should appear
    cy.get(`[data-testid="address-card-${addressId}"]`).should('exist');
  });

  it('opens the edit address modal for an existing address', () => {
    const existingId = clienteFixture.enderecos[0].id;
    cy.get(`[data-testid="edit-address-${existingId}"]`).click();
    cy.get('[data-testid="address-form-modal"]').should('be.visible');
    cy.get('[data-testid="address-form-title"]').should('contain.text', 'Editar');
  });

  it('deletes an address after confirmation', () => {
    const existingId = clienteFixture.enderecos[0].id;

    cy.intercept('DELETE', `**/cliente/enderecos/${existingId}`, {
      statusCode: 204,
      body: {},
    }).as('deleteAddress');

    // List is empty after deletion
    cy.intercept('GET', '**/cliente/enderecos', {
      statusCode: 200,
      body: { data: [] },
    }).as('getAddressesAfterDelete');

    cy.get(`[data-testid="delete-address-${existingId}"]`).click();
    cy.get('[data-testid="delete-confirm-modal"]').should('be.visible');
    cy.get('[data-testid="delete-confirm-button"]').click();

    cy.wait('@deleteAddress');
    cy.get(`[data-testid="address-card-${existingId}"]`).should('not.exist');
  });

  it('cancels deletion when cancel is clicked', () => {
    const existingId = clienteFixture.enderecos[0].id;
    cy.get(`[data-testid="delete-address-${existingId}"]`).click();
    cy.get('[data-testid="delete-confirm-modal"]').should('be.visible');
    cy.get('[data-testid="delete-cancel-button"]').click();
    cy.get('[data-testid="delete-confirm-modal"]').should('not.be.visible');
    cy.get(`[data-testid="address-card-${existingId}"]`).should('exist');
  });
});

// ── Credit Cards ──────────────────────────────────────────────────────────────

describe('Credit Cards', () => {
  const cardId = 77;
  const newCard = {
    id: cardId,
    nomeTitular: 'ANA B SILVA',
    numeroMascarado: '**** **** **** 5678',
    bandeira: 'MASTERCARD',
    mesExpiracao: 8,
    anoExpiracao: 2030,
    principal: false,
  };

  beforeEach(() => {
    setupAuth();

    cy.intercept('GET', '**/cliente/cartoes', {
      statusCode: 200,
      body: { data: clienteFixture.cartoes },
    }).as('getCards');

    cy.visit('/account/credit-cards');
    cy.get('[data-testid="credit-card-list"], [data-testid="credit-cards-loading"]', {
      timeout: 10000,
    });
  });

  it('displays the credit card list', () => {
    cy.get('[data-testid="credit-card-list"]').should('exist');
  });

  it('opens the add card modal', () => {
    cy.get('[data-testid="credit-card-add-btn"]').click();
    cy.get('[data-testid="credit-card-form-modal"]').should('be.visible');
  });

  it('adds a new card and it appears in the list', () => {
    cy.intercept('POST', '**/cliente/cartoes', {
      statusCode: 201,
      body: { data: newCard },
    }).as('addCard');

    cy.intercept('GET', '**/cliente/cartoes', {
      statusCode: 200,
      body: { data: [...clienteFixture.cartoes, newCard] },
    }).as('getCardsAfterAdd');

    cy.get('[data-testid="credit-card-add-btn"]').click();
    cy.get('[data-testid="credit-card-form-modal"]').should('be.visible');

    // Fill form fields
    cy.get('[data-testid="credit-card-numero"]').type('5234 5678 9012 3456');
    cy.get('[data-testid="credit-card-nome"]').type(newCard.nomeTitular);
    cy.get('[data-testid="credit-card-bandeira"]').select(newCard.bandeira);
    cy.get('[data-testid="credit-card-cvv"]').type('321');

    cy.get('[data-testid="credit-card-form-submit"]').click();
    cy.wait('@addCard');

    cy.get('[data-testid="credit-card-form-modal"]').should('not.exist');
    cy.get(`[data-testid="credit-card-item-${cardId}"]`).should('exist');
  });

  it('sets a card as preferred', () => {
    const existingCardId = clienteFixture.cartoes[0].id;

    cy.intercept('PATCH', `**/cliente/cartoes/${existingCardId}/principal`, {
      statusCode: 200,
      body: { data: { ...clienteFixture.cartoes[0], principal: true } },
    }).as('setPreferred');

    // Only show set-preferred button if card is not already principal
    cy.get('body').then(($body) => {
      if ($body.find(`[data-testid="card-set-preferred-btn-${existingCardId}"]`).length > 0) {
        cy.get(`[data-testid="card-set-preferred-btn-${existingCardId}"]`).click();
        cy.wait('@setPreferred');
        cy.get(`[data-testid="card-preferred-badge-${existingCardId}"]`).should('exist');
      } else {
        // Card is already principal — badge should already be shown
        cy.get(`[data-testid="card-preferred-badge-${existingCardId}"]`).should('exist');
      }
    });
  });

  it('deletes a card after confirmation', () => {
    const existingCardId = clienteFixture.cartoes[0].id;

    cy.intercept('DELETE', `**/cliente/cartoes/${existingCardId}`, {
      statusCode: 204,
      body: {},
    }).as('deleteCard');

    cy.intercept('GET', '**/cliente/cartoes', {
      statusCode: 200,
      body: { data: [] },
    }).as('getCardsAfterDelete');

    cy.get(`[data-testid="card-delete-btn-${existingCardId}"]`).click();
    cy.get('[data-testid="card-delete-confirm-modal"]').should('be.visible');
    cy.get('[data-testid="card-delete-confirm"]').click();

    cy.wait('@deleteCard');
    cy.get(`[data-testid="credit-card-item-${existingCardId}"]`).should('not.exist');
  });

  it('cancels card deletion when cancel is clicked', () => {
    const existingCardId = clienteFixture.cartoes[0].id;
    cy.get(`[data-testid="card-delete-btn-${existingCardId}"]`).click();
    cy.get('[data-testid="card-delete-confirm-modal"]').should('be.visible');
    cy.get('[data-testid="card-delete-cancel"]').click();
    cy.get('[data-testid="credit-card-item-${existingCardId}"]').should('exist');
  });

  it('shows server error when card add fails', () => {
    cy.intercept('POST', '**/cliente/cartoes', {
      statusCode: 422,
      body: { message: 'Número de cartão inválido.' },
    }).as('addCardFail');

    cy.get('[data-testid="credit-card-add-btn"]').click();
    cy.get('[data-testid="credit-card-numero"]').type('0000 0000 0000 0000');
    cy.get('[data-testid="credit-card-nome"]').type('FAIL TESTE');
    cy.get('[data-testid="credit-card-bandeira"]').select('VISA');
    cy.get('[data-testid="credit-card-cvv"]').type('000');
    cy.get('[data-testid="credit-card-form-submit"]').click();

    cy.wait('@addCardFail');
    cy.get('[data-testid="credit-card-form-server-error"]').should('be.visible');
  });
});

// ── Password Change ───────────────────────────────────────────────────────────

describe('Password Change', () => {
  beforeEach(() => {
    setupAuth();
    cy.visit('/account/change-password');
    cy.get('[data-testid="change-password-form"]', { timeout: 10000 }).should('be.visible');
  });

  it('displays the change password form', () => {
    cy.get('[data-testid="change-password-senhaAtual"]').should('be.visible');
    cy.get('[data-testid="change-password-novaSenha"]').should('be.visible');
    cy.get('[data-testid="change-password-confirmacaoSenha"]').should('be.visible');
    cy.get('[data-testid="change-password-submit"]').should('be.visible');
  });

  it('shows validation errors on empty submit', () => {
    cy.get('[data-testid="change-password-submit"]').click();
    cy.get(
      '[data-testid="change-password-senhaAtual-error"], [data-testid="change-password-novaSenha-error"]',
    ).should('have.length.greaterThan', 0);
  });

  it('shows error when new password is too weak', () => {
    cy.get('[data-testid="change-password-senhaAtual"]').type('Senha@123');
    cy.get('[data-testid="change-password-novaSenha"]').type('weak');
    cy.get('[data-testid="change-password-submit"]').click();
    cy.get('[data-testid="change-password-novaSenha-error"]').should('be.visible');
  });

  it('shows error when confirmation does not match', () => {
    cy.get('[data-testid="change-password-senhaAtual"]').type('Senha@123');
    cy.get('[data-testid="change-password-novaSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="change-password-confirmacaoSenha"]').type('NovaSenha@789');
    cy.get('[data-testid="change-password-submit"]').click();
    cy.get('[data-testid="change-password-confirmacaoSenha-error"]').should('be.visible');
  });

  it('changes password successfully (mocked)', () => {
    cy.intercept('PATCH', '**/cliente/senha', {
      statusCode: 200,
      body: { message: 'Senha alterada com sucesso.' },
    }).as('changePassword');

    cy.get('[data-testid="change-password-senhaAtual"]').type('Senha@123');
    cy.get('[data-testid="change-password-novaSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="change-password-confirmacaoSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="change-password-submit"]').click();

    cy.wait('@changePassword');
    cy.get('[data-testid="change-password-success"]').should('be.visible');
  });

  it('shows error when current password is incorrect', () => {
    cy.intercept('PATCH', '**/cliente/senha', {
      statusCode: 401,
      body: { message: 'Senha atual incorreta.' },
    }).as('changePasswordFail');

    cy.get('[data-testid="change-password-senhaAtual"]').type('SenhaErrada@1');
    cy.get('[data-testid="change-password-novaSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="change-password-confirmacaoSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="change-password-submit"]').click();

    cy.wait('@changePasswordFail');
    cy.get('[data-testid="change-password-server-error"]').should('be.visible');
  });

  it('shows password strength indicator while typing new password', () => {
    cy.get('[data-testid="change-password-novaSenha"]').type('NovaSenha@456');
    cy.get('[data-testid="password-strength-indicator"]').should('be.visible');
  });

  it('toggles password visibility', () => {
    cy.get('[data-testid="change-password-senhaAtual"]').type('Senha@123');
    cy.get('[data-testid="change-password-senhaAtual"]').should('have.attr', 'type', 'password');
    cy.get('[data-testid="toggle-senhaAtual"]').click();
    cy.get('[data-testid="change-password-senhaAtual"]').should('have.attr', 'type', 'text');
  });
});

// ── Mobile responsiveness ─────────────────────────────────────────────────────

describe('Account — Mobile Responsiveness', () => {
  beforeEach(() => {
    cy.mobile();
    setupAuth();
  });

  it('profile page renders correctly on mobile', () => {
    cy.visit('/account/profile');
    cy.get('[data-testid="profile-form"]', { timeout: 10000 }).should('exist');
  });

  it('addresses page renders correctly on mobile', () => {
    cy.intercept('GET', '**/cliente/enderecos', {
      statusCode: 200,
      body: { data: clienteFixture.enderecos },
    });
    cy.visit('/account/addresses');
    cy.get('[data-testid="address-list"]', { timeout: 10000 }).should('exist');
  });
});
