/* global cy, describe, it, beforeEach, expect */

describe('Cenário 02: Cliente paga com todas as combinações', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
  });

  it('deve pagar usando 2 cartões e cupons', () => {
    // Intercepta a chamada de cupons para garantir que a UI carregou
    cy.intercept('GET', '**/clientes/cupons-troca*').as('getCupons');

    // Adiciona valor suficiente para 2 cartões (mínimo 10 cada)
    cy.addToCart(1, 3);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();

    // Endereço
    cy.get('[data-testid^="address-card-"]').first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Cupons
    cy.wait('@getCupons');
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="trade-coupon-checkbox-"]').length > 0) {
        cy.get('[data-testid^="trade-coupon-checkbox-"]').first().check({ force: true });
      }
    });
    
    cy.get('[data-testid="promo-coupon-input"]').type('PROMO123');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();
    
    // Aguarda a aplicação do cupom promocional para evitar race condition
    cy.get('[data-testid="promo-coupon-discount-value"]', { timeout: 15000 }).should('be.visible');
    
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Pagamento com 2 cartões
    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 }).should('have.length.at.least', 2).then(($els) => {
      const oddCards = [...$els].filter(el => Number(el.textContent.trim().slice(-1)) % 2 === 1)
                                .map(el => el.getAttribute('data-testid').replace('payment-card-digits-', ''));

      expect(oddCards.length).to.be.at.least(2, 'Necessário 2 cartões ímpares para este teste');
      
      const c1 = oddCards[0];
      const c2 = oddCards[1];

      cy.get(`[data-testid="payment-card-checkbox-${c1}"]`).check({ force: true });
      cy.get(`[data-testid="payment-card-checkbox-${c2}"]`).check({ force: true });

      cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
        const total = Number(text.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.'));
        const part1 = 10.00;
        const part2 = total - part1;

        cy.get(`[data-testid="payment-card-value-${c1}"]`).clear().type(part1.toFixed(2));
        cy.get(`[data-testid="payment-card-value-${c2}"]`).clear().type(part2.toFixed(2));
      });
    });

    cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').click();

    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
  });
});
