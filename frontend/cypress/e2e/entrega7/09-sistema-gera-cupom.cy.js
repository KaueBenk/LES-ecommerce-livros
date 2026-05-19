
describe('Cenário 09: Sistema gera cupom de troca', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  it('deve gerar um cupom de troca após confirmação de recebimento e validar compra com cupom', () => {
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('PATCH', '**/admin/trocas/*/autorizar').as('authorizeExchange');
    cy.intercept('PATCH', '**/admin/trocas/*/confirmar-recebimento').as('confirmReceipt');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');
    cy.intercept('GET', '**/clientes/cartoes').as('getCards');
    cy.intercept('GET', '**/clientes/cupons-troca').as('getCoupons');
    cy.intercept('POST', '**/carrinho/aplicar-cupom').as('applyCoupon');
    cy.intercept('POST', '**/pedidos').as('createOrder');

    // 1. Setup: Criar pedido entregue, solicitar troca e finalizar
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

      // Entregar o pedido
      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/logistica', { timeout: 10000 });
      cy.get('[data-testid^="order-row-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
      
      // Procura pela linha contendo o número do pedido
      cy.get('[data-testid^="order-row-"]').each(($row) => {
        cy.wrap($row).invoke('text').then((text) => {
          if (text.includes(orderNum) || text.includes(orderNum.replace('PED-', ''))) {
            cy.wrap($row).within(() => {
              cy.get('[data-testid^="confirm-payment-btn-"]').click();
            });
            cy.confirmActionModal();
            cy.wait('@confirmPayment');
            
            cy.wrap($row).within(() => {
              cy.get('[data-testid^="dispatch-btn-"]').click();
            });
            cy.confirmActionModal();
            cy.wait('@dispatchOrder');
            
            cy.wrap($row).within(() => {
              cy.get('[data-testid^="deliver-btn-"]').click();
            });
            cy.confirmActionModal();
            cy.wait('@deliverOrder');
          }
        });
      });

      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/account/orders', { timeout: 10000 });
      
      // Aguarda a lista de pedidos carregar
      cy.get('[data-testid^="order-card-"]', { timeout: 15000 }).should('have.length.greaterThan', 0);
      
      // Encontra o pedido pelo número
      cy.get('[data-testid="order-numero"]', { timeout: 15000 }).each(($el) => {
        cy.wrap($el).invoke('text').then((text) => {
          if (text.includes(orderNum) || text.trim() === orderNum) {
            cy.wrap($el)
              .closest('[data-testid^="order-card-"]')
              .within(() => {
                cy.get('[data-testid^="order-toggle-"]').click();
                cy.get('[data-testid^="exchange-btn-"]', { timeout: 10000 }).should('be.visible').click();
              });
          }
        });
      });
      const justification = `Cupom ${Date.now()}`;
      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type(justification);
      cy.get('[data-testid="exchange-submit-btn"]').click();
      
      cy.wait('@requestExchange');
      cy.contains('Solicitação de troca enviada', { timeout: 10000 }).should('be.visible');

      cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
      cy.visit('/admin/trocas', { timeout: 10000 });
      
      // Aguarda a tabela de trocas pendentes carregar
      cy.get('[data-testid="tab-pending"]', { timeout: 10000 }).should('exist');
      cy.url({ timeout: 10000 }).should('include', '/admin/trocas');
      
      // Encontra a troca pela justificativa
      cy.get('[data-testid^="pending-exchange-row-"]', { timeout: 15000 }).each(($row) => {
        cy.wrap($row).invoke('text').then((text) => {
          if (text.includes(justification)) {
            cy.wrap($row).within(() => {
              cy.get('[data-testid^="authorize-exchange-"]').click();
            });
          }
        });
      });
      
      cy.wait('@authorizeExchange');
      cy.contains('autorizada', { timeout: 10000 }).should('be.visible');
      
      // Aguarda e clica na aba de autorizadas
      cy.get('[data-testid="tab-authorized"]', { timeout: 10000 }).click();
      cy.get('[data-testid="tab-authorized-content"]', { timeout: 10000 }).should('be.visible');
      
      // Aguarda a tabela de autorizadas carregar e encontra a troca
      cy.get('[data-testid^="authorized-exchange-row-"]', { timeout: 15000 }).each(($row) => {
        cy.wrap($row).invoke('text').then((text) => {
          if (text.includes(orderNum) || text.includes(orderNum.replace('PED-', ''))) {
            cy.wrap($row).within(() => {
              cy.get('[data-testid^="confirm-receipt-"]').click();
            });
          }
        });
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

      // 3. Validar que o cliente consegue realizar uma compra usando o cupom gerado
      cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      cy.visit('/', { timeout: 10000 });
      cy.url({ timeout: 10000 }).should('not.include', '/login');
      
      cy.clearCart();
      cy.addToCart(2, 1);  // Adiciona livro diferente
      cy.visit('/cart', { timeout: 10000 });
      cy.get('[data-testid="checkout-btn"]').click();
      
      // Step 1
      cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
      cy.get('[data-testid="checkout-next-btn"]').click();
      
      // Step 2 - Aplicar cupom
      cy.get('[data-testid="promo-coupon-input"]').should('be.visible');
      cy.window().then(win => {
        const token = win.localStorage.getItem('auth_token');
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiBaseUrl')}/clientes/cupons-troca`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          const cupom = res.body.data[0].codigo;
          cy.get('[data-testid="promo-coupon-input"]').clear().type(cupom);
          cy.get('[data-testid="promo-coupon-apply-btn"]').click();
          
          // Aguarda o desconto ser aplicado (verificar que o elemento de desconto aparece)
          cy.get('[data-testid="promo-coupon-discount-value"]', { timeout: 10000 })
            .should('be.visible')
            .invoke('text')
            .then((text) => {
              // Valida que o desconto é maior que zero
              const discountText = text.replace(/[^0-9,-]/g, '').replace(',', '.');
              expect(Number(discountText)).to.be.greaterThan(0);
            });
        });
      });
      
      cy.get('[data-testid="checkout-next-btn"]').click();
      
      // Step 3
      cy.wait('@getCards');
      cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 })
        .should('have.length.at.least', 1)
        .then(($els) => {
          const oddEl = [...$els].find(el => Number(el.textContent.trim().slice(-1)) % 2 === 1);
          if (oddEl) {
            const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
            cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
            cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
              const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
              cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
            });
          }
        });

      cy.get('[data-testid="checkout-next-btn"]').click();
      cy.get('[data-testid="confirm-purchase-btn"]').should('be.visible').click();
      
      // Validar que a compra foi realizada com sucesso
      cy.get('[data-testid="order-number"]').should('be.visible');
      cy.contains('Compra realizada com sucesso', { timeout: 10000 }).should('be.visible');
    });
  });
});
