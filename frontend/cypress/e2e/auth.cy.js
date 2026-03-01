/**
 * cypress/e2e/auth.cy.js
 * E2E tests for Authentication — Registration, Login, Logout.
 *
 * US-042 | FE-032
 */

// ── Shared fixtures ──────────────────────────────────────────────────────────

const validUser = {
  nome: 'João Teste Silva',
  email: `joao.teste.${Date.now()}@example.com`,
  senha: 'Senha@123',
  genero: 'MASCULINO',
  cpf: '123.456.789-00',
  dataNascimento: '1990-05-20',
};

// ── Registration ─────────────────────────────────────────────────────────────

describe('Registration', () => {
  beforeEach(() => {
    cy.visit('/register');
    cy.get('[data-testid="register-form"]', { timeout: 10000 }).should('be.visible');
  });

  it('displays the registration form', () => {
    cy.get('[data-testid="register-form"]').should('exist');
    cy.get('[data-testid="name-input"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="register-submit"]').should('be.visible');
  });

  it('shows validation errors when submitted empty', () => {
    cy.get('[data-testid="register-submit"]').click();
    // At least one validation error should appear
    cy.get('[data-testid="name-error"], [data-testid="email-error"], [data-testid="password-error"]')
      .should('have.length.greaterThan', 0);
  });

  it('shows password strength indicator while typing', () => {
    cy.get('[data-testid="password-input"]').type('weak');
    cy.get('[data-testid="password-strength-indicator"]').should('be.visible');
    cy.get('[data-testid="password-strength-label"]').should('be.visible');
  });

  it('shows weak-password error on submission with short password', () => {
    cy.get('[data-testid="name-input"]').type(validUser.nome);
    cy.get('[data-testid="email-input"]').type(validUser.email);
    cy.get('[data-testid="password-input"]').type('short');
    cy.get('[data-testid="password-confirm-input"]').type('short');
    cy.get('[data-testid="register-submit"]').click();
    cy.get('[data-testid="password-error"]').should('be.visible');
  });

  it('shows mismatch error when passwords do not match', () => {
    cy.get('[data-testid="password-input"]').type('Senha@123');
    cy.get('[data-testid="password-confirm-input"]').type('Senha@999');
    cy.get('[data-testid="register-submit"]').click();
    cy.get('[data-testid="password-confirm-error"]').should('be.visible');
  });

  it('shows API error on duplicate email (mocked)', () => {
    cy.mockAPI(
      'POST',
      '**/auth/register',
      {
        status: 409,
        message: 'Email já cadastrado.',
      },
      'registerDuplicate',
    );

    cy.intercept('POST', '**/auth/register', {
      statusCode: 409,
      body: { message: 'Email já cadastrado.' },
    }).as('registerDuplicate');

    cy.get('[data-testid="name-input"]').type(validUser.nome);
    cy.get('[data-testid="email-input"]').type(validUser.email);
    cy.get('[data-testid="password-input"]').type(validUser.senha);
    cy.get('[data-testid="password-confirm-input"]').type(validUser.senha);
    cy.get('[data-testid="gender-select"]').select(validUser.genero);
    cy.get('[data-testid="cpf-input"]').type(validUser.cpf);
    cy.get('[data-testid="birth-date-input"]').type(validUser.dataNascimento);
    cy.get('[data-testid="register-submit"]').click();

    cy.wait('@registerDuplicate');
    cy.get('[data-testid="register-error-message"]').should('be.visible');
  });

  it('registers successfully with valid data (mocked)', () => {
    cy.intercept('POST', '**/auth/register', {
      statusCode: 201,
      body: { data: { token: 'fake-jwt-token', usuario: { nome: validUser.nome } } },
    }).as('registerSuccess');

    cy.get('[data-testid="name-input"]').type(validUser.nome);
    cy.get('[data-testid="email-input"]').type(`success${Date.now()}@test.com`);
    cy.get('[data-testid="password-input"]').type(validUser.senha);
    cy.get('[data-testid="password-confirm-input"]').type(validUser.senha);
    cy.get('[data-testid="gender-select"]').select(validUser.genero);
    cy.get('[data-testid="cpf-input"]').type(validUser.cpf);
    cy.get('[data-testid="birth-date-input"]').type(validUser.dataNascimento);
    cy.get('[data-testid="register-submit"]').click();

    cy.wait('@registerSuccess');
    // After successful registration, user is redirected away from /register
    cy.url().should('not.include', '/register');
  });

  it('has a link to the login page', () => {
    cy.get('[data-testid="login-link"]').should('be.visible').click();
    cy.url().should('include', '/login');
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────

describe('Login', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]', { timeout: 8000 }).should('be.visible');
  });

  it('displays the login form', () => {
    cy.get('[data-testid="login-form"]').should('exist');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-submit"]').should('be.visible');
  });

  it('shows validation error on empty submission', () => {
    cy.get('[data-testid="login-submit"]').click();
    cy.get('[data-testid="email-error"], [data-testid="login-error-message"]').should('exist');
  });

  it('shows error with invalid credentials (mocked)', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 401,
      body: { message: 'Credenciais inválidas.' },
    }).as('loginFail');

    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('WrongPass@1');
    cy.get('[data-testid="login-submit"]').click();

    cy.wait('@loginFail');
    cy.get('[data-testid="login-error-message"]').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('logs in successfully with valid credentials (mocked)', () => {
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: {
        data: {
          token: 'valid-fake-jwt-token',
          usuario: { id: 1, nome: 'Ana Silva', email: 'ana@example.com', roles: ['ROLE_CLIENTE'] },
        },
      },
    }).as('loginSuccess');

    cy.get('[data-testid="email-input"]').type('ana@example.com');
    cy.get('[data-testid="password-input"]').type('Senha@123');
    cy.get('[data-testid="login-submit"]').click();

    cy.wait('@loginSuccess');
    // Redirected away from /login after successful authentication
    cy.url().should('not.include', '/login');
  });

  it('has a link to the register page', () => {
    cy.get('[data-testid="register-link"]').should('be.visible').click();
    cy.url().should('include', '/register');
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────

describe('Logout', () => {
  beforeEach(() => {
    // Programmatically set a fake token so the app thinks the user is logged in
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-jwt-token');
    });
  });

  it('logs out via cy.logout() and lands on /login', () => {
    cy.logout();
    cy.url().should('include', '/login');
  });

  it('clears auth_token from localStorage on logout', () => {
    cy.logout();
    cy.window().then((win) => {
      expect(win.localStorage.getItem('auth_token')).to.be.null;
    });
  });

  it('nav login button is visible after logout', () => {
    cy.logout();
    cy.get('[data-testid="nav-login"]').should('be.visible');
  });
});
