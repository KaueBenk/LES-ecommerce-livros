/* global cy, describe, it, beforeEach, expect */

describe('Cenário 06: Administrador aceita ou nega a troca/devolução', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  it('deve rejeitar uma solicitação de troca', () => {
    // 1. Setup: Criar pedido entregue e solicitar troca
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();
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

      // Entregar
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/logistica');
      cy.get('[data-testid="filter-status"]').select('');
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="confirm-payment-btn-"]').click();
      });
      cy.confirmActionModal();
      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="dispatch-btn-"]').click();
      });
      cy.confirmActionModal();
      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="deliver-btn-"]').click();
      });
      cy.confirmActionModal();

      // Solicitar troca
      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', orderNum).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').click();
      });
      const justification = `Rejeicao ${Date.now()}`;
      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type(justification);
      cy.get('[data-testid="exchange-submit-btn"]').click();

      // 2. Admin rejeita
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/trocas');
      cy.contains('[data-testid^="pending-exchange-row-"]', justification).within(() => {
        cy.get('[data-testid^="reject-exchange-"]').click();
      });
      
      cy.contains('rejeitada', { timeout: 10000 }).should('be.visible');
    });
  });
});
