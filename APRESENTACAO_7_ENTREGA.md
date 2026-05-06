# 7a Entrega — Roteiro de Apresentacao (venda completa)

## 1) Script de apresentacao (recomendado)

- Inicia backend (Docker), frontend (Vite) e executa os testes em modo headed, um por vez,
  aguardando Enter entre eles.

```bash
./scripts/apresentacao-7a-entrega.sh
```

Se necessario, torne o script executavel:

```bash
chmod +x scripts/apresentacao-7a-entrega.sh
```

Variaveis opcionais:

- `DEV_PORT=5174`
- `BASE_URL=http://localhost:5174`
- `API_URL=http://localhost:8080`
- `CYPRESS_API_BASE_URL=http://localhost:8080/api/v1`
- `BROWSER=chrome` (padrao: `electron`)

## 2) Preparacao manual (caso nao use o script)

### Backend (Docker)

```bash
docker-compose up -d backend
```

### Frontend (React + Vite)

```bash
cd frontend
npm run dev -- --port 5174
```

### Cypress (UI real + backend real, modo headed)

```bash
cd frontend
CYPRESS_BASE_URL=http://localhost:5174 \
CYPRESS_API_BASE_URL=http://localhost:8080/api/v1 \
npx cypress run --headed --browser electron --spec cypress/e2e/checkout-new-card-address.cy.js
```

## 3) Credenciais e dados base

- Cliente (seed):
  - Email: `joao@example.com`
  - Senha: `Admin@123`

- Admin (seed):
  - Email: `admin@admin.com`
  - Senha: `Admin@123`

- Cupom promocional (seed): `PROMO123`

## 4) Roteiro por teste (cobertura 7a entrega + DRS)

### A) Compra completa com novo endereco e novo cartao

- Teste: `cypress/e2e/checkout-new-card-address.cy.js`
- Itens da entrega:
  - Cliente realiza compra
  - Cliente cadastra novo endereco e novo cartao no checkout
- DRS: RF0031, RF0033, RF0034, RF0035, RF0036, RF0037

### B) Combinacoes de pagamento (cupons + multiplos cartoes)

- Teste: `cypress/e2e/sales-checkout-consultation-4entrega.cy.js`
- Itens da entrega:
  - Cliente paga com cupons + multiplos cartoes
- DRS: RF0036, RN0033, RN0034, RN0035, RN0036, RF0025

### C) Validacao de aprovacao e rejeicao do pagamento

- Teste: `cypress/e2e/checkout.cy.js`
- Itens da entrega:
  - Cliente realiza compra com cartao aprovado
  - Cliente recebe rejeicao com cartao de final par (regra D8)
- DRS: RN0037, RN0038

### D) Troca parcial e total + fluxo admin completo

- Teste: `cypress/e2e/exchanges-reviews.cy.js`
- Itens da entrega:
  - Cliente solicita troca parcial e total
  - Admin confirma pagamento
  - Admin aceita ou rejeita troca
  - Admin define EM_TRANSITO e confirma ENTREGUE
  - Admin confirma recebimento da troca
  - Sistema gera cupom de troca
- DRS: RF0040, RF0041, RF0042, RF0043, RF0044, RN0041, RN0042, RN0043, RN0044, RNF0046
- Observacao: status de transporte no sistema aparece como EM_TRANSITO.

### E) Timer de carrinho (DRS complementar)

- Teste: `cypress/e2e/cart-timer.cy.js`
- DRS: RN0044, RNF0042
