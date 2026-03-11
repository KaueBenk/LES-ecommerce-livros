/**
 * cypress/e2e/admin-book-auto-inactivation.cy.js
 * Cobre execução manual da inativação automática de livros (RF0013/RN0016).
 */

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';

const loginAsAdminAndVisit = (path = '/admin/livros') => {
  cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
  cy.visit(path);
};

const createBookWithoutStock = (titulo, isbn, codigoBarras) => {
  loginAsAdminAndVisit('/admin/livros/novo');
  cy.intercept('POST', '**/api/v1/admin/livros').as('createBook');

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
  cy.get('[data-testid="field-numeroPaginas"]').clear().type('280');
  cy.get('[data-testid="field-codigoBarras"]').clear().type(codigoBarras);
  cy.get('[data-testid="field-sinopse"]').type('Livro sem estoque para validar inativação automática.');
  cy.get('[data-testid="field-altura"]').clear().type('23');
  cy.get('[data-testid="field-largura"]').clear().type('16');
  cy.get('[data-testid="field-profundidade"]').clear().type('2');
  cy.get('[data-testid="field-peso"]').clear().type('0.45');
  cy.get('[data-testid="book-form-next-btn"]').click();

  // Step 3
  cy.get('[data-testid="book-form-step3"]').should('be.visible');
  cy.get('[data-testid="field-grupoPrecificacaoId"]').select(1);
  cy.get('[data-testid="field-precoVenda"]').clear().type('69.9');
  cy.get('[data-testid^="category-checkbox-"]').first().check({ force: true });
  cy.get('[data-testid="book-form-submit-btn"]').click();
  cy.wait('@createBook').then((interception) => {
    expect(interception?.response?.statusCode).to.eq(201);
    const createdId = interception?.response?.body?.data?.id;
    expect(createdId, 'id do livro criado').to.exist;
    cy.wrap(Number(createdId)).as('createdBookId');
  });

  cy.url({ timeout: 15000 }).should('include', '/admin/livros');
};

describe('Admin Book Auto Inactivation (real backend + real UI)', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('inativa automaticamente livro ativo sem estoque e baixa venda', () => {
    const stamp = String(Date.now());
    const titulo = `Livro Auto Inativacao ${stamp.slice(-6)}`;
    const isbn = `978${stamp.slice(-10)}`;
    const codigoBarras = `789${stamp.slice(-10)}`;

    createBookWithoutStock(titulo, isbn, codigoBarras);

    cy.intercept('POST', '**/api/v1/admin/livros/inativacao-automatica').as('autoInactivate');
    cy.get('[data-testid="auto-inactivate-books-btn"]').click();
    cy.wait('@autoInactivate').then((interception) => {
      expect(interception?.response?.statusCode).to.eq(200);
      cy.get('@createdBookId').then((createdBookId) => {
        const livrosInativados = interception?.response?.body?.data?.livrosInativados || [];
        const found = livrosInativados.some((item) => Number(item?.livroId) === Number(createdBookId));
        expect(found, 'livro criado incluído na inativação automática').to.eq(true);
      });
    });

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
          const createdBook = response.body?.data;
          expect(createdBook, 'livro criado retornado por id').to.exist;
          expect(Boolean(createdBook.ativo)).to.eq(false);
        });
      });
    });
  });
});
