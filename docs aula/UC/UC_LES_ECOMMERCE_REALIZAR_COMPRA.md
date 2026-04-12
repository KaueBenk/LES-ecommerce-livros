# Especificação de Caso de Uso

## E-COMMERCE DE LIVROS - LES 2026

## Histórico de Versões

| Data | Versão | Descrição | Autor | Revisor |
| ----- | ----- | ----- | ----- | ----- |
| 12/04/2026 | 1.0 | Versão inicial do UC com base na implementação real (frontend, backend e capturas Cypress) | GitHub Copilot | Pendente |

| Cliente | FATEC - Interno |
| ----: | :---- |
| Documento | Especificação de Caso de Uso: Realizar Compra de Livros |
| Data | 12 de abril de 2026 |
| Autor(es) | Equipe LES + GitHub Copilot |

## Página de Assinaturas

| Revisado e Aprovado por: |  | Data |
| :---- | :---- | :---: |
|  |  | dd.mm.aa |
|  |  | dd.mm.aa |

---

## 1. Nome do Caso de Uso

CDU01 - Realizar Compra de Livros (Checkout Completo)

## 2. Objetivo

Permitir que um cliente autenticado converta itens reservados no carrinho em um pedido válido, por meio das etapas de seleção de endereço de entrega, aplicação opcional de cupons, escolha da forma de pagamento e confirmação final da compra, com posterior consulta no histórico de pedidos.

## 3. Descrição

O fluxo inicia no catálogo/produto e segue para o carrinho, onde os itens permanecem reservados por tempo parametrizável. Em seguida, o cliente acessa um checkout em quatro etapas (Endereço, Cupons, Pagamento e Confirmação), com validações progressivas para habilitar o avanço de etapa.

No backend, o processo valida expiração de reserva, disponibilidade de estoque no momento da finalização, regras de cupons e consistência dos pagamentos. A compra é criada inicialmente em EM_PROCESSAMENTO e, após validação da forma de pagamento, evolui para APROVADA (ou REPROVADA em caso de recusa).

Após o sucesso, o sistema limpa o carrinho, atualiza estoque, atualiza ranking do cliente, registra logs de transação e exibe a confirmação do pedido. O pedido também fica disponível para consulta em Meus Pedidos.

No fluxo de recusa de pagamento, o pedido é marcado como REPROVADA, os itens reservados são desbloqueados e o carrinho é limpo no backend.

## 4. Requisitos Funcionais

- RF0031 - Gerenciar carrinho de compra
- RF0032 - Definir quantidade de itens no carrinho
- RF0033 - Realizar compra
- RF0034 - Calcular frete
- RF0035 - Selecionar endereço de entrega
- RF0036 - Selecionar forma de pagamento
- RF0037 - Finalizar compra
- RF0025 - Consulta de transações

Requisitos relacionados (ponto de extensão):

- RF0040 - Solicitar troca

## 5. Tipo de Caso de Uso

| X | Concreto (iniciado diretamente por um ator) |
| :---- | :---- |
|  | Abstrato |

## 6. Atores

| Nome Ator | Primário | Secundário |
| :---- | :---: | :---: |
| Cliente autenticado | X |  |
| Processador de pagamento (simulado) |  | X |
| Módulo de estoque |  | X |
| Módulo de cupons |  | X |

## 7. Pré-condições

1. Cliente autenticado no sistema.
2. Carrinho existente com ao menos um item.
3. Itens do carrinho com reserva ainda válida (TTL não expirado).
4. Estoque disponível para os itens selecionados.
5. Endereço de entrega válido disponível para seleção.
6. Para pagamento por cartão, cliente deve possuir cartão cadastrado.

### 7.1 Permissão de Usuário

Somente usuários autenticados podem acessar checkout, confirmação e histórico de pedidos.

## 8. Fluxo Principal

### P1. Selecionar produto e reservar no carrinho

P1.1. O cliente navega no catálogo ou na página do produto.

P1.2. O cliente adiciona item ao carrinho com quantidade desejada.

P1.3. O sistema bloqueia estoque e registra instante de bloqueio por item.

### P2. Revisar carrinho

P2.1. O sistema exibe itens, subtotais e total.

P2.2. O sistema exibe temporizador por item e banners de atenção quando próximo da expiração.

P2.3. O cliente aciona Finalizar Compra.

### P3. Etapa 1 do checkout - Endereço e frete

P3.1. O sistema exibe endereços do cliente.

P3.2. O cliente seleciona um endereço de entrega.

P3.3. O sistema calcula frete e exibe valor calculado.

P3.4. O cliente avança para a próxima etapa.

