/* global cy, describe, it, beforeEach, expect */

describe('Cenário 04: Usuário solicita troca ou devolução', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  const checkoutOrder = (qty) => {
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    cy.addToCart(1, qty);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 }).then(($els) => {
      const oddEl = [...$els].find(
        (el) => Number(el.textContent.trim().slice(-1)) % 2 === 1,
      );

      expect(oddEl, 'Necessário 1 cartão ímpar para aprovação').to.exist;
      const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
      cy.wrap(id).as('cid');
    });

    cy.get('@cid').then((id) => {
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((t) => {
        const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
      });
    });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    return cy.get('[data-testid="order-number"]', { timeout: 20000 })
      .invoke('text')
      .then((num) => num.trim());
  };

  const deliverOrderAsAdmin = (orderNum) => {
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
  };

  const requestExchangeAsCustomer = (orderNum, qtyToExchange) => {
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.visit('/account/orders');
    cy.contains('[data-testid="order-numero"]', orderNum)
      .closest('[data-testid^="order-card-"]')
      .within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').click();
      });

    cy.get('[data-testid="exchange-modal"]').should('be.visible');
    cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });

    cy.get('[data-testid^="exchange-qty-"]').first().clear().type(String(qtyToExchange));

    cy.get('[data-testid="exchange-justificativa"]').type(
      `Troca solicitada via teste automatizado (qtd=${qtyToExchange})`,
    );
    cy.get('[data-testid="exchange-submit-btn"]').click();

    cy.wait('@requestExchange');
    cy.contains('Solicitação de troca enviada', { timeout: 10000 }).should('be.visible');
  };

  it('deve solicitar troca de um item do pedido (quantidade parcial)', () => {
    // Intercepta ações de logística para garantir sincronização
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');

    // Pedido com quantidade 2 → troca parcial (qty=1)
    checkoutOrder(2).then((orderNum) => {
      deliverOrderAsAdmin(orderNum);
      requestExchangeAsCustomer(orderNum, 1);
    });
  });

  it('deve solicitar troca do pedido completo (quantidade total)', () => {
    // Intercepta ações de logística para garantir sincronização
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');

    // Pedido com quantidade 2 → troca total (qty=2)
    checkoutOrder(2).then((orderNum) => {
      deliverOrderAsAdmin(orderNum);
      requestExchangeAsCustomer(orderNum, 2);
    });
  });
});
