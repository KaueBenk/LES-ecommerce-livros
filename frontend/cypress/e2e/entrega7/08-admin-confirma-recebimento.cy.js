
describe('Cenário 08: Administrador confirma recebimento do produto devolvido', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  it('deve confirmar recebimento de uma troca autorizada', () => {
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('PATCH', '**/admin/trocas/*/autorizar').as('authorizeExchange');
    cy.intercept('PATCH', '**/admin/trocas/*/confirmar-recebimento').as('confirmReceipt');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');
    cy.intercept('GET', '**/clientes/cartoes').as('getCards');

    // 1. Setup: Criar pedido entregue e solicitar troca
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();
    
    // Step 1
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Step 2
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Step 3
    cy.wait('@getCards');
    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 })
      .should('have.length.at.least', 1)
      .then(($els) => {
        const oddEl = [...$els].find(el => Number(el.textContent.trim().slice(-1)) % 2 === 1);
        expect(oddEl, 'Necessário cartão ímpar').to.exist;
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

      // Entregar
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

      cy.contains('[data-testid^="order-row-"]', orderNum).within(() => {
        cy.get('[data-testid^="deliver-btn-"]').click();
      });
      cy.confirmActionModal();
      cy.wait('@deliverOrder');

      // Solicitar troca
      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', orderNum).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').should('be.visible').click();
      });
      const justification = `Recebimento ${Date.now()}`;
      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type(justification);
      cy.get('[data-testid="exchange-submit-btn"]').click();
      
      cy.wait('@requestExchange');
      cy.contains('Solicitação de troca enviada', { timeout: 10000 }).should('be.visible');

      // 2. Admin autoriza e depois confirma recebimento
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/trocas');
      cy.contains('[data-testid^="pending-exchange-row-"]', justification, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="authorize-exchange-"]').click();
      });
      cy.wait('@authorizeExchange');
      cy.contains('autorizada', { timeout: 10000 }).should('be.visible');

      cy.get('[data-testid="tab-authorized"]').click();
      cy.contains('[data-testid^="authorized-exchange-row-"]', orderNum, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="confirm-receipt-"]').click();
      });
      
      cy.wait('@confirmReceipt');
      cy.contains('finalizada', { timeout: 10000 }).should('be.visible');
    });
  });
});