### P4. Etapa 2 do checkout - Cupons

P4.1. O sistema exibe cupons de troca disponíveis e campo para cupom promocional.

P4.2. O cliente pode selecionar cupons de troca e/ou aplicar cupom promocional.

P4.3. O sistema valida cupons e recalcula valor restante.

P4.4. O cliente avança para a próxima etapa.

### P5. Etapa 3 do checkout - Pagamento

P5.1. O sistema exibe cartões disponíveis e valor remanescente.

P5.2. O cliente seleciona um ou mais cartões e distribui os valores.

P5.3. O sistema valida soma dos pagamentos e regras de mínimo por cartão.

P5.4. O cliente avança para a etapa de confirmação.

### P6. Etapa 4 do checkout - Confirmação

P6.1. O sistema apresenta resumo final: itens, frete, descontos, endereço e pagamento.

P6.2. O cliente confirma a compra.

P6.3. O sistema cria pedido em EM_PROCESSAMENTO, valida pagamento e conclui com status APROVADA quando aceito.

P6.4. O sistema atualiza estoque, consome cupons aplicados, gera cupom de excedente quando aplicável e limpa carrinho.

P6.5. O sistema exibe tela de confirmação com número do pedido.

### P7. Consulta pós-compra

P7.1. O cliente acessa Meus Pedidos.

P7.2. O sistema lista o pedido recém-criado com status e detalhes.

## 9. Fluxos Alternativos

### A1. Compra sem cupom

Origem: P4.

A1.1. O cliente não aplica cupons e avança.

A1.2. O valor total segue sem desconto para a etapa de pagamento.

### A2. Cupom promocional inválido/expirado

Origem: P4.

A2.1. O cliente informa cupom inválido.

A2.2. O sistema exibe erro de validação de cupom e mantém o cliente na etapa de cupons.

A2.3. O fluxo retorna para P4.

### A3. Pagamento com múltiplos cartões

Origem: P5.

A3.1. O cliente divide o valor entre dois ou mais cartões.

A3.2. O sistema habilita avanço somente quando soma == valor remanescente.

A3.3. O fluxo segue para P6.

### A4. Pagamento recusado pela operadora simulada

Origem: P6.

A4.1. O cliente confirma compra usando cartão com final par.

A4.2. O sistema recusa pagamento, marca pedido como REPROVADA e retorna erro na tela de checkout (HTTP 402).

A4.3. O backend desbloqueia os itens reservados e limpa o carrinho da sessão.

A4.4. Para nova tentativa, o cliente deve adicionar os itens novamente ao carrinho e reiniciar o checkout.

### A5. Excedente de cupons

Origem: P6.

A5.1. Quando soma de cupons supera o total da compra, o sistema gera cupom de troca com valor excedente.

A5.2. O fluxo segue para P6.5.

## 10. Fluxos de Exceção

### E1. Carrinho vazio

Origem: P2/P3.

E1.1. Caso não haja itens, o checkout não prossegue.

E1.2. O sistema orienta retorno ao carrinho/catálogo.

### E2. Reserva expirada no carrinho ou checkout

Origem: P2 ou P6.

E2.1. Se o TTL da reserva expirar, o sistema remove itens e desbloqueia estoque.

E2.2. A validação de expiração no backend considera o último instante de bloqueio entre os itens do carrinho (regra do último item).

E2.3. O sistema exibe mensagem para readicionar itens e bloqueia finalização.

### E3. Estoque insuficiente na finalização

Origem: P6.

E3.1. Se a disponibilidade tiver mudado entre adição e fechamento, o sistema impede finalização e informa indisponibilidade.

### E4. Pagamento inconsistente

Origem: P5/P6.

E4.1. Se soma dos pagamentos for diferente do valor remanescente, o sistema bloqueia avanço e solicita ajuste.

## 11. Protótipos de Tela (capturas reais da UI)

### 11.1 Catálogo

![Figura 1 - Catálogo](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/01-catalogo.png)

### 11.2 Produto

![Figura 2 - Produto](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/02-produto.png)

### 11.3 Carrinho

![Figura 3 - Carrinho](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/03-carrinho.png)

### 11.4 Checkout - Endereço

![Figura 4 - Checkout Endereço](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/04-checkout-endereco.png)

### 11.5 Checkout - Cupons

![Figura 5 - Checkout Cupons](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/05-checkout-cupons.png)

### 11.6 Checkout - Cupons Aplicados

![Figura 6 - Checkout Cupons Aplicados](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/06-checkout-cupons-aplicados.png)

### 11.7 Checkout - Pagamento

