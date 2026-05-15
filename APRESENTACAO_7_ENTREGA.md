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
npx cypress run --headed --browser electron --spec cypress/e2e/entrega7/01-cliente-realiza-compra.cy.js
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

Os seguintes testes correspondem diretamente aos 10 itens exigidos na 7ª entrega:

### Cenário 01: Cliente realiza compra
- Teste: `cypress/e2e/entrega7/01-cliente-realiza-compra.cy.js`
- Item exigido: Cliente realizar compra;
- DRS: RF0031, RF0033, RF0034, RF0037

### Cenário 02: Cliente pagar com todas possíveis combinações
- Teste: `cypress/e2e/entrega7/02-cliente-pagamento-combinado.cy.js`
- Item exigido: Cliente pagar com todas possíveis combinações de meio de pagamento (uso de diferentes cartões e cupons);
- DRS: RF0036, RN0033, RN0034, RN0035

### Cenário 03: Cliente registra novo cartão e endereço no ato da compra
- Teste: `cypress/e2e/entrega7/03-cliente-novo-cartao-endereco.cy.js`
- Item exigido: Cliente pode registrar novo cartão e novo endereço de entrega no ato da compra;
- DRS: RF0035, RF0036

### Cenário 04: Usuário solicita troca de um item ou pedido completo
- Teste: `cypress/e2e/entrega7/04-usuario-solicita-troca.cy.js`
- Item exigido: Usuário pode solicitar troca ou devolução de um item do pedido ou do pedido completo;
- DRS: RF0040, RN0041

### Cenário 05: Administrador confirma o pagamento
- Teste: `cypress/e2e/entrega7/05-admin-confirma-pagamento.cy.js`
- Item exigido: O administrador confirma o pagamento;
- DRS: RN0037, RN0038

### Cenário 06: Administrador aceita ou nega a troca / devolução
- Teste: `cypress/e2e/entrega7/06-admin-aceita-nega-troca.cy.js`
- Item exigido: O administrador aceitar ou negar a troca / devolução;
- DRS: RF0041, RNF0046

### Cenário 07: Administrador define que produto está EM TRANSPORTE
- Teste: `cypress/e2e/entrega7/07-admin-em-transporte.cy.js`
- Item exigido: O administrador define que o produto está EM TRANSPORTE;
- DRS: RF0038, RN0039

### Cenário 08: Administrador confirma recebimento do produto devolvido
- Teste: `cypress/e2e/entrega7/08-admin-confirma-recebimento.cy.js`
- Item exigido: O administrador confirma o recebimento do produto devolvido;
- DRS: RF0043, RN0042

### Cenário 09: Sistema gerar cupom de troca
- Teste: `cypress/e2e/entrega7/09-sistema-gera-cupom.cy.js`
- Item exigido: O sistema gerar cupom de troca;
- DRS: RF0044, RN0036

### Cenário 10: Administrador confirma que o produto foi ENTREGUE
- Teste: `cypress/e2e/entrega7/10-admin-confirma-entregue.cy.js`
- Item exigido: O administrador confirma que o produto foi ENTREGUE;
- DRS: RF0039, RN0040
