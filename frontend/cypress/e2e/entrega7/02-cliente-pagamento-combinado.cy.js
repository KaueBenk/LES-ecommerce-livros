describe('Cenário 02: Cliente paga com todas as combinações', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
    cy.intercept('POST', '**/checkout/validar-cupons').as('validateCoupons');
    cy.intercept('GET', '**/clientes/cartoes').as('getCards');
    cy.intercept('POST', '**/checkout/finalizar').as('finalizeOrder');

    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
  });

  it('deve pagar usando 2 cartões e cupons', () => {
    // Adiciona valor massivo (10 itens de 2 livros) para garantir que cupons não cubram tudo
    cy.addToCart(1, 10);
    cy.addToCart(2, 10);
    cy.visit('/cart');
    cy.get('[data-testid="checkout-btn"]').click();

    // Step 1: Endereço
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 2: Cupons
    // Espera o subtotal carregar na sidebar para evitar race condition de valor zero
    cy.get('[data-testid="summary-subtotal"]', { timeout: 15000 }).should('not.contain', 'R$ 0,00');

    cy.get('body', { timeout: 10000 }).then(($body) => {
      if ($body.find('[data-testid^="trade-coupon-checkbox-"]').length > 0) {
        cy.get('[data-testid^="trade-coupon-checkbox-"]').first().check({ force: true });
        cy.wait('@validateCoupons');
        cy.get('[data-testid^="trade-coupon-selected-"]', { timeout: 10000 }).should('be.visible');
      }
    });
    
    cy.get('[data-testid="promo-coupon-input"]').type('PROMO123');
    cy.get('[data-testid="promo-coupon-apply-btn"]').click();
    cy.wait('@validateCoupons');
    
    // Aguarda a aplicação do cupom via UI
    cy.get('[data-testid="promo-coupon-discount-value"]', { timeout: 15000 }).should('be.visible');
    
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3: Pagamento com 2 cartões
    cy.get('[data-testid="step-payment-cards"]', { timeout: 15000 }).should('be.visible');
    cy.wait('@getCards');
    
    // Assegura que ainda resta valor a pagar (não deve mostrar a mensagem de "pago com cupons")
    cy.get('[data-testid="no-payment-needed"]').should('not.exist');

    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 20000 })
      .should('have.length.at.least', 2)
      .then(($els) => {
        const oddCards = [...$els]
          .filter(el => Number(el.textContent.trim().slice(-1)) % 2 === 1)
          .map(el => el.getAttribute('data-testid').replace('payment-card-digits-', ''));

        expect(oddCards.length).to.be.at.least(2, 'Necessário pelo menos 2 cartões ímpares para este teste');
        
        const c1 = oddCards[0];
        const c2 = oddCards[1];

        cy.get(`[data-testid="payment-card-checkbox-${c1}"]`).check({ force: true });
        cy.get(`[data-testid="payment-card-checkbox-${c2}"]`).check({ force: true });

        cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((text) => {
          const total = Number(text.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.'));
          expect(total).to.be.greaterThan(20, 'O valor restante deve ser > 20 para dividir em 2 de R$ 10');
          
          const part1 = 10.00;
          const part2 = total - part1;

          cy.get(`[data-testid="payment-card-value-${c1}"]`).clear().type(part1.toFixed(2));
          cy.get(`[data-testid="payment-card-value-${c2}"]`).clear().type(part2.toFixed(2));
        });
      });

    cy.get('[data-testid="payment-sum-match"]', { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Step 4: Confirmação
    cy.get('[data-testid="confirm-purchase-btn"]').should('be.visible').click();

    cy.wait('@finalizeOrder', { timeout: 30000 });
    cy.url({ timeout: 20000 }).should('include', '/order-confirmation');
  });
});
