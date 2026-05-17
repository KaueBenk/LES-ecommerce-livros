/* global cy, describe, it, beforeEach, expect */

describe('Cenário 03: Cliente registra novo cartão e novo endereço no ato da compra', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
  });

  it('deve registrar novo endereço e novo cartão durante o checkout', () => {
    cy.intercept('GET', '**/clientes/enderecos').as('getAddresses');
    cy.intercept('GET', '**/clientes/cartoes').as('getCards');
    cy.intercept('POST', '**/clientes/enderecos').as('postAddress');
    cy.intercept('POST', '**/clientes/cartoes').as('postCard');

    cy.addToCart(1, 1);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();

    // Novo Endereço
    const uniqueAddr = `Novo Endereco ${Date.now()}`;
    cy.get('[data-testid="add-address-btn"]').click();
    cy.get('[data-testid="address-apelido-input"]').type(uniqueAddr);
    cy.get('[data-testid="address-tipo-select"]').select('ENTREGA');
    cy.get('[data-testid="address-residencia-select"]').select('CASA');
    cy.get('[data-testid="address-logradouro-tipo-select"]').select('RUA');
    cy.get('[data-testid="address-logradouro-input"]').type('Rua das Amostras');
    cy.get('[data-testid="address-numero-input"]').type('123');
    cy.get('[data-testid="address-bairro-input"]').type('Bairro de Teste');
    cy.get('[data-testid="address-cep-input"]').type('08210-040');
    cy.get('[data-testid="address-cidade-input"]').type('São Paulo');
    cy.get('[data-testid="address-estado-select"]').select('SP');
    cy.get('[data-testid="address-pais-input"]').type('Brasil');
    cy.get('[data-testid="address-form-save-button"]').click();
    
    cy.wait('@postAddress');
    cy.wait('@getAddresses');
    
    cy.contains('[data-testid^="address-card-"]', uniqueAddr, { timeout: 15000 }).click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="checkout-next-btn"]').click(); // pula cupons

    // Novo Cartão
    const cardNum = `40000000000${Math.floor(100 + Math.random() * 899)}1`; // Garantir final ímpar e 16 dígitos
    cy.get('[data-testid="add-card-btn"]').click();
    cy.get('[data-testid="credit-card-numero"]').type(cardNum);
    cy.get('[data-testid="credit-card-nome"]').type('JOAO TESTE NOVO');
    cy.get('[data-testid="credit-card-bandeira"]').select('VISA');
    cy.get('[data-testid="credit-card-cvv"]').type('123');
    cy.get('[data-testid="credit-card-form-submit"]').click();
    
    cy.wait('@postCard');
    cy.wait('@getCards');
    cy.get('[data-testid="credit-card-form-modal"]', { timeout: 15000 }).should('not.exist');

    cy.contains('[data-testid^="payment-card-digits-"]', cardNum.slice(-4), { timeout: 15000 }).then(($el) => {
      const cardId = $el.attr('data-testid').replace('payment-card-digits-', '');
      cy.get(`[data-testid="payment-card-checkbox-${cardId}"]`).check({ force: true });
      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
        const val = text.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
        cy.get(`[data-testid="payment-card-value-${cardId}"]`).clear().type(val);
      });
    });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
  });
});
