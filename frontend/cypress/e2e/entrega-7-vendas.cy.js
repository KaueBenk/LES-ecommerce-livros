/* global cy, describe, it, beforeEach, expect, Cypress */

/**
 * venda-completa.cy.js
 * 
 * Teste consolidado para a 7a Entrega: Caso de Uso de Venda Completo.
 * Abrange todos os cenários obrigatórios com integração 100% backend.
 */

const CUSTOMER_EMAIL = 'joao@example.com';
const CUSTOMER_PASSWORD = 'Admin@123';
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'Admin@123';

const parseCurrency = (raw) => {
  const normalized = (raw || '')
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.');
  return Number(normalized);
};

const toOrderPattern = (orderNumber) => {
  cy.log(`Refining order number search for: ${orderNumber}`);
  const numeric = Number(String(orderNumber || '').replace(/\D/g, ''));
  if (Number.isNaN(numeric) || numeric === 0) {
    return new RegExp(String(orderNumber || 'PED').replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
  return new RegExp(`PED-0*${numeric}\\b`);
};

const clearCart = () => {
  cy.visit('/cart');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="cart-empty"]').length > 0) return;
    if ($body.find('[data-testid="clear-cart-btn"]').length > 0) {
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
      });
      cy.get('[data-testid="clear-cart-btn"]').click();
      cy.get('[data-testid="cart-empty"]', { timeout: 15000 }).should('be.visible');
    }
  });
};

const loginAdmin = () => {
  cy.logout();
  cy.login(ADMIN_EMAIL, ADMIN_PASSWORD);
};

const loginCustomer = () => {
  cy.logout();
  cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
};

const confirmActionModal = () => {
  cy.get('[data-testid="confirm-action-modal"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="confirm-modal-ok"]').click();
  cy.get('[data-testid="confirm-action-modal"]', { timeout: 15000 }).should('not.exist');
};

