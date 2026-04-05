# 4a Entrega (06/04/2026) - Guia de Apresentacao Manual

Este guia cobre o fluxo solicitado para a entrega:
- realizar compra,
- definir forma de pagamento (multiplos cartoes + cupom de troca + cupom promocional),
- definir entrega e frete,
- consultar a venda gerada.

## 1. Requisitos cobertos no DRS

- RF0033: Realizar compra
- RF0034: Calcular frete
- RF0035: Selecionar endereco de entrega
- RF0036: Selecionar forma de pagamento (cartao + cupom)
- RF0037: Finalizar compra
- RF0025: Consulta de transacoes do cliente
- RN0033: Apenas 1 cupom promocional por compra
- RN0034: Multiplo cartao com minimo por cartao
- RN0035: Uso combinado de cupom e cartao
- RN0036: Uso otimizado de cupons de troca

## 2. Dados de exemplo prontos no projeto

Ao subir o backend com o `data.sql`, o ambiente fica com os dados abaixo:

### Usuarios e senhas
- Cliente: `joao@example.com`
- Senha do cliente: `Admin@123`
- Admin: `admin@admin.com`
- Senha do admin: `Admin@123`

### Cupons
- Cupom promocional valido: `PROMO123` (R$ 25,00)
- Cupom de troca para o cliente `joao@example.com`: R$ 15,00 (nao utilizado)

### Cartoes do cliente (para demonstracao)
- `1234567890123456` (final par, simula recusa pela regra D8)
- `1234567890123457` (final impar, simula aprovacao)
- `1234567890123459` (final impar, simula aprovacao)

### Itens e estoque
- Livros com estoque disponivel (ex.: livro id 1)
- Frete base parametrizado em `FRETE_BASE_VALOR=10.00`

## 3. Subindo o ambiente

Abra 2 terminais.

### Opcao A - Docker Compose (recomendado para ambiente completo)
```bash
docker-compose up --build
```

URLs:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

Observacao importante:
- O backend sobe com `spring.sql.init.mode=always` e seed idempotente (`data.sql`), entao os dados de demo desta entrega sempre sao regravados/garantidos na inicializacao do backend.

### Opcao B - Backend e Frontend separados (local)

Terminal 1 - Backend
```bash
cd backend/lesecommercelivros
./mvnw spring-boot:run
```

Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

Acesse: `http://localhost:5173`

## 4. Roteiro de apresentacao manual (passo a passo)

## 4.1 Login e carrinho
1. Entrar como cliente (`joao@example.com`).
2. Ir para o catalogo/produto e adicionar 1 livro ao carrinho.
3. Ir para Carrinho e clicar em **Finalizar compra**.

## 4.2 Checkout - Etapa 1 (Entrega e Frete)
1. Selecionar um endereco de entrega.
2. Mostrar em tela o valor de frete calculado.
3. Clicar em **Proximo**.

Evidencia esperada:
- bloco de frete com valor em R$.

## 4.3 Checkout - Etapa 2 (Cupons)
1. Em **Cupons de troca**, selecionar o cupom disponivel.
2. Em **Cupom promocional**, digitar `PROMO123` e clicar em **Aplicar**.
3. Mostrar o resumo de desconto (cupom troca + cupom promocional).
4. Clicar em **Proximo**.

Evidencia esperada:
- desconto de cupom de troca exibido,
- desconto de cupom promocional exibido,
- total apos descontos exibido.

## 4.4 Checkout - Etapa 3 (Multiplos cartoes)
1. Selecionar dois cartoes com final impar (`...3457` e `...3459`).
2. Dividir o valor restante entre os dois cartoes (qualquer divisao valida).
3. Mostrar a barra com status de soma correta.
4. Clicar em **Proximo**.

Evidencia esperada:
- dois cartoes selecionados,
- soma igual ao valor restante,
- indicador de valor correto (pronto para finalizar).

## 4.5 Checkout - Etapa 4 (Confirmacao)
1. Mostrar resumo final (subtotal, frete, descontos, total).
2. Clicar em **Confirmar Compra**.
3. Mostrar tela de confirmacao com numero do pedido.

Evidencia esperada:
- pedido criado com sucesso,
- numero do pedido visivel.

## 4.6 Consulta da venda
1. Ir para **Minha Conta > Meus Pedidos** (`/account/orders`).
2. Localizar o pedido criado na etapa anterior.
3. Expandir o card do pedido.
4. Mostrar:
   - numero do pedido,
   - status,
   - endereco de entrega,
   - pagamento,
   - valor total/frete.

Evidencia esperada:
- pedido aparece no historico,
- detalhes consistentes com a compra finalizada.

## 5. Teste automatizado desta entrega

Foi criado um teste E2E completo para esse fluxo:

```bash
cd frontend
npx cypress run --spec cypress/e2e/sales-checkout-consultation-4entrega.cy.js
```

O teste valida:
- frete e endereco,
- aplicacao de cupom troca + promocional,
- pagamento com 2 cartoes,
- finalizacao da compra,
- consulta da venda no historico do cliente.

Casos de borda cobertos no mesmo spec:
- bloqueio de avancar sem endereco/frete,
- erro de cupom promocional invalido,
- bloqueio de split invalido (valor minimo por cartao),
- rejeicao de compra com cartao de final par.

## 6. Observacoes para a banca

- Regra D8 de cartao continua valida (final par recusa, impar aprova).
- O roteiro acima usa somente dados de exemplo ja preparados no seed.
- Se quiser demonstrar erro de pagamento, repetir a compra usando cartao final par (`...3456`).

## 7. Arquivos de referencia da entrega

- Seed de dados: `backend/lesecommercelivros/src/main/resources/data.sql`
- Config de inicializacao: `backend/lesecommercelivros/src/main/resources/application.properties`
- Spec E2E completo: `frontend/cypress/e2e/sales-checkout-consultation-4entrega.cy.js`
