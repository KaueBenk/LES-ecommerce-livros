describe('Cenário 04: Usuário solicita troca ou devolução', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  const addMultipleBooksToCart = (bookIds) => {
    bookIds.forEach((bookId, index) => {
      cy.visit('/');
      cy.get('[data-testid^="add-to-cart-btn-"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
      cy.get(`[data-testid="add-to-cart-btn-${bookId}"]`).click();
      cy.contains('adicionado ao carrinho').should('be.visible');
      cy.wait(1500);
    });
  };

  it('deve solicitar troca de um item do pedido (quantidade parcial)', () => {
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');

    // 1. Compra com 2 items
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    addMultipleBooksToCart([1, 2]);
    
    cy.visit('/cart');
    cy.get('[data-testid^="cart-item-"]').should('have.length', 2);
    cy.get('[data-testid="checkout-btn"]').click();
    
    // Checkout
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 }).then(($els) => {
      const oddEl = [...$els].find(el => Number(el.textContent.trim().slice(-1)) % 2 === 1);
      const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
        const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
      });
    });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.get('[data-testid="order-number"]', { timeout: 20000 }).invoke('text').then((orderText) => {
      const orderNum = orderText.trim();
      cy.log(`Pedido: ${orderNum}`);
      
      // 2. Admin entrega
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/logistica');
      
      cy.contains('[data-testid^="order-row-"]', orderNum, { timeout: 15000 }).within(() => {
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

      // 3. Cliente solicita troca
      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/account/orders');
      
      cy.contains('[data-testid="order-numero"]', orderNum).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]', { timeout: 10000 }).click();
      });

      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type('Troca parcial');
      cy.get('[data-testid="exchange-submit-btn"]').click();
      cy.wait('@requestExchange');
      cy.contains('Solicitação de troca enviada').should('be.visible');
    });
  });

  it('deve solicitar troca do pedido completo (quantidade total)', () => {
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');

    // 1. Compra com 2 items
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    addMultipleBooksToCart([1, 2]);
    
    cy.visit('/cart');
    cy.get('[data-testid^="cart-item-"]').should('have.length', 2);
    cy.get('[data-testid="checkout-btn"]').click();
    
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 }).then(($els) => {
      const oddEl = [...$els].find(el => Number(el.textContent.trim().slice(-1)) % 2 === 1);
      const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
        const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
      });
    });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.get('[data-testid="order-number"]', { timeout: 20000 }).invoke('text').then((orderText) => {
      const orderNum = orderText.trim();
      
      // 2. Admin entrega
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/logistica');
      
      cy.contains('[data-testid^="order-row-"]', orderNum, { timeout: 15000 }).within(() => {
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

      // 3. Cliente solicita troca de todos os items
      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/account/orders');
      
      cy.contains('[data-testid="order-numero"]', orderNum).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]', { timeout: 10000 }).click();
      });

      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').each(($chk) => {
        cy.wrap($chk).check({ force: true });
      });
      cy.get('[data-testid="exchange-justificativa"]').type('Troca completa');
      cy.get('[data-testid="exchange-submit-btn"]').click();
      cy.wait('@requestExchange');
      cy.contains('Solicitação de troca enviada').should('be.visible');
    });
  });
});
