/* global cy, describe, it, beforeEach, expect */

describe('Cenário 05: Administrador confirma o pagamento', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  it('deve confirmar o pagamento de um pedido pendente', () => {
    cy.intercept('PATCH', '**/vendas/*/confirmar-pagamento').as('confirmPayment');

    // 1. Cliente faz compra
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Escolhe cartão ímpar (para cair em APROVADA e precisar confirmar pagamento no admin)
    cy.get('[data-testid^="payment-card-digits-"]').each(($el) => {
      if (Number($el.text().trim().slice(-1)) % 2 === 1) {
        const id = $el.attr('data-testid').replace('payment-card-digits-', '');
        cy.wrap(id).as('cid');
      }
    });
    cy.get('@cid').then(id => {
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
        const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
      });
    });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    cy.get('[data-testid="order-number"]').invoke('text').then(num => {
      const orderNum = num.trim();

      // 2. Admin confirma pagamento
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/logistica');
      cy.get('[data-testid="filter-status"]').select('');
      cy.get('[data-testid="filter-submit"]').click();
      
      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="confirm-payment-btn-"]').click();
      });
      cy.confirmActionModal();
      
      cy.wait('@confirmPayment');
      cy.contains('confirmado', { timeout: 10000 }).should('be.visible');
    });
  });
});
