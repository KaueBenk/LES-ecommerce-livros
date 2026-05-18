
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
    cy.intercept('GET', '**/clientes/cartoes').as('getCards');

    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();

    // Step 1: Endereço
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 2: Cupons (pula)
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3: Pagamento (seleciona um cartão ímpar para aprovação automática)
    cy.wait('@getCards');
    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 })
      .should('have.length.at.least', 1)
      .then(($els) => {
        const oddEl = [...$els].find(el => Number(el.textContent.trim().slice(-1)) % 2 === 1);
        expect(oddEl, 'Necessário pelo menos um cartão ímpar no banco').to.exist;
        const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
        
        cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
        cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
          const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
          cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
        });
      });

    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Step 4: Confirmação
    cy.get('[data-testid="confirm-purchase-btn"]').should('be.visible').click();

    cy.wait('@finalizeOrder', { timeout: 30000 });
    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-number"]').should('be.visible').and('contain.text', 'PED-');
  });
});
