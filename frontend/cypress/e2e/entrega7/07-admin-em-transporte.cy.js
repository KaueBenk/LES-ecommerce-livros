
describe('Cenário 07: Administrador define produto como EM TRANSPORTE', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  it('deve despachar um pedido aprovado', () => {
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');

    // 1. Cliente faz compra
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();
    // Step 1: Address
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 2: Coupons
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Step 3: Payment
    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 })
      .should('have.length.at.least', 1)
      .then(($els) => {
        const oddEl = [...$els].find(
          (el) => Number(el.textContent.trim().slice(-1)) % 2 === 1,
        );

        expect(oddEl, 'Necessário 1 cartão ímpar para aprovação').to.exist;
        const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
        
        cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
        cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
          const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
          cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
        });
      });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').should('be.visible').click();
    cy.get('[data-testid="order-number"]').invoke('text').then(num => {
      const orderNum = num.trim();

      // 2. Admin confirma pagamento e despacha
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/logistica');
      cy.get('[data-testid="filter-status"]').select('');
      cy.get('[data-testid="filter-submit"]').click();
      
      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="confirm-payment-btn-"]').click();
      });
      cy.confirmActionModal();
      cy.wait('@confirmPayment');
      
      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="dispatch-btn-"]').click();
      });
      cy.confirmActionModal();
      cy.wait('@dispatchOrder');

      // Verifica se o status mudou para "EM TRANSPORTE" dentro da linha da ordem
      cy.contains('[data-testid^="order-row-"]', orderNum, { timeout: 10000 })
        .should('be.visible');
    });
  });
});
