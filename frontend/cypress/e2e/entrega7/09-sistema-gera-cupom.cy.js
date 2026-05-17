/* global cy, describe, it, beforeEach, expect, Cypress */

describe('Cenário 09: Sistema gera cupom de troca', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  it('deve gerar um cupom de troca após confirmação de recebimento', () => {
    cy.intercept('PATCH', '**/pedidos/trocas/*/autorizar').as('authorizeExchange');
    cy.intercept('PATCH', '**/pedidos/trocas/*/receber').as('confirmReceipt');

    // 1. Setup: Criar pedido entregue, solicitar troca e finalizar
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

      // Entregar e Trocar
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

      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', orderNum).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').click();
      });
      const justification = `Cupom ${Date.now()}`;
      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type(justification);
      cy.get('[data-testid="exchange-submit-btn"]').click();

      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/trocas');
      cy.contains('[data-testid^="pending-exchange-row-"]', justification).within(() => {
        cy.get('[data-testid^="authorize-exchange-"]').click();
      });
      cy.wait('@authorizeExchange');
      cy.contains('autorizada', { timeout: 10000 }).should('be.visible');
      
      cy.get('[data-testid="tab-authorized"]').click();
      cy.contains('[data-testid^="authorized-exchange-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="confirm-receipt-"]').click();
      });
      cy.wait('@confirmReceipt');
      cy.contains('finalizada', { timeout: 10000 }).should('be.visible');

      // 2. Verificar cupom via API (mais rápido e seguro)
      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.window().then(win => {
        const token = win.localStorage.getItem('auth_token');
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiBaseUrl')}/clientes/cupons-troca`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          const coupons = res.body.data;
          expect(coupons.length).to.be.greaterThan(0);
          expect(Number(coupons[0].valor)).to.be.greaterThan(0);
        });
      });
    });
  });
});
