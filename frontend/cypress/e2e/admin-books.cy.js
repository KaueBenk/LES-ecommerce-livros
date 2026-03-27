/**
 * cypress/e2e/admin-books.cy.js
 * Fluxos administrativos com API real (sem respostas mockadas).
 */

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';

const loginAsAdminAndVisit = (path = '/admin') => {
  cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  cy.visit(path);
};

describe('Admin Books (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('carrega painel admin e lista de livros reais', () => {
    loginAsAdminAndVisit('/admin');

    cy.get('[data-testid="admin-dashboard"]').should('be.visible');
    cy.get('[data-testid="admin-nav-books"]').click();

    cy.url().should('include', '/admin/livros');
    cy.get('[data-testid="admin-books-table-wrapper"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid^="admin-book-row-"]').should('have.length.greaterThan', 0);
  });

  it('cadastra livro real e inativa via modal de justificativa', () => {
    const stamp = String(Date.now());
    const isbn = `978${stamp.slice(-10)}`;
    const codigoBarras = `789${stamp.slice(-10)}`;
    const titulo = `Livro Cypress Real ${stamp.slice(-6)}`;

    loginAsAdminAndVisit('/admin/livros/novo');

    cy.get('[data-testid="book-form-page"]', { timeout: 15000 }).should('be.visible');

    // Step 1
    cy.get('[data-testid="field-titulo"]').type(titulo);
    cy.get('[data-testid="field-autorId"]').select(1);
    cy.get('[data-testid="field-editoraId"]').select(1);
    cy.get('[data-testid="field-edicao"]').type('1');
    cy.get('[data-testid="field-ano"]').type('2026');
    cy.get('[data-testid="field-isbn"]').clear().type(isbn);
    cy.get('[data-testid="book-form-next-btn"]').click();

    // Step 2
    cy.get('[data-testid="book-form-step2"]').should('be.visible');
    cy.get('[data-testid="field-numeroPaginas"]').clear().type('320');
    cy.get('[data-testid="field-codigoBarras"]').clear().type(codigoBarras);
    cy.get('[data-testid="field-sinopse"]').type('Livro criado via Cypress usando backend real.');
    cy.get('[data-testid="field-altura"]').clear().type('23');
    cy.get('[data-testid="field-largura"]').clear().type('16');
    cy.get('[data-testid="field-profundidade"]').clear().type('2');
    cy.get('[data-testid="field-peso"]').clear().type('0.45');
    cy.get('[data-testid="book-form-next-btn"]').click();

    // Step 3
    cy.get('[data-testid="book-form-step3"]').should('be.visible');
    cy.get('[data-testid="field-grupoPrecificacaoId"]').select(1);
    cy.get('[data-testid="field-precoVenda"]').clear().type('79.9');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="category-checkbox-"]').length > 0) {
        cy.get('[data-testid^="category-checkbox-"]').first().check({ force: true });
      }
    });
    cy.intercept('POST', '**/api/v1/admin/livros').as('createBook');
    cy.get('[data-testid="book-form-submit-btn"]').click();
    cy.wait('@createBook').then((interception) => {
      expect(interception?.response?.statusCode).to.eq(201);
      const createdBookId = interception?.response?.body?.data?.id;
      expect(createdBookId, 'id do livro criado').to.exist;
      cy.wrap(Number(createdBookId)).as('createdBookId');
    });

    cy.url({ timeout: 15000 }).should('include', '/admin/livros');
    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token');
      expect(token, 'token de admin autenticado').to.be.a('string').and.not.be.empty;

      cy.get('@createdBookId').then((createdBookId) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiBaseUrl')}/livros/${createdBookId}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body?.data?.titulo).to.eq(titulo);
          expect(Boolean(response.body?.data?.ativo)).to.eq(true);
        });
      });
    });

    cy.get('[data-testid^="admin-book-row-"]', { timeout: 15000 }).then(($rows) => {
      const activeRow = [...$rows].find((row) => {
        const statusNode = row.querySelector('[data-testid^="book-status-"]');
        return statusNode && statusNode.textContent.trim() === 'Ativo';
      });
      expect(activeRow, 'linha ativa para inativação via modal').to.exist;
      const rowTestId = activeRow.getAttribute('data-testid') || '';
      const bookId = rowTestId.replace('admin-book-row-', '');
      cy.wrap(bookId).as('targetBookId');
    });

    cy.get('@targetBookId').then((bookId) => {
      cy.intercept('PATCH', '**/api/v1/admin/livros/*/inativar').as('inactivateBook');
      cy.get(`[data-testid="toggle-book-${bookId}"]`).click();
    });

    cy.get('[data-testid="status-modal"]').should('be.visible');
    cy.get('[data-testid="status-modal-motivo"]').type('Inativação de teste automatizado.');
    cy.get('[data-testid="status-modal-categoria"]').select(1);
    cy.get('[data-testid="status-modal-confirm"]').click();
    cy.wait('@inactivateBook').its('response.statusCode').should('eq', 200);

    cy.window().then((win) => {
      const token = win.localStorage.getItem('auth_token');
      expect(token, 'token de admin autenticado').to.be.a('string').and.not.be.empty;

      cy.get('@targetBookId').then((bookId) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiBaseUrl')}/livros/${bookId}`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(Boolean(response.body?.data?.ativo)).to.eq(false);
        });
      });
    });
  });

  it('registra entrada de estoque real', () => {
    const today = new Date().toISOString().split('T')[0];

    loginAsAdminAndVisit('/admin/estoque/entrada');

    cy.get('[data-testid="stock-entry-page"]', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/admin/estoque/entrada');
    cy.get('[data-testid="stock-entry-form"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="field-quantidade"]').clear().type('5');
    cy.get('[data-testid="field-valorCusto"]').clear().type('45');
    cy.get('[data-testid="field-dataEntrada"]').clear().type(today);

    cy.get('[data-testid="field-fornecedorId"]').then(($field) => {
      if ($field.prop('tagName') === 'SELECT') {
        cy.get('[data-testid="field-fornecedorId"]').find('option').its('length').should('be.gte', 2);
        cy.get('[data-testid="field-fornecedorId"]').select(1);
      } else {
        cy.get('[data-testid="field-fornecedorId"]').clear().type('1');
      }
    });

    cy.get('[data-testid="book-search-input"]').should('be.visible').clear().type('Clean');
    cy.get('[data-testid="book-search-results"] [data-testid^="book-option-"]', { timeout: 15000 })
      .should('have.length.greaterThan', 0)
      .first()
      .click();

    cy.get('[data-testid="stock-entry-submit"]').should('be.visible').and('not.be.disabled').click();
    cy.get('[data-testid="stock-entry-submit-error"]', { timeout: 15000 }).should('not.exist');

    cy.get('[data-testid="stock-history-section"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="stock-history-table-wrapper"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid^="history-row-"]').should('have.length.greaterThan', 0);
  });
});
