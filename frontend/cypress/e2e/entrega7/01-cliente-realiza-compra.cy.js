
describe('Cenário 01: Cliente realiza compra', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
  });

  it('deve realizar uma compra completa com sucesso', () => {
    cy.intercept('POST', '**/checkout/finalizar').as('finalizeOrder');

    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();

    // Endereço (seleciona o primeiro)
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Cupons (pula)
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Pagamento (seleciona um cartão ímpar para aprovação automática)
    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 }).each(($el) => {
      const text = $el.text().trim();
      if (Number(text.slice(-1)) % 2 === 1) {
        const id = $el.attr('data-testid').replace('payment-card-digits-', '');
        cy.wrap(id).as('cardId');
      }
    });

    cy.get('@cardId').then(id => {
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
        const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
      });
    });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.wait('@finalizeOrder');
    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-number"]').should('be.visible').and('contain.text', 'PED-');
  });
});