![Figura 7 - Checkout Pagamento](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/07-checkout-pagamento.png)

### 11.8 Checkout - Confirmação

![Figura 8 - Checkout Confirmação](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/08-checkout-confirmacao.png)

### 11.9 Confirmação de Pedido

![Figura 9 - Confirmação de Pedido](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/09-confirmacao-pedido.png)

### 11.10 Histórico de Pedidos

![Figura 10 - Histórico de Pedidos](../../frontend/cypress/screenshots/uc-doc-screenshots.cy.js/uc-doc/10-historico-pedidos.png)

## 12. Pós-condições

1. Pedido persistido com identificador e número de pedido.
2. Status inicial registrado como EM_PROCESSAMENTO, com evolução para APROVADA em caso de pagamento aprovado.
3. Estoque atualizado conforme itens comprados.
4. Carrinho esvaziado após conclusão bem-sucedida.
5. Cupons de troca usados marcados como utilizados.
6. Cupom de troca gerado quando há excedente de cupons.
7. Notificação de pedido aprovado emitida ao cliente.

### 12.1 Pedido disponível para consulta

O pedido finalizado deve estar visível na tela Meus Pedidos com número, status, totais e detalhes.

## 13. Requisitos Não Funcionais

- RNF0011 - Tempo de resposta para consultas (aplicável ao fluxo de consulta de carrinho, checkout e pedidos).
- RNF0012 - Log de transação para operações de escrita (pedido, status, cliente, cupom, troca).
- RNF0042 - Apresentar itens retirados do carrinho por expiração de reserva.

## 14. Ponto de Extensão

- PE1 - Solicitar troca de itens no histórico de pedidos (RF0040), com regra de elegibilidade apenas para pedidos ENTREGUE (RN0043).
- PE2 - Administração de logística e trocas (despacho, entrega, autorização e confirmação de recebimento).

## 15. Critérios de Aceite

1. Cliente autenticado consegue concluir checkout completo e visualizar confirmação do pedido.
2. Próximo no checkout permanece desabilitado sem endereço de entrega válido.
3. Cupons inválidos retornam erro sem quebrar o fluxo.
4. Soma de pagamentos deve fechar exatamente o valor remanescente.
5. Cartão de final par deve resultar em recusa de pagamento.
6. Em recusa de pagamento, o pedido deve ser marcado como REPROVADA e o carrinho deve ser limpo no backend.
7. Pedido concluído deve aparecer em Meus Pedidos.
8. Capturas de tela devem corresponder às etapas reais do fluxo implementado.

## 16. Observações

1. O comportamento de aprovação/reprovação por dígito final do cartão é uma regra de simulação da operadora para testes automatizados.
2. O frete no backend é calculado com base em parâmetros de sistema e estado de destino.
3. A reserva de carrinho é parametrizável (default 30 min) e possui aviso de 5 minutos no frontend.
4. A expiração de reserva no backend segue a regra do último item bloqueado no carrinho (TTL relativo ao último bloqueio).
5. O fluxo implementado aplica validação de estoque tanto na inclusão em carrinho quanto na finalização.
6. A seleção de cupons de troca aplica regra para evitar uso desnecessário de cupons além do necessário para cobrir o valor restante da compra.
7. O pagamento em cartão aplica mínimo de R$ 10,00 por cartão quando o valor restante a pagar é maior ou igual a R$ 10,00.
8. Quando cupons reduzem o valor restante para abaixo de R$ 10,00, o pagamento em cartão pode ocorrer com valor inferior a R$ 10,00.

### 16.1 Prioridade de desenvolvimento

Alta (fluxo central de vendas eletrônicas).

## 17. Referências

- DRS oficial: docs aula/DRS_LES_1_2026.md
- Template FATEC base: docs aula/UC/UC_FATEC.doc.md
- Rotas frontend: frontend/src/App.jsx
- Checkout frontend: frontend/src/pages/CheckoutPage.jsx
- Carrinho frontend: frontend/src/pages/CartPage.jsx
- Histórico frontend: frontend/src/pages/OrderHistoryPage.jsx
- Serviço de checkout frontend: frontend/src/services/checkoutService.js
- Serviço de carrinho frontend: frontend/src/services/cartService.js
- Checkout backend: backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/service/CheckoutService.java
- Carrinho backend: backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/service/CarrinhoService.java
- Pedido/troca backend: backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/service/PedidoService.java
- Workflow admin backend: backend/lesecommercelivros/src/main/java/com/kauebenk/lesecommercelivros/service/AdminWorkflowService.java
- Evidência de captura: frontend/cypress/e2e/uc-doc-screenshots.cy.js
