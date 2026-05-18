
describe('Cenário 04: Usuário solicita troca ou devolução', () => {
  const CUSTOMER_EMAIL = 'joao@example.com';
  const CUSTOMER_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL = 'admin@admin.com';
  const ADMIN_PASSWORD = 'Admin@123';

  beforeEach(() => {
    cy.desktop();
  });

  // ═════════════════════════════════════════════════════════════════
  // Helper: Adicionar múltiplos livros DISTINTOS com validação robusta
  // ═════════════════════════════════════════════════════════════════
  // PROBLEMA CORRIGIDO:
  //   - Antes: cy.addToCart(1, 1); cy.addToCart(2, 1) resultava em
  //     1 item com quantidade 2 ao invés de 2 items com quantidade 1
  //   - Motivo: Falta de sincronização entre as adições
  // 
  // SOLUÇÃO:
  //   - Volta ao catálogo (/home) entre cada adição
  //   - Aguarda notificação e delay de 1.5s
  //   - Garante que o carrinho sincroniza antes do próximo item
  // ═════════════════════════════════════════════════════════════════
  const addMultipleBooksToCart = (bookIds) => {
    cy.log(`📚 Iniciando adição de ${bookIds.length} livros DISTINTOS`);
    
    bookIds.forEach((bookId, index) => {
      cy.log(`\n➕ PASSO ${index + 1}/${bookIds.length}: Adicionando livro ID=${bookId}, Qty=1`);
      
      // ✓ Navega para o catálogo primeiro
      cy.visit('/');
      cy.get('[data-testid^="add-to-cart-btn-"]', { timeout: 10000 }).should('have.length.greaterThan', 0);
      
      // ✓ Clica no botão específico do livro
      cy.get(`[data-testid="add-to-cart-btn-${bookId}"]`, { timeout: 10000 })
        .should('be.visible')
        .click();
      
      // ✓ Aguarda a notificação
      cy.contains('adicionado ao carrinho', { timeout: 10000 }).should('be.visible');
      
      // ✓ Aguarda 1.5s antes de prosseguir para evitar race conditions
      cy.wait(1500);
    });
    
    cy.log(`\n✅ ${bookIds.length} livros DISTINTOS adicionados com sucesso`);
  };

  const checkoutOrder = (bookIds) => {
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.clearCart();
    
    // Adiciona múltiplos livros DISTINTOS com validação robusta
    addMultipleBooksToCart(bookIds);
    
    cy.visit('/cart');
    cy.log(`📦 Acessando página do carrinho`);
    
    // ═══ VALIDAÇÃO CRÍTICA 1: Verificar quantidade exata de itens ═══
    cy.get('[data-testid^="cart-item-"]', { timeout: 10000 }).then(($items) => {
      const actualCount = $items.length;
      cy.log(`\n🔍 VALIDAÇÃO 1: Itens no carrinho = ${actualCount}, Esperado = ${bookIds.length}`);
      expect(actualCount, `Carrinho deve ter exatamente ${bookIds.length} items DISTINTOS`).to.equal(bookIds.length);
    });
    
    // ═══ VALIDAÇÃO CRÍTICA 2: Cada item tem Quantidade: 1 ═══
    cy.get('[data-testid^="cart-item-"]').each(($item, index) => {
      cy.wrap($item).then(($el) => {
        const text = $el.text();
        cy.log(`  Item ${index + 1}: contém "Quantidade: 1"? ${text.includes('Quantidade: 1')}`);
        expect(text).to.include('Quantidade: 1', `Item ${index + 1} deve ter Quantidade: 1`);
      });
    });
    
    cy.log(`✅ Todos os ${bookIds.length} itens estão corretos (1 unidade cada)\n`);

    cy.get('[data-testid="checkout-btn"]').click();
    
    // Step 1: Address
    cy.get('[data-testid^="address-card-"]', { timeout: 15000 }).first().click();
    cy.get('[data-testid="checkout-next-btn"]').click();
    
    // Step 2: Coupons
    cy.get('[data-testid="checkout-next-btn"]').click();

    // Step 3: Payment
    cy.get('[data-testid^="payment-card-digits-"]', { timeout: 15000 })
      .should('have.length.at.least', 1)
      .then(($els) => {
        const oddEl = [...$els].find(
          (el) => Number(el.textContent.trim().slice(-1)) % 2 === 1,
        );

        expect(oddEl, 'Necessário 1 cartão ímpar para aprovação').to.exist;
        const id = oddEl.getAttribute('data-testid').replace('payment-card-digits-', '');
        
        cy.get(`[data-testid="payment-card-checkbox-${id}"]`).check({ force: true });
        cy.get('[data-testid="payment-remaining-balance"]').invoke('text').then((t) => {
          const val = t.replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
          cy.get(`[data-testid="payment-card-value-${id}"]`).clear().type(val);
        });
      });

    cy.get('[data-testid="checkout-next-btn"]').click();
    cy.get('[data-testid="confirm-purchase-btn"]').should('be.visible').click();

    return cy.get('[data-testid="order-number"]', { timeout: 20000 })
      .invoke('text')
      .then((num) => {
        cy.log(`✓ Pedido criado com sucesso: ${num}`);
        return num.trim();
      });
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

  const requestExchangeAsCustomer = (orderNum, itemIndicesToExchange, totalItemsInOrder) => {
    cy.login(CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    cy.visit('/account/orders');
    cy.contains('[data-testid="order-numero"]', orderNum)
      .closest('[data-testid^="order-card-"]')
      .within(() => {
        cy.get('[data-testid^="order-toggle-"]').click();
        cy.get('[data-testid^="exchange-btn-"]').click();
      });

    cy.get('[data-testid="exchange-modal"]').should('be.visible');
    
    // VALIDAÇÃO: Verificar quantidade total de itens no modal
    cy.get('[data-testid^="exchange-chk-"]').should('have.length', totalItemsInOrder);
    cy.log(`✓ Modal contém ${totalItemsInOrder} itens para seleção`);
    
    // VALIDAÇÃO: Nenhum item deve estar pré-selecionado
    cy.get('[data-testid^="exchange-chk-"]:checked').should('have.length', 0);
    
    // Marca APENAS os checkboxes dos itens a trocar
    cy.get('[data-testid^="exchange-chk-"]').each(($chk, index) => {
      if (itemIndicesToExchange.includes(index)) {
        cy.wrap($chk).check({ force: true });
      }
    });

    // VALIDAÇÃO: Verificar que exatamente N itens foram selecionados
    cy.get('[data-testid^="exchange-chk-"]:checked')
      .should('have.length', itemIndicesToExchange.length)
      .then(() => {
        cy.log(`✓ Exatamente ${itemIndicesToExchange.length} item(ns) selecionado(s) para troca`);
      });

    // Define a quantidade de troca (1 unidade por item selecionado)
    cy.get('[data-testid^="exchange-qty-"]').each(($qty, index) => {
      if (itemIndicesToExchange.includes(index)) {
        cy.wrap($qty).clear().type('1');
      } else {
        // VALIDAÇÃO: Itens não selecionados devem estar vazios
        cy.wrap($qty).should('have.value', '');
      }
    });

    cy.get('[data-testid="exchange-justificativa"]').type(
      `Teste: Troca de ${itemIndicesToExchange.length} item(ns) - índices: ${itemIndicesToExchange.join(', ')}`,
    );
    cy.get('[data-testid="exchange-submit-btn"]').click();

    cy.wait('@requestExchange');
    cy.contains('Solicitação de troca enviada', { timeout: 10000 }).should('be.visible');
    cy.log(`✓ Solicitação de troca de ${itemIndicesToExchange.length} item(ns) enviada com sucesso`);
  };

  it('deve solicitar troca de um item do pedido (quantidade parcial)', () => {
    // Intercepta ações de logística para garantir sincronização
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');

    // ═════════════════════════════════════════════════════════════════
    // CENÁRIO: Compra 2 ITENS DISTINTOS e troca apenas 1
    // ═════════════════════════════════════════════════════════════════
    // 1. Adiciona: Livro ID=1, Qty=1 ✓
    // 2. Adiciona: Livro ID=2, Qty=1 ✓
    // 3. Resultado final: 2 items DIFERENTES no carrinho ✓
    // 4. Faz checkout → Cria pedido
    // 5. Admin entrega o pedido
    // 6. Cliente troca apenas o 1º item (índice 0)
    // ═════════════════════════════════════════════════════════════════
    checkoutOrder([1, 2]).then((orderNum) => {
      cy.log(`\n📦 PASSO 1 COMPLETO: Pedido ${orderNum} com 2 items DISTINTOS criado\n`);
      
      deliverOrderAsAdmin(orderNum);
      cy.log(`\n📦 PASSO 2 COMPLETO: Pedido entregue com sucesso\n`);
      
      requestExchangeAsCustomer(orderNum, [0], 2); // Troca apenas item índice 0 de 2 items
      cy.log(`\n✅ TESTE PASSOU: Troca parcial completada (1 de 2 items)\n`);
    });
  });

  it('deve solicitar troca do pedido completo (quantidade total)', () => {
    // Intercepta ações de logística para garantir sincronização
    cy.intercept('PATCH', '**/admin/pedidos/*/confirmar-pagamento').as('confirmPayment');
    cy.intercept('PATCH', '**/admin/pedidos/*/despachar').as('dispatchOrder');
    cy.intercept('PATCH', '**/admin/pedidos/*/entregar').as('deliverOrder');
    cy.intercept('POST', '**/pedidos/*/trocas').as('requestExchange');

    // ═════════════════════════════════════════════════════════════════
    // CENÁRIO: Compra 2 ITENS DISTINTOS e troca TODOS eles
    // ═════════════════════════════════════════════════════════════════
    // 1. Adiciona: Livro ID=1, Qty=1 ✓
    // 2. Adiciona: Livro ID=2, Qty=1 ✓
    // 3. Resultado final: 2 items DIFERENTES no carrinho ✓
    // 4. Faz checkout → Cria pedido
    // 5. Admin entrega o pedido
    // 6. Cliente troca ambos os items (índices 0 e 1)
    // ═════════════════════════════════════════════════════════════════
    checkoutOrder([1, 2]).then((orderNum) => {
      cy.log(`\n📦 PASSO 1 COMPLETO: Pedido ${orderNum} com 2 items DISTINTOS criado\n`);
      
      deliverOrderAsAdmin(orderNum);
      cy.log(`\n📦 PASSO 2 COMPLETO: Pedido entregue com sucesso\n`);
      
      requestExchangeAsCustomer(orderNum, [0, 1], 2); // Troca todos: itens índice 0 e 1 de 2 items
      cy.log(`\n✅ TESTE PASSOU: Troca total completada (2 de 2 items)\n`);
    });
  });
});
