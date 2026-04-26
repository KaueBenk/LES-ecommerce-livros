# 6a Entrega (26/04/2026) - Guia de Apresentacao

Este guia prepara a apresentacao da 6a entrega com foco em teste automatizado do cenario:
- registro de pedido de venda com sucesso,
- validacao da entrega prevista em 06/10/2025,
- evidencia no historico de pedidos.

## 1. Cenario da entrega

- Cenario: registro de pedido de venda realizado com sucesso.
- Data de entrega prevista validada no teste: `06/10/2025`.
- Tipo de teste: E2E com Cypress, usando backend real e frontend real.

## 2. Requisitos cobertos

- RF0033: Realizar compra.
- RF0034: Calcular frete.
- RF0035: Selecionar endereco de entrega.
- RF0036: Selecionar forma de pagamento.
- RF0037: Finalizar compra.
- RF0025: Consultar transacoes (historico de pedidos).

## 3. Arquivos principais da entrega

- Spec dedicado: `frontend/cypress/e2e/pedido-venda-sucesso.cy.js`
- Script npm para execucao rapida: `frontend/package.json` (`test:e2e:pedido-sucesso`)

## 4. Pre-requisitos para rodar

Subir backend e frontend antes do teste.

Opcao A - Docker Compose:

```bash
docker-compose up --build
```

Opcao B - separado:

Terminal 1 (backend):

```bash
cd backend/lesecommercelivros
./mvnw spring-boot:run
```

Terminal 2 (frontend):

```bash
cd frontend
npm install
npm run dev
```

## 5. Execucao do teste da 6a entrega

No frontend:

```bash
cd frontend
npm run test:e2e:pedido-sucesso
```

Para deixar o video mais didatico na apresentacao, rode com delay entre etapas:

```bash
cd frontend
CYPRESS_STEP_DELAY_MS=1800 npm run test:e2e:pedido-sucesso
```

Observacao:
- `CYPRESS_STEP_DELAY_MS` controla o tempo (em ms) entre as acoes-chave do fluxo.
- Ex.: `1200` (1,2s), `1800` (1,8s), `2500` (2,5s).

## 6. Evidencias esperadas na apresentacao

- O teste finaliza com status de sucesso (1 passing).
- A tela de confirmacao exibe numero do pedido.
- A data de entrega prevista exibida e `06/10/2025`.
- O pedido aparece na pagina de historico (`/account/orders`).
- O teste faz logout do cliente, login como admin e mostra o mesmo pedido no painel logístico (`/admin/logistica`).

## 7. Plano de apresentacao em sala (curto)

1. Mostrar o comando de execucao do teste.
2. Rodar o teste ao vivo.
3. Abrir o video gerado pelo Cypress para reforcar as evidencias.
4. Destacar os pontos validados: sucesso da compra, entrega prevista, historico.
5. Mostrar no final o pedido no painel admin para comprovar registro no fluxo operacional.

## 8. Video do teste

Ao finalizar a execucao em modo `cypress run`, o Cypress salva video em:

- `frontend/cypress/videos/pedido-venda-sucesso.cy.js.mp4`