describe('7a Entrega - Caso de Uso de Venda Completo', () => {
  beforeEach(() => {
    cy.desktop();
  });

  it('Cenário: Cliente realiza compra com registro de NOVO cartão e NOVO endereço', () => {
    loginCustomer();
    clearCart();
    
    // Adiciona ao carrinho
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="checkout-btn"]', { timeout: 10000 }).should('be.visible').click();

    // Passo 1: Novo Endereço
    const uniqueAddr = `Entrega 7A - ${Date.now()}`;
    cy.get('[data-testid="add-address-btn"]').click();
    cy.get('[data-testid="address-apelido-input"]').type(uniqueAddr);
    cy.get('[data-testid="address-tipo-select"]').select('ENTREGA');
    cy.get('[data-testid="address-residencia-select"]').select('CASA');
    cy.get('[data-testid="address-logradouro-tipo-select"]').select('RUA');
    cy.get('[data-testid="address-logradouro-input"]').type('Rua de Teste');
    cy.get('[data-testid="address-numero-input"]').type('456');
    cy.get('[data-testid="address-bairro-input"]').type('Novo Bairro');
    cy.get('[data-testid="address-cep-input"]').type('08210-040');
    cy.get('[data-testid="address-cidade-input"]').type('São Paulo');
    cy.get('[data-testid="address-estado-select"]').select('SP');
    cy.get('[data-testid="address-pais-input"]').type('Brasil');
    cy.get('[data-testid="address-form-save-button"]').click();
    
    cy.contains('[data-testid^="address-card-"]', uniqueAddr, { timeout: 20000 }).should('be.visible').click();
    cy.get('[data-testid="shipping-fee-value"]').should('contain.text', 'R$');
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Passo 2: Cupons (pular)
    cy.get('[data-testid="step-payment"]').should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Passo 3: Novo Cartão
    cy.get('[data-testid="step-payment-cards"]').should('be.visible');
    cy.get('[data-testid="add-card-btn"]').click();
    cy.get('[data-testid="credit-card-numero"]').type('4000000000001111'); // Final ímpar para aprovação
    cy.get('[data-testid="credit-card-nome"]').type('JOAO TESTE 7A');
    cy.get('[data-testid="credit-card-bandeira"]').select('VISA');
    cy.get('[data-testid="credit-card-cvv"]').type('123');
    cy.get('[data-testid="credit-card-form-submit"]').click();

    cy.contains('[data-testid^="payment-card-digits-"]', '1111', { timeout: 15000 }).then(($el) => {
      const cardId = $el.attr('data-testid').replace('payment-card-digits-', '');
      cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
        const val = parseCurrency(text);
        cy.get(`[data-testid="payment-card-value-${cardId}"]`).clear().type(val.toFixed(2));
      });
    });

    cy.get('[data-testid="payment-sum-match"]').should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Passo 4: Confirmação
    cy.get('[data-testid="step-confirmation"]').should('be.visible');
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-number"]', { timeout: 20000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.match(/PED-\d+/);
      });
  });

  it('Cenário: Cliente paga com COMBINAÇÃO de cartões + cupons (RN0034, RN0035)', () => {
    loginCustomer();
    clearCart();
    cy.addToCart(1, 2); 
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="checkout-btn"]', { timeout: 10000 }).should('be.visible').click();

    // Endereço
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Cupons
    cy.get('body', { timeout: 15000 }).then(($body) => {
      if ($body.find('[data-testid^="trade-coupon-checkbox-"]').length > 0) {
        cy.get('[data-testid^="trade-coupon-checkbox-"]').first().check({ force: true });
      }
    });
    cy.get('[data-testid="promo-coupon-input"]').type('PROMO123');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Pagamento com 2 cartões
    cy.get('[data-testid="step-payment-cards"]').should('be.visible');
    
    cy.get('[data-testid^="payment-card-digits-"]').then(($els) => {
      const oddCards = [...$els].filter(el => {
        const text = el.textContent.trim();
        return Number(text.slice(-1)) % 2 === 1;
      }).map(el => el.getAttribute('data-testid').replace('payment-card-digits-', ''));

      expect(oddCards.length, 'Deve haver pelo menos 2 cartões ímpares para este teste').to.be.at.least(2);
      
      const c1 = oddCards[0];
      const c2 = oddCards[1];

      cy.get(`[data-testid="payment-card-checkbox-${c1}"]`).check({ force: true });
      cy.get(`[data-testid="payment-card-checkbox-${c2}"]`).check({ force: true });

      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
        const total = parseCurrency(text);
        const part1 = 10.00;
        const part2 = total - part1;

        cy.get(`[data-testid="payment-card-value-${c1}"]`).clear().type(part1.toFixed(2));
        cy.get(`[data-testid="payment-card-value-${c2}"]`).clear().type(part2.toFixed(2));
      });
    });

    cy.get('[data-testid="payment-sum-match"]').should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
    cy.get('[data-testid="order-number"]', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.match(/PED-\d+/);
      });
  });

  it('Cenário: Fluxo Administrativo (Confirmar Pagamento -> Em Transporte -> Entregue)', () => {
    loginCustomer();
    clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="checkout-btn"]', { timeout: 10000 }).should('be.visible').click();
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    cy.get('[data-testid^="payment-card-digits-"]').each(($el) => {
      const text = $el.text().trim();
      if (Number(text.slice(-1)) % 2 === 1) {
        const id = $el.attr('data-testid').replace('payment-card-digits-', '');
        cy.wrap(id).as('cardId');
      }
    });

    cy.get('@cardId').then(id => {
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(parseCurrency(t).toFixed(2));
      });
    });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    
    cy.get('[data-testid="order-number"]', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const num = text.trim();
        expect(num).to.match(/PED-\d+/);
        cy.wrap(num).as('orderNum');
      });

    loginAdmin();
    cy.get('@orderNum').then(num => {
      cy.log(`Admin processando pedido: ${num}`);
      cy.visit('/admin/logistica');
      
      cy.get('[data-testid="filter-status"]').select('');
      cy.get('[data-testid="filter-submit"]').click();
      cy.get('[data-testid="logistics-count"]').should('be.visible');

      cy.contains('[data-testid^="order-row-"]', num, { timeout: 20000 }).within(() => {
        cy.get('[data-testid^="confirm-payment-btn-"]').click();
      });
      confirmActionModal();

      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="dispatch-btn-"]').click();
      });
      confirmActionModal();

      cy.get('[data-testid="filter-status"]').select('EM_TRANSITO');
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="deliver-btn-"]').click();
      });
      confirmActionModal();

      cy.get('[data-testid="filter-status"]').select('ENTREGUE');
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num).should('exist');
    });
  });

  it('Cenário: Solicitar Troca -> Autorizar -> Receber -> Gerar Cupom', () => {
    loginCustomer();
    clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="checkout-btn"]', { timeout: 10000 }).should('be.visible').click();
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
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(parseCurrency(t).toFixed(2));
      });
    });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    
    cy.get('[data-testid="order-number"]', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const num = text.trim();
        expect(num).to.match(/PED-\d+/);
        cy.wrap(num).as('exOrderNum');
      });

    loginAdmin();
    cy.get('@exOrderNum').then(num => {
      cy.log(`Admin entregando pedido para troca: ${num}`);
      cy.visit('/admin/logistica');
      
      cy.get('[data-testid="filter-status"]').select('');
      cy.get('[data-testid="filter-submit"]').click();

      cy.contains('[data-testid^="order-row-"]', num, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="confirm-payment-btn-"]').click();
      });
      confirmActionModal();
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num, { timeout: 10000 }).within(() => {
        cy.get('[data-testid^="dispatch-btn-"]').click();
      });
      confirmActionModal();
      cy.get('[data-testid="filter-status"]').select('EM_TRANSITO');
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num, { timeout: 10000 }).within(() => {
        cy.get('[data-testid^="deliver-btn-"]').click();
      });
      confirmActionModal();
    });

    loginCustomer();
    cy.get('@exOrderNum').then(num => {
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', num, { timeout: 15000 }).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').click();
      });
      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type('Troca Completa 7A');
      cy.get('[data-testid="exchange-submit-btn"]').click();
    });

    loginAdmin();
    cy.visit('/admin/trocas');
    cy.contains('[data-testid^="pending-exchange-row-"]', 'Troca Completa 7A', { timeout: 15000 }).within(() => {
      cy.get('[data-testid^="authorize-exchange-"]').click();
    });
    cy.contains('autorizada com sucesso', { timeout: 10000 }).should('be.visible');

    cy.get('@exOrderNum').then(num => {
      cy.get('[data-testid="tab-authorized"]').click();
      cy.contains('[data-testid^="authorized-exchange-row-"]', num, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="confirm-receipt-"]').click();
      });
      cy.contains('Troca finalizada', { timeout: 10000 }).should('be.visible');
    });

    loginCustomer();
    cy.visit('/account/orders');
    cy.window().then(win => {
      const token = win.localStorage.getItem('auth_token');
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiBaseUrl')}/clientes/cupons-troca`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const coupons = res.body.data;
        expect(coupons.length).to.be.greaterThan(0);
      });
    });
  });

  it('Cenário: Administrador NEGA troca/devolução', () => {
    loginCustomer();
    clearCart();
    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="cart-page"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="checkout-btn"]', { timeout: 10000 }).should('be.visible').click();
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    cy.get('[data-testid^="payment-card-digits-"]').each(($el) => {
      if (Number($el.text().trim().slice(-1)) % 2 === 1) {
        const id = $el.attr('data-testid').replace('payment-card-digits-', '');
        cy.wrap(id).as('cid2');
      }
    });
    cy.get('@cid2').then(id => {
      cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then(t => {
        cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(parseCurrency(t).toFixed(2));
      });
    });
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();
    
    cy.get('[data-testid="order-number"]', { timeout: 15000 })
      .should('be.visible')
      .invoke('text')
      .then((text) => {
        const num = text.trim();
        expect(num).to.match(/PED-\d+/);
        cy.wrap(num).as('negOrderNum');
      });

    loginAdmin();
    cy.get('@negOrderNum').then(num => {
      cy.log(`Admin entregando pedido para negação: ${num}`);
      cy.visit('/admin/logistica');
      
      cy.get('[data-testid="filter-status"]').select('');
      cy.get('[data-testid="filter-submit"]').click();

      cy.contains('[data-testid^="order-row-"]', num, { timeout: 15000 }).within(() => {
        cy.get('[data-testid^="confirm-payment-btn-"]').click();
      });
      confirmActionModal();
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num, { timeout: 10000 }).within(() => {
        cy.get('[data-testid^="dispatch-btn-"]').click();
      });
      confirmActionModal();
      cy.get('[data-testid="filter-status"]').select('EM_TRANSITO');
      cy.get('[data-testid="filter-submit"]').click();
      cy.contains('[data-testid^="order-row-"]', num, { timeout: 10000 }).within(() => {
        cy.get('[data-testid^="deliver-btn-"]').click();
      });
      confirmActionModal();
    });

    loginCustomer();
    cy.get('@negOrderNum').then(num => {
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', num, { timeout: 15000 }).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').click();
      });
      cy.get('[data-testid="exchange-modal"]').should('be.visible');
      cy.get('[data-testid^="exchange-chk-"]').first().check({ force: true });
      cy.get('[data-testid="exchange-justificativa"]').type('Troca para Negar 7A');
      cy.get('[data-testid="exchange-submit-btn"]').click();
    });

    loginAdmin();
    cy.visit('/admin/trocas');
    cy.contains('[data-testid^="pending-exchange-row-"]', 'Troca para Negar 7A', { timeout: 15000 }).within(() => {
      cy.get('[data-testid^="reject-exchange-"]').click();
    });

    loginCustomer();
    cy.get('@negOrderNum').then(num => {
      cy.visit('/account/orders');
      cy.contains('[data-testid="order-numero"]', num).closest('[data-testid^="order-card-"]').within(() => {
        cy.get('[data-testid="order-status-badge"]').should('contain.text', 'Entregue');
      });
    });
  });
});
