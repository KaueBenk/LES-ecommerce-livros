# PRD — E-Commerce de Livros (LES 2026) — Ralph Loop — Frontend

**Data:** 1º de Março de 2026  
**Versão:** 1.0  
**Objetivo:** Implementação completa de interface do cliente para e-commerce de livros, com foco em testabilidade via Cypress e Selenium.

---

## Sumário

1. [Visão Geral do Ralph Loop](#visão-geral-do-ralph-loop)
2. [Stack Técnico](#stack-técnico)
3. [Mapeamento de Fases e Requisitos](#mapeamento-de-fases-e-requisitos)
4. [Arquitetura de Componentes](#arquitetura-de-componentes)
5. [Fase 0: Setup do Projeto (FE-001)](#fase-0-setup-do-projeto-fe-001)
6. [Fase 1: Autenticação (FE-002)](#fase-1-autenticação-fe-002)
7. [Fase 2: Dados Pessoais (FE-003)](#fase-2-dados-pessoais-fe-003)
8. [Fase 3+: Fluxos de Negócio](#fase-3-fluxos-de-negócio)
9. [Estratégia de Testes (Cypress + Selenium)](#estratégia-de-testes-cypress--selenium)
10. [Requisitos Não Funcionais](#requisitos-não-funcionais)
11. [Decisões de Design](#decisões-de-design)

---

## Visão Geral do Ralph Loop

O **Ralph Loop** é um ciclo iterativo de desenvolvimento que segue as fases:

1. **Plan (Planejar):** Definir requisitos baseado em issues e documentação
2. **Implement (Implementar):** Criar componentes/features com testes em mente
3. **Review (Revisar):** Validar testes funcionam, código é limpo
4. **Loop (Iterar):** Feedback → próxima fase

### Fases do Frontend (Roadmap Completo)

| Fase | Issue | Titulo | Prioridade | Status |
|------|-------|--------|-----------|--------|
| 0 | #42 | [FE-001] Setup do Projeto (Vite + Bootstrap + Router) | Alta | Not Started |
| 1 | #43 | [FE-002] Formulários de Autenticação | Alta | Not Started |
| 2 | #44 | [FE-003] Minha Conta - Dados Pessoais | Alta | Not Started |
| 3 | #45 | [FE-004] Minha Conta - Endereços | Alta | Not Started |
| 3 | #46 | [FE-005] Minha Conta - Cartões | Alta | Not Started |
| 3 | #47 | [FE-006] Minha Conta - Alteração de Senha | Alta | Not Started |
| 4 | #48 | [FE-007] Histórico de Pedidos | Média | Not Started |
| 4 | #49 | [FE-008] Solicitação de Troca | Média | Not Started |
| 5 | #50 | [FE-009] Vitrine / Tela Inicial | Alta | Not Started |
| 5 | #51 | [FE-010] Busca e Filtros Avançados | Média | Not Started |
| 5 | #52 | [FE-011] Página do Livro | Alta | Not Started |
| 5 | #53 | [FE-012] Seção de Avaliações do Livro | Média | Not Started |
| 6 | #54 | [FE-013] Carrinho - Listagem e Edição | Alta | Not Started |
| 6 | #55 | [FE-014] Carrinho - Timer de Bloqueio e Alertas | Média | Not Started |
| 7 | #56 | [FE-015] Checkout - Endereço e Frete | Alta | Not Started |
| 7 | #57 | [FE-016] Checkout - Seleção de Cupons | Média | Not Started |
| 7 | #58 | [FE-017] Checkout - Pagamento com Cartões | Média | Not Started |
| 7 | #59 | [FE-018] Checkout - Resumo e Confirmação | Alta | Not Started |
| 8 | #60 | [FE-019] Widget de Chatbot Flutuante | Baixa | Not Started |
| 9 | #61 | [FE-020] CRUD Admin - Cadastro de Livros | Média | Not Started |
| 9 | #62 | [FE-021] CRUD Admin - Precificação e Margem | Média | Not Started |
| 9 | #63 | [FE-022] CRUD Admin - Listagem de Livros | Média | Not Started |
| 10 | #64 | [FE-023] Gestão de Estoque | Alta | Not Started |
| 10 | #65 | [FE-024] Painel Logístico de Vendas | Alta | Not Started |
| 10 | #66 | [FE-025] Consulta de Clientes (Admin) | Média | Not Started |
| 10 | #67 | [FE-026] Workflow de Trocas | Média | Not Started |
| 10 | #68 | [FE-027] Moderação de Avaliações | Média | Not Started |
| 11 | #69 | [FE-028] Dashboard - Gráfico de Vendas por Período | Média | Not Started |
| 11 | #70 | [FE-029] Dashboard - Vendas por Região | Média | Not Started |
| 11 | #71 | [FE-030] Sistema de Notificações | Média | Not Started |
| **Testes** | #72 | [FE-031] Setup do Cypress | Alta | Not Started |
| **Testes** | #73 | [FE-032] Testes - Autenticação e Perfil | Alta | Not Started |
| **Testes** | #74 | [FE-033] Testes - CRUD de Livros e Estoque | Alta | Not Started |
| **Testes** | #75 | [FE-034] Testes - Fluxo de Compra Completo | Alta | Not Started |
| **Testes** | #76 | [FE-035] Testes - Carrinho e Bloqueio Temporal | Média | Not Started |
| **Testes** | #77 | [FE-036] Testes - Trocas e Avaliações | Média | Not Started |
| **Testes** | #78 | [FE-037] Testes - Dashboard e Análise | Média | Not Started |

---

## Stack Técnico

### Containerização e Ambiente

```yaml
# Docker stack (Decision D11)
Docker: Latest stable (multi-stage builds)
Docker Compose: 2.x+
Node.js: 24+ (na imagem Docker)
Package Manager: npm 11+
Base Image: node:current-alpine3.23 para produção
```

### Versões Pinned

```json
{
  "react": "^18.2.0",
  "vite": "^5.3.0",
  "bootstrap": "^5.3.0",
  "react-router-dom": "^6.20.0",
  "axios": "^1.6.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "cypress": "^13.6.0",
  "eslint": "^8.52.0",
  "prettier": "^3.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/cypress": "^9.1.0"
}
```

### Convenções HTTP/API

- **Base URL:** `http://localhost:8080/api/v1` (desenvolvimento)
- **Headers:** `Authorization: Bearer <JWT>`, `Content-Type: application/json`
- **Resposta de sucesso:** `{ "statusCode": 200, "data": {...}, "message": "OK" }`
- **Erro:** `{ "statusCode": 400, "message": "Erro", "errors": [...] }`
- **Timeout:** 30s padrão, sem retry automático

### LocalStorage

```javascript
// Keys usadas no frontend
{
  "auth_token": "jwt_token_aqui",
  "user_profile": { id, nome, email, ranking },
  "cart_session": { items: [], timestamp },
  "user_preferences": { idioma, tema, notificacoes }
}
```

---

## Mapeamento de Fases e Requisitos

| Fase | FE | Titulo | Requisitos Funcionais | Requisitos Não-Func. |
|------|----|----|---|---|
| 0 | FE-001 | Setup | RF0028 (auth setup) | RNF0011 |
| 1 | FE-002 | Autenticação | RF0021, RF0028 | RNF0031, RNF0032, RNF0033 |
| 2 | FE-003 | Dados Pessoais | RF0022 | RNF0035 |
| 2 | FE-004 | Endereços | RF0026, RF0035 | RN0023 |
| 2 | FE-005 | Cartões | RF0027, RF0036 | RN0024, RN0025 |
| 2 | FE-006 | Alterar Senha | RF0028 | RNF0031, RNF0032 |
| 4 | FE-007 | Histórico de Pedidos | RF0025 | - |
| 4 | FE-008 | Solicitação de Troca | RF0040 | - |
| 5 | FE-009 | Vitrine / Tela Inicial | RF0011, RF0015 | RNF0011 |
| 5 | FE-010 | Busca e Filtros | RF0015 | RNF0011 |
| 5 | FE-011 | Página do Livro | RF0015 | - |
| 5 | FE-012 | Avaliações | RF00063, RF0025 | - |
| 6 | FE-013 | Carrinho | RF0031, RF0032 | RN0031, RN0044 |
| 6 | FE-014 | Timer Bloqueio | RF0032 | RNF0042, RN0044 |
| 7 | FE-015 | Checkout - Endereço | RF0034, RF0035 | RNF0011 |
| 7 | FE-016 | Checkout - Cupons | RF0036 | RN0033, RN0036 |
| 7 | FE-017 | Checkout - Pagamento | RF0036 | RN0034, RN0035 |
| 7 | FE-018 | Checkout - Confirmação | RF0033, RF0037 | - |
| 8 | FE-019 | Chatbot | RNF0044 | RNF0044 |
| 9 | FE-020 | CRUD - Cadastro Livros | RF0011, RF0014 | RN0011 |
| 9 | FE-021 | Precificação | RF0014 | RN0014 |
| 9 | FE-022 | CRUD - Listagem Livros | RF0015 | RNF0011 |
| 10 | FE-023 | Gestão de Estoque | RF0051 | RN0051, RN0062 |
| 10 | FE-024 | Painel Logístico | RF0038, RF0039 | RN0028, RN0030 |
| 10 | FE-025 | Consulta Clientes | RF0024 | - |
| 10 | FE-026 | Workflow Trocas | RF0041, RF0042, RF0043 | RN0044, RN0054 |
| 10 | FE-027 | Moderação Avaliações | RF00065 | - |
| 11 | FE-028 | Dashboard - Vendas | RF0055 | RNF0043 |
| 11 | FE-029 | Dashboard - Regiões | RF00064 | - |
| 11 | FE-030 | Notificações | RNF0046 (D5) | RNF0046 |
| Testes | FE-031 | Setup Cypress | - | - |
| Testes | FE-032 | Testes Auth | RF0021, RNF0031 | - |
| Testes | FE-033 | Testes CRUD Livros | RF0011, RF0012, RF0051 | - |
| Testes | FE-034 | Testes Fluxo Compra | RF0031, RF0033, RF0037 | - |
| Testes | FE-035 | Testes Carrinho | RN0044, RNF0042 | - |
| Testes | FE-036 | Testes Trocas | RF0040, RF00063 | - |
| Testes | FE-037 | Testes Dashboard | RF0055, RF00064 | - |

---

```
frontend/
├── public/
│   ├── assets/
│   │   ├── book-placeholder.png
│   │   ├── logo.svg
│   │   └── icons/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ErrorBoundary.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── LogoutButton.jsx
│   │   ├── customer/
│   │   │   ├── ProfileForm.jsx
│   │   │   ├── AddressForm.jsx
│   │   │   ├── CreditCardForm.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   └── AccountDashboard.jsx
│   │   ├── catalog/
│   │   │   ├── BookCard.jsx
│   │   │   ├── BookGrid.jsx
│   │   │   ├── BookDetails.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   └── BookList.jsx
│   │   ├── cart/
│   │   │   ├── CartIcon.jsx
│   │   │   ├── CartSidebar.jsx
│   │   │   ├── CartItemRow.jsx
│   │   │   └── CartSummary.jsx
│   │   ├── checkout/
│   │   │   ├── DeliveryAddressStep.jsx
│   │   │   ├── PaymentStep.jsx
│   │   │   ├── CouponInput.jsx
│   │   │   ├── OrderReview.jsx
│   │   │   └── CheckoutFlow.jsx
│   │   ├── admin/
│   │   │   ├── OrderManagement.jsx
│   │   │   ├── AnalyticsDashboard.jsx
│   │   │   ├── ApprovalQueue.jsx
│   │   │   └── SystemParameters.jsx
│   │   └── reviews/
│   │       ├── ReviewForm.jsx
│   │       ├── ReviewList.jsx
│   │       └── ReviewModeration.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useCart.js
│   │   ├── useFetch.js
│   │   ├── useNotification.js
│   │   └── usePageTitle.js
│   ├── services/
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── customerService.js
│   │   ├── catalogService.js
│   │   ├── cartService.js
│   │   ├── checkoutService.js
│   │   ├── reviewService.js
│   │   └── analyticsService.js
│   ├── store/
│   │   ├── authContext.js
│   │   ├── cartContext.js
│   │   └── notificationContext.js
│   ├── styles/
│   │   ├── main.scss
│   │   ├── variables.scss
│   │   ├── forms.scss
│   │   ├── buttons.scss
│   │   └── responsive.scss
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── CatalogPage.jsx
│   │   ├── ProductPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── OrderHistoryPage.jsx
│   │   ├── AccountPage.jsx
│   │   ├── AdminPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── utils/
│   │   ├── validators.js
│   │   ├── formatters.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── __tests__/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│       └── cypress/
│           ├── e2e/
│           │   ├── auth.cy.js
│           │   ├── catalog.cy.js
│           │   ├── cart.cy.js
│           │   ├── checkout.cy.js
│           │   └── account.cy.js
│           ├── fixtures/
│           ├── plugins/
│           └── support/
├── cypress.config.js
├── vite.config.js
├── package.json
├── eslintrc.json
└── README.md
```

---

## Arquitetura de Componentes

### Padrão de Componente

Cada componente deve seguir este padrão:

```javascript
// components/example/ExampleComponent.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types'; // Validação de props
import './ExampleComponent.scss';

/**
 * ExampleComponent
 * @component
 * @description Descrição clara do componente
 * @param {Object} props - Props object
 * @param {string} props.title - Título do exemplo
 * @param {Function} props.onSubmit - Callback ao enviar
 * @param {boolean} props.loading - Estado de carregamento
 * @returns {JSX.Element}
 */
const ExampleComponent = ({ title, onSubmit, loading }) => {
  const [state, setState] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Lógica de inicialização
  }, []);

  const handleChange = (e) => {
    setState(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(state);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="example-component" data-testid="example-component">
      <h2>{title}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={state}
          onChange={handleChange}
          data-testid="example-input"
          disabled={loading}
          required
        />
        <button type="submit" disabled={loading} data-testid="example-submit">
          {loading ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
};

ExampleComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

ExampleComponent.defaultProps = {
  loading: false
};

export default ExampleComponent;
```

### Contextos Globais

#### 1. AuthContext

```javascript
// store/authContext.js
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);

  const login = async (cpf, senha) => {
    setLoading(true);
    try {
      const response = await authService.login(cpf, senha);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_profile', JSON.stringify(response.user));
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

#### 2. CartContext

```javascript
// store/cartContext.js
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cart_session');
    return saved ? JSON.parse(saved).items : [];
  });
  const [expiresAt, setExpiresAt] = useState(() => {
    const saved = localStorage.getItem('cart_session');
    return saved ? JSON.parse(saved).expiresAt : Date.now() + 30 * 60 * 1000;
  });

  const addItem = (book, quantity) => {
    const existing = items.find(i => i.id === book.id);
    if (existing) {
      setItems(items.map(i =>
        i.id === book.id ? { ...i, quantity: i.quantity + quantity } : i
      ));
    } else {
      setItems([...items, { ...book, quantity, bloqueadoEm: new Date() }]);
    }
  };

  const removeItem = (bookId) => {
    setItems(items.filter(i => i.id !== bookId));
  };

  const updateQuantity = (bookId, quantity) => {
    if (quantity <= 0) {
      removeItem(bookId);
    } else {
      setItems(items.map(i => (i.id === bookId ? { ...i, quantity } : i)));
    }
  };

  const clear = () => setItems([]);

  // Salvar sempre em localStorage
  useEffect(() => {
    localStorage.setItem('cart_session', JSON.stringify({ items, expiresAt }));
  }, [items, expiresAt]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clear, expiresAt }}>
      {children}
    </CartContext.Provider>
  );
};
```

---

## Fase 0: Setup do Projeto (FE-001)

**Issue #42 — Setup do Projeto (Vite + Bootstrap + Router)**

### Objetivos

- ✅ Inicializar projeto React com Vite
- ✅ Configurar Bootstrap 5
- ✅ Configurar React Router
- ✅ Setup de linting (ESLint)
- ✅ Setup de formatação (Prettier)
- ✅ Setup inicial de Cypress para testes E2E
- ✅ Estrutura de pastas definida

### Checklist de Implementação

- [ ] `npm create vite@latest frontend -- --template react`
- [ ] Instalar dependências: `bootstrap`, `react-router-dom`, `axios`
- [ ] Configurar `vite.config.js` com alias de paths
- [ ] Criar `index.css` com imports do Bootstrap
- [ ] Configurar ESLint com `.eslintrc.json`
- [ ] Configurar Prettier com `.prettierrc`
- [ ] Inicializar Cypress: `npx cypress open`
- [ ] Criar estructura de diretórios conforme PRD
- [ ] Criar `AuthContext` em `src/store`
- [ ] Criar `CartContext` em `src/store`
- [ ] Criar `services/api.js` com axios instance (baseURL: `/api/v1`, interceptador JWT)
- [ ] Criar layout base (Header, Footer, Navbar)
- [ ] Criar `App.jsx` com rotas principais
- [ ] **Revisar [API_CONTRACT.md](../API_CONTRACT.md)** — Garantir alinhamento com endpoints esperados
- [ ] Criar `.env.example` com `VITE_API_URL` para Dev/Prod
- [ ] Documentar processo em `frontend/SETUP.md`

### Testes Cypress — Smoke Test

```javascript
// __tests__/e2e/cypress/e2e/smoke.cy.js

describe('Smoke Test — App Loads', () => {
  it('should load homepage', () => {
    cy.visit('http://localhost:5173');
    cy.get('header').should('be.visible');
    cy.get('footer').should('be.visible');
  });

  it('should have navigation links', () => {
    cy.visit('http://localhost:5173');
    cy.get('nav a').should('have.length.greaterThan', 0);
  });
});
```

### Validação de Sucesso

- [ ] Projeto sobe sem erros em `npm run dev`
- [ ] Bundle build sem warnings
- [ ] Cypress testes passam
- [ ] ESLint sem erros críticos

---

## Fase 1: Autenticação (FE-002)

**Issue #43 — Formulários de Autenticação**

### Requisitos Funcionais (baseado em RF0021, RF0028)

- Login com CPF e Senha (RF0021)
- Cadastro de novo cliente com validações (RF0021)
- Alteração de senha isolada (RF0028)
- Recuperação de senha (future)
- Token JWT armazenado em localStorage
- Redirect automático após login

### Telas

#### LoginForm.jsx

```javascript
/**
 * LoginForm — Autenticação de cliente
 * Campos:
 *   - CPF (11 dígitos, validação)
 *   - Senha (mínimo 8 chars)
 * Validações:
 *   - CPF válido (algoritmo módulo 11)
 *   - Senha não vazia
 * Feedback:
 *   - Loading state
 *   - Erro geral (credenciais incorretas)
 */
```

**Data-testid atributes:**

```html
<form data-testid="login-form">
  <input data-testid="cpf-input" type="text" placeholder="CPF" />
  <input data-testid="password-input" type="password" placeholder="Senha" />
  <button data-testid="login-submit">Entrar</button>
  <a data-testid="register-link">Criar conta</a>
</form>
```

#### RegisterForm.jsx

```javascript
/**
 * RegisterForm — Cadastro de cliente
 * Campos:
 *   - Nome
 *   - CPF (unique, validação)
 *   - Email (unique, RFC 5322)
 *   - Data de Nascimento
 *   - Gênero (MASCULINO, FEMININO, OUTRO)
 *   - Telefone (tipo: CELULAR/FIXO, DDD, número)
 *   - Endereço (CEP, rua, número, bairro, cidade, estado)
 *   - Senha (≥8, maiúscula, minúscula, especial) — RNF0031
 *   - Confirmação de senha — RNF0032
 * Backend validation: API retorna erros específicos
 */
```

**Data-testid atributes:**

```html
<form data-testid="register-form">
  <input data-testid="name-input" type="text" placeholder="Nome completo" required />
  <input data-testid="cpf-input" type="text" placeholder="CPF" required />
  <input data-testid="email-input" type="email" placeholder="Email" required />
  <input data-testid="birth-date-input" type="date" required />
  <select data-testid="gender-select" required>
    <option>Selecione</option>
    <option>MASCULINO</option>
    <option>FEMININO</option>
    <option>OUTRO</option>
  </select>
  <input data-testid="phone-input" type="tel" placeholder="Celular" required />
  <input data-testid="password-input" type="password" placeholder="Senha" required />
  <input data-testid="password-confirm-input" type="password" placeholder="Confirmar Senha" required />
  <button data-testid="register-submit">Criar Conta</button>
</form>
```

#### ChangePasswordForm.jsx

```javascript
/**
 * ChangePasswordForm — Alteração de senha isolada (RF0028)
 * Campos:
 *   - Senha atual (validação)
 *   - Nova senha (validações RNF0031)
 *   - Confirmação
 * Não permite edição de outros dados
 */
```

### Testes Cypress

```javascript
// __tests__/e2e/cypress/e2e/auth.cy.js

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/login');
  });

  it('should show login form', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="cpf-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
  });

  it('should login with valid credentials', () => {
    cy.get('[data-testid="cpf-input"]').type('12345678901');
    cy.get('[data-testid="password-input"]').type('ValidPass123!');
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/home');
  });

  it('should show error on invalid CPF', () => {
    cy.get('[data-testid="cpf-input"]').type('invalid');
    cy.get('[data-testid="login-submit"]').click();
    cy.get('[data-testid="error-message"]').should('contain', 'CPF inválido');
  });

  it('should register new customer', () => {
    cy.get('[data-testid="register-link"]').click();
    cy.get('[data-testid="register-form"]').should('be.visible');
    cy.get('[data-testid="name-input"]').type('João Silva');
    cy.get('[data-testid="cpf-input"]').type('12345678901');
    cy.get('[data-testid="email-input"]').type('joao@email.com');
    cy.get('[data-testid="birth-date-input"]').type('1990-01-15');
    cy.get('[data-testid="gender-select"]').select('MASCULINO');
    cy.get('[data-testid="phone-input"]').type('11987654321');
    cy.get('[data-testid="password-input"]').type('ValidPass123!');
    cy.get('[data-testid="password-confirm-input"]').type('ValidPass123!');
    cy.get('[data-testid="register-submit"]').click();
    cy.url().should('include', '/login');
  });

  it('should prevent weak password', () => {
    cy.get('[data-testid="register-link"]').click();
    cy.get('[data-testid="password-input"]').type('weak');
    cy.get('[data-testid="password-confirm-input"]').type('weak');
    cy.get('[data-testid="register-submit"]').click();
    cy.get('[data-testid="error-message"]').should('contain', 'senha fraca');
  });

  it('should change password', () => {
    // Assumindo que usuário está logado
    cy.login('12345678901', 'ValidPass123!'); // Custom command
    cy.visit('http://localhost:5173/account/change-password');
    cy.get('[data-testid="current-password-input"]').type('ValidPass123!');
    cy.get('[data-testid="new-password-input"]').type('NewPass456!');
    cy.get('[data-testid="confirm-password-input"]').type('NewPass456!');
    cy.get('[data-testid="change-password-submit"]').click();
    cy.get('[data-testid="success-message"]').should('be.visible');
  });
});
```

### Validações Frontend

```javascript
// utils/validators.js

export const validateCPF = (cpf) => {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return false;
  // Algoritmo módulo 11 (não detalhado aqui)
  return true;
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePassword = (password) => {
  // Mínimo 8 caracteres, pelo menos uma maiúscula, uma minúscula e um caractere especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/;
  return regex.test(password);
};

export const validatePhone = (ddd, numero) => {
  const ddRegex = /^\d{2}$/;
  const numRegex = /^\d{9}$/; // 9 dígitos para celular/8 para fixo
  return ddRegex.test(ddd) && (numRegex.test(numero) || /^\d{8}$/.test(numero));
};
```

---

## Fase 2: Dados Pessoais (FE-003)

**Issue #44 — Minha Conta - Dados Pessoais**

### Requisitos Funcionais (RF0022, RF0026, RF0027)

- Editar dados pessoais (nome, email, gênero, data nascimento)
- Gerenciar endereços de cobrança e entrega (RF0026, RN0021, RN0022)
- Gerenciar cartões de crédito (RF0027, RN0024, RN0025)
- Visualizar histórico de transações (RF0025)
- Consultar ranking/perfil del cliente (RN0027)

### Telas

#### AccountDashboard.jsx

```javascript
/**
 * AccountDashboard — Página principal de conta
 * Seções:
 *   1. Perfil resumido (nome, email, ranking)
 *   2. Abas: Dados Pessoais, Endereços, Cartões, Histórico
 *   3. Quick actions: Editar perfil, Nova senha
 */
```

**Data-testid atributes:**

```html
<div data-testid="account-dashboard">
  <section data-testid="profile-summary">
    <h3>Meu Perfil</h3>
    <p data-testid="user-name">João Silva</p>
    <p data-testid="user-email">joao@email.com</p>
    <p data-testid="user-ranking">Ranking: R$ 5.234,50</p>
  </section>
  
  <div data-testid="account-tabs" role="tablist">
    <button data-testid="tab-profile">Dados Pessoais</button>
    <button data-testid="tab-addresses">Endereços</button>
    <button data-testid="tab-cards">Cartões</button>
    <button data-testid="tab-history">Histórico</button>
  </div>
</div>
```

#### ProfileForm.jsx

```javascript
/**
 * ProfileForm — Edição de perfil pessoal
 * Campos editáveis:
 *   - Nome (required)
 *   - Email (unique, validação RFC 5322)
 *   - Gênero (select)
 *   - Data de Nascimento (read-only via interface)
 *   - Telefones (list com add/remove)
 * Botões: Salvar, Cancelar
 * Validações: Backend retorna erros específicos
 */
```

**Data-testid atributes:**

```html
<form data-testid="profile-form">
  <input data-testid="name-input" type="text" value="..." disabled={!editing} />
  <input data-testid="email-input" type="email" value="..." />
  <select data-testid="gender-select">
    <option>MASCULINO</option>
    <option>FEMININO</option>
    <option>OUTRO</option>
  </select>
  <div data-testid="phones-list">
    <!-- Lista de telefones -->
  </div>
  <button data-testid="profile-submit">Salvar</button>
  <button data-testid="profile-cancel">Cancelar</button>
</form>
```

#### AddressForm.jsx + AddressList.jsx

```javascript
/**
 * AddressForm — Criar/editar endereço
 * Campos:
 *   - Apelido (ex: "Casa", "Trabalho") — RF0026
 *   - Tipo de residência (CASA, APARTAMENTO, OUTRO)
 *   - Tipo de logradouro (RUA, AVENIDA, TRAVESSA, ALAMEDA, OUTRO)
 *   - CEP (autocomplete via API pública)
 *   - Logradouro, número, bairro, cidade, estado, país
 *   - Observações (opcional)
 *   - Tipo de endereço (COBRANÇA, ENTREGA, AMBOS)
 * 
 * Validações:
 *   - Mínimo 1 de cobrança — RN0021
 *   - Mínimo 1 de entrega — RN0022
 *   - CEP formato válido
 */
```

**Data-testid atributes:**

```html
<form data-testid="address-form">
  <input data-testid="address-nickname" placeholder="Ex: Casa" />
  <select data-testid="residence-type-select">
    <option>CASA</option>
    <option>APARTAMENTO</option>
    <option>OUTRO</option>
  </select>
  <input data-testid="cep-input" placeholder="CEP" />
  <input data-testid="street-input" placeholder="Rua/Avenida" />
  <input data-testid="number-input" placeholder="Número" />
  <input data-testid="city-input" placeholder="Cidade" />
  <input data-testid="state-input" placeholder="Estado (UF)" />
  <select data-testid="address-type-select">
    <option>COBRANCA</option>
    <option>ENTREGA</option>
    <option>AMBOS</option>
  </select>
  <button data-testid="address-submit">Salvar Endereço</button>
</form>

<div data-testid="addresses-list">
  <div data-testid="address-item" class="address-card">
    <h5>Casa</h5>
    <p>Rua das Flores, 123, São Paulo-SP</p>
    <button data-testid="address-edit">Editar</button>
    <button data-testid="address-delete">Remover</button>
  </div>
</div>
```

#### CreditCardForm.jsx + CreditCardList.jsx

```javascript
/**
 * CreditCardForm — Criar/editar cartão
 * Campos:
 *   - Número do cartão (16 dígitos, validação Luhn - RN0024)
 *   - Nome impresso (validação: matches nome do perfil)
 *   - Bandeira (select: Visa, Mastercard, Elo, etc. - RN0025)
 *   - Código de segurança (3-4 dígitos, validação)
 *   - Data de validade (MM/YY)
 *   - Marcar como preferencial (apenas 1 por cliente - RF0027)
 * 
 * Validações:
 *   - Bandeira deve estar cadastrada no sistema (RN0025)
 *   - Mock: último dígito PAR = rejeitará na compra, ÍMPAR = aprovará (D8)
 */
```

**Data-testid atributes:**

```html
<form data-testid="card-form">
  <input data-testid="card-number" maxlength="16" placeholder="1234 5678 9012 3456" />
  <input data-testid="card-holder" placeholder="Nome no cartão" />
  <input data-testid="card-expiry" placeholder="MM/YY" />
  <input data-testid="card-cvv" maxlength="4" placeholder="CVV" />
  <select data-testid="card-brand-select">
    <option>Visa</option>
    <option>Mastercard</option>
    <option>Elo</option>
  </select>
  <label>
    <input data-testid="card-preferred" type="checkbox" />
    Cartão preferencial
  </label>
  <button data-testid="card-submit">Salvar Cartão</button>
</form>

<div data-testid="cards-list">
  <div data-testid="card-item" class="card-card">
    <p>**** **** **** 3456 (Visa)</p>
    <p>João Silva</p>
    <p>Expires: 12/25</p>
    {preferred && <span data-testid="card-preferred-badge">Preferencial</span>}
    <button data-testid="card-edit">Editar</button>
    <button data-testid="card-delete">Remover</button>
  </div>
</div>
```

#### TransactionHistory.jsx

```javascript
/**
 * TransactionHistory — Histórico de compras (RF0025)
 * Exibe:
 *   - Pedido #ID, data, total, status
 *   - Link para detalhes do pedido
 *   - Paginação
 * Status visíveis:
 *   - EM_PROCESSAMENTO, APROVADA, REPROVADA
 *   - EM_TRANSITO, ENTREGUE, EM_TROCA, TROCADO
 */
```

**Data-testid atributes:**

```html
<table data-testid="transaction-history">
  <thead>
    <tr>
      <th>Pedido</th>
      <th>Data</th>
      <th>Total</th>
      <th>Status</th>
      <th>Ação</th>
    </tr>
  </thead>
  <tbody>
    <tr data-testid="transaction-row">
      <td data-testid="transaction-id">#12345</td>
      <td data-testid="transaction-date">01/03/2026</td>
      <td data-testid="transaction-total">R$ 123,45</td>
      <td data-testid="transaction-status">ENTREGUE</td>
      <td>
        <a data-testid="transaction-detail-link">Ver Detalhes</a>
      </td>
    </tr>
  </tbody>
</table>
```

### Testes Cypress (Fase 2)

```javascript
// __tests__/e2e/cypress/e2e/account.cy.js

describe('Account Management', () => {
  beforeEach(() => {
    cy.login('12345678901', 'ValidPass123!');
    cy.visit('http://localhost:5173/account');
  });

  describe('Profile Management', () => {
    it('should display account dashboard', () => {
      cy.get('[data-testid="account-dashboard"]').should('be.visible');
      cy.get('[data-testid="profile-summary"]').should('be.visible');
      cy.get('[data-testid="user-name"]').should('contain', 'João');
    });

    it('should edit profile data', () => {
      cy.get('[data-testid="tab-profile"]').click();
      cy.get('[data-testid="profile-form"]').should('be.visible');
      cy.get('[data-testid="name-input"]').clear().type('João Silva Santos');
      cy.get('[data-testid="profile-submit"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });
  });

  describe('Address Management', () => {
    it('should add new address', () => {
      cy.get('[data-testid="tab-addresses"]').click();
      cy.get('[data-testid="add-address-button"]').click();
      cy.get('[data-testid="address-form"]').should('be.visible');
      cy.get('[data-testid="address-nickname"]').type('Casa Nova');
      cy.get('[data-testid="cep-input"]').type('01310100');
      cy.get('[data-testid="street-input"]').type('Avenida Paulista');
      cy.get('[data-testid="number-input"]').type('1000');
      cy.get('[data-testid="city-input"]').type('São Paulo');
      cy.get('[data-testid="state-input"]').type('SP');
      cy.get('[data-testid="address-type-select"]').select('ENTREGA');
      cy.get('[data-testid="address-submit"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
      cy.get('[data-testid="addresses-list"]').should('contain', 'Casa Nova');
    });

    it('should enforce minimum 1 delivery address', () => {
      cy.get('[data-testid="tab-addresses"]').click();
      cy.get('[data-testid="address-item"]').each(($el) => {
        const hasDelivery = $el.find('[data-testid="address-type"]').text().includes('ENTREGA');
        if (hasDelivery) {
          cy.wrap($el).find('[data-testid="address-delete"]').should('not.exist');
        }
      });
    });
  });

  describe('Credit Card Management', () => {
    it('should add credit card', () => {
      cy.get('[data-testid="tab-cards"]').click();
      cy.get('[data-testid="add-card-button"]').click();
      cy.get('[data-testid="card-form"]').should('be.visible');
      cy.get('[data-testid="card-number"]').type('4111111111111111');
      cy.get('[data-testid="card-holder"]').type('João Silva');
      cy.get('[data-testid="card-expiry"]').type('12/25');
      cy.get('[data-testid="card-cvv"]').type('123');
      cy.get('[data-testid="card-brand-select"]').select('Visa');
      cy.get('[data-testid="card-submit"]').click();
      cy.get('[data-testid="success-message"]').should('be.visible');
    });

    it('should allow only 1 preferred card', () => {
      cy.get('[data-testid="tab-cards"]').click();
      cy.get('[data-testid="card-item"]').first().within(() => {
        cy.get('[data-testid="card-preferred"]').check();
      });
      // Verify only one preferred
      cy.get('[data-testid="card-preferred-badge"]').should('have.length', 1);
    });
  });

  describe('Transaction History', () => {
    it('should display transaction history', () => {
      cy.get('[data-testid="tab-history"]').click();
      cy.get('[data-testid="transaction-history"]').should('be.visible');
      cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);
    });

    it('should show transaction details', () => {
      cy.get('[data-testid="tab-history"]').click();
      cy.get('[data-testid="transaction-row"]').first().within(() => {
        cy.get('[data-testid="transaction-detail-link"]').click();
      });
      cy.url().should('include', '/order/');
      cy.get('[data-testid="order-detail"]').should('be.visible');
    });
  });
});
```

---

## Fase 3+: Fluxos de Negócio

(Phases subsequentes seguem o mesmo padrão do Ralph Loop)

### Fase 3: Catálogo (FE-004+)

- Listar livros com paginação
- Filtrar por categoria, autor, preço
- Busca por título/ISBN
- Detalhes do livro
- Avaliações e comentários

### Fase 4: Carrinho (FE-005+)

- Adicionar ao carrinho (com validação de estoque - RN0031)
- Exibir carrinho lateral + página dedicada
- Alterar quantidade
- Remover itens
- Notificação de expiração (RN0044)
- Cupons de troca/promocionais

### Fase 5: Checkout (FE-006+)

- Seleção de endereço (RF0035)
- Cálculo de frete (RF0034, D1)
- Seleção de forma de pagamento (RF0036)
- Aplicação de cupons (RN0033, RN0034, RN0035, RN0036)
- Revisão e finalização (RF0033, RF0037)

### Fase 6: Admin (FE-007+)

- Gestão de pedidos (pipeline de status - RN0028, RN0030)
- Despacho (RF0038)
- Entrega (RF0039)
- Autorização de trocas (RF0041, RF0042)
- Recebimento de trocas (RF0043, RF0044)
- Dashboard analítico (RF0055, RF0056)
- Parâmetros do sistema (D3, D4)

---

## Estratégia de Testes (Cypress + Selenium)

### Abordagem Multi-Layer

```
┌─────────────────────────────────────┐
│  E2E Tests (Cypress)                │  ← Fluxos de usuário completos
├─────────────────────────────────────┤
│  Integration Tests (React Testing)  │  ← Componentes + API interactions
├─────────────────────────────────────┤
│  Unit Tests (Vitest)                │  ← Funções isoladas (validators)
└─────────────────────────────────────┘
```

### Cypress Setup

```javascript
// cypress.config.js

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // plugins
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
```

### Cypress Commands Customizados

```javascript
// __tests__/e2e/cypress/support/commands.js

Cypress.Commands.add('login', (cpf, password) => {
  cy.visit('/login');
  cy.get('[data-testid="cpf-input"]').type(cpf);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.url().should('include', '/home');
});

Cypress.Commands.add('mockAPI', (method, url, response) => {
  cy.intercept(method, url, response).as('apiCall');
});

Cypress.Commands.add('waitForAPI', (alias) => {
  cy.wait(`@${alias}`);
});

Cypress.Commands.add('addToCart', (bookId, quantity = 1) => {
  cy.visit(`/book/${bookId}`);
  cy.get('[data-testid="quantity-input"]').clear().type(quantity);
  cy.get('[data-testid="add-to-cart"]').click();
  cy.get('[data-testid="cart-notification"]').should('be.visible');
});
```

### Exemplo: Test com Cypress + API Mocking

```javascript
// __tests__/e2e/cypress/e2e/checkout.cy.js

describe('Checkout Flow', () => {
  beforeEach(() => {
    cy.login('12345678901', 'ValidPass123!');
    
    // Mock API responses
    cy.intercept('GET', '/api/v1/cliente/*/enderecos', {
      statusCode: 200,
      body: {
        data: [
          {
            id: 1,
            apelido: 'Casa',
            tipoEndereco: 'ENTREGA',
            logradouro: 'Rua A',
            numero: '123',
            cidade: 'São Paulo',
            estado: 'SP'
          }
        ]
      }
    }).as('getAddresses');

    cy.intercept('POST', '/api/v1/pedido', {
      statusCode: 200,
      body: {
        data: { id: 999, status: 'EM_PROCESSAMENTO' }
      }
    }).as('createOrder');
  });

  it('should complete checkout successfully', () => {
    cy.visit('/cart');
    cy.get('[data-testid="checkout-button"]').click();
    
    // Wait for addresses to load
    cy.waitForAPI('getAddresses');
    cy.get('[data-testid="address-select"]').select('Casa');

    cy.get('[data-testid="shipping-fee"]').should('contain', 'R$ 10,00');
    cy.get('[data-testid="total-price"]').should('be.visible');

    cy.get('[data-testid="payment-method-select"]').select('CARTAO_CREDITO');
    cy.get('[data-testid="card-select"]').select('**** **** **** 1111');

    cy.get('[data-testid="place-order-button"]').click();

    cy.waitForAPI('createOrder');
    cy.url().should('include', '/order-confirmation');
    cy.get('[data-testid="order-confirmation"]').should('be.visible');
  });
});
```

### Selenium — Тестирование Multi-Browser

```python
# __tests__/e2e/selenium/test_login.py

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestAuthentication:
    def setup_method(self):
        self.driver = webdriver.Chrome()
        self.driver.get('http://localhost:5173/login')

    def teardown_method(self):
        self.driver.quit()

    def test_login_success(self):
        wait = WebDriverWait(self.driver, 10)
        
        cpf_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="cpf-input"]'))
        )
        cpf_input.send_keys('12345678901')
        
        password_input = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="password-input"]')
        password_input.send_keys('ValidPass123!')
        
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="login-submit"]')
        submit_btn.click()
        
        wait.until(EC.url_contains('/home'))
        assert '/home' in self.driver.current_url

    def test_login_invalid_cpf(self):
        wait = WebDriverWait(self.driver, 10)
        
        cpf_input = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="cpf-input"]'))
        )
        cpf_input.send_keys('invalid')
        
        submit_btn = self.driver.find_element(By.CSS_SELECTOR, '[data-testid="login-submit"]')
        submit_btn.click()
        
        error_msg = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="error-message"]'))
        )
        assert 'CPF inválido' in error_msg.text
```

### Critérios de Sucesso de Testes

- ✅ Cypress: 100% de cobertura do fluxo de usuário (happy path)
- ✅ Cypress: Testes de erro/validação em cada formulário
- ✅ Selenium: Testes em Chrome, Firefox, Edge
- ✅ Performance: Carregamento <2s em conexão 3G simulada
- ✅ Acessibilidade: WCAG 2.1 level AA (testado com axe-core)

---

## Requisitos Não Funcionais

| ID | Nome | Descrição | Validação |
|-----|------|-----------|-----------|
| RNF0011 | Tempo de resposta | Toda consulta <1s | Lighthouse Performance |
| RNF0031 | Senha forte | ≥8 chars, maiúscula, minúscula, especial | Validator regex |
| RNF0032 | Confirmação de senha | Digitar 2x | Form validation |
| RNF0033 | Criptografia | Enviar via HTTPS | Production only |
| RNF0042 | Carrinho com timeout | Notificação 5min antes de expiração, remover item após timeout (RN0044) | Cypress timer test e polling |
| RNF0043 | Gráfico de linhas | Chart.js renderizado com histórico de vendas | Snapshot test |
| RNF0044 | IA generativa | Chatbot integrado via OpenAI API (Spring AI) | Integration test |
| RNF0046 | Sistema de notificações | Ícone de sino no navbar com badge contagem (§4.12) | Cypress polling test |

### Checklist de Acessibilidade

- [ ] ARIA labels em todos os inputs
- [ ] Cores contrastantes (WCAG AA)
- [ ] Navegação via teclado (Tab, Enter)
- [ ] Screen reader compatibility (NVDA, JAWS)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Teste com axe-core (Cypress plugin)

```javascript
// Axe-core test example
describe('Accessibility', () => {
  it('should not have accessibility violations', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-form"]').injectAxe();
    cy.checkA11y('[data-testid="login-form"]');
  });
});
```

---

## Decisões de Design

| # | Decisão | Justificativa | Notas Contexto Técnico |
|---|---------|---------------|---|
| D1 | React Hooks over Class Components | Mais simples, menor bundle, testes mais diretos | Stack base: React 18+ |
| D2 | Context API over Redux | Projeto de médio porte, não necessita middleware | AuthContext, CartContext em use |
| D3 | Bootstrap 5 CSS Framework | Agilidade, componentes prontos, responsivo | Bootstrap 5.3+ |
| D4 | Axios for HTTP | API simples, interceptadores, cancelamento de requisição | BaseURL: `/api/v1`, JWT header |
| D5 | Notificações In-App | In-app only (Decision D5 no Contexto Técnico) | Entity Notificacao (§4.12) |
| D6 | localStorage para cart | Persistência sem backend (timeout server-side via RN0044) | 30min timeout, configurável |
| D7 | ISO 8601 timestamps | Standard internacional, fácil parse em JS | Sincronizado com backend |
| D8 | Error boundaries | Captura de crashes, UI não quebra | ErrorBoundary.jsx componente |
| D9 | Data-testid attributes | Acesso determinístico em testes, desacoplado de CSS | Cypress acceptance tests |
| D10 | Cypress + Selenium | Cypress para E2E, Selenium para cross-browser validation | FE-031 a FE-037 issues |
| D11 | Docker para dev + prod | Containerização completa (dev, build, testes, produção) | multi-stage, docker-compose |

**Referência ao Contexto Técnico:**
- **D1 (Frete fixo):** Mock fixo de R$ 10,00 em todas as regiões (FE-015, #56)
- **D2 (Ranking):** Exibido read-only em FE-003, calculado como soma total gasto
- **D3 (Parâmetros):** Timeout do carrinho e dias de inativação são configuráveis via admin (RNF0046)
- **D4 (Mock carrão):** Último dígito PAR = reprovado, ÍMPAR = aprovado (FE-017, #58)
- **D5 (IA):** OpenAI GPT via Spring AI (FE-019, #60 — Chatbot flutuante)
- **D6 (Imagens):** Placeholder padrão (`/assets/book-placeholder.png`) para todos os livros
- **D7 (Notificações):** Sistema in-app com ícone de sino e polling (FE-030, #71)
- **D11 (Docker):** Dockerfile multi-stage + docker-compose.yml para dev/build/testes/produção — Criado em FE-001

---

## Prioridades Iniciais

### Sprint 1 — Fundação (1-2 semanas)
- [x] Fase 0: Setup (FE-001, #42)
- [x] Fase 1: Auth (FE-002, #43)
- [x] Fase 2: Account (FE-003 a FE-006, #44-#47)

### Sprint 2 — Vitrine e Busca (1-2 semanas)
- [ ] FE-009: Vitrine / Tela Inicial (#50)
- [ ] FE-010: Busca e Filtros (#51)
- [ ] FE-011: Página do Livro (#52)
- [ ] FE-012: Avaliações (#53)

### Sprint 3 — Carrinho (1 semana)
- [ ] FE-013: Carrinho - Listagem e Edição (#54)
- [ ] FE-014: Timer de Bloqueio e Alertas (#55)

### Sprint 4 — Checkout (1-2 semanas)
- [ ] FE-015: Checkout - Endereço e Frete (#56)
- [ ] FE-016: Checkout - Cupons (#57)
- [ ] FE-017: Checkout - Pagamento (#58)
- [ ] FE-018: Checkout - Confirmação (#59)

### Sprint 5 — Admin Básico (1-2 semanas)
- [ ] FE-020: CRUD Admin - Cadastro de Livros (#61)
- [ ] FE-021: Precificação e Margem (#62)
- [ ] FE-022: Listagem de Livros (#63)
- [ ] FE-023: Gestão de Estoque (#64)
- [ ] FE-024: Painel Logístico (#65)

### Sprint 6 — Admin Avançado (1-2 semanas)
- [ ] FE-025: Consulta de Clientes (#66)
- [ ] FE-026: Workflow de Trocas (#67)
- [ ] FE-027: Moderação de Avaliações (#68)

### Sprint 7 — Analytics e Chatbot (1-2 semanas)
- [ ] FE-019: Widget de Chatbot (#60)
- [ ] FE-028: Dashboard - Vendas por Período (#69)
- [ ] FE-029: Dashboard - Vendas por Região (#70)
- [ ] FE-030: Sistema de Notificações (#71)

### Sprint 8 — Testes E2E (2 semanas)
- [ ] FE-031: Setup do Cypress (#72)
- [ ] FE-032: Testes - Autenticação e Perfil (#73)
- [ ] FE-033: Testes - CRUD de Livros (#74)
- [ ] FE-034: Testes - Fluxo de Compra (#75)
- [ ] FE-035: Testes - Carrinho e Bloqueio (#76)
- [ ] FE-036: Testes - Trocas e Avaliações (#77)
- [ ] FE-037: Testes - Dashboard e Análise (#78)

---

## Notas de Validação com Documentação Técnica

Este PRD foi validado contra:
- ✅ [Contexto_Tecnico_LES_2026.md](../docs/Contexto_Tecnico_LES_2026.md) — Specs de entidades, decisões (D1-D11), convenções de API
- ✅ [DRS_LES_1_2026.md](../docs/DRS_LES_1_2026.md) — Requisitos funcionais (RF0011-RF00065), não-funcionais (RNF0011-RNF0044), regras de negócio (RN0014-RN0062)
- ✅ GitHub Issues #42-#78 — FE-001 a FE-037 com descrições detalhadas e dependências

**Alinhamentos:****Mapeamento completo de todas as 37 issues (FE-001 a FE-037) em 11 sprints + testes
- Todas as RFs mencionadas correspondem aos números do DRS
- Todas as RNs relacionadas estão vinculadas às features específicas
- Decisões de design refletem as decisões do Contexto Técnico (D1-D11)
- Convenções HTTP, Entidades JPA e Regras de Negócio seguem especificações
- BaseURL `/api/v1`, formato JSON, paginação, erros — alinhados
- LocalStorage keys, JWT auth, timestamps ISO 8601 — alinhados

**Pontos ajustados nesta revisão:**
- ❌ → ✅ Tabela de fases agora lista todas as 37 issues com prioridades reais
- ❌ → ✅ RNF0042, RNF0043, RNF0044 descritivos com referências a RN e D* correspondentes
- ❌ → ✅ Adicionado RNF0046 para notificações (Decision D5)
- ❌ → ✅ Sprints revisados com agrupamento lógico e sequência de dependências
- ❌ → ✅ Tabela de mapeamento RF/RN/FE para rastreabilidade completa
- ❌ → ✅ **Adicionado D11 (Docker para dev + prod)** com Dockerfile multi-stage + docker-compose.yml

---

## Comandos Úteis

### Com Docker (Recomendado — Decision D11)

```bash
# Desenvolvimento (hot reload no container na porta 5173)
docker-compose up frontend-dev

# Build da imagem de produção
docker-compose build frontend

# Build no container
docker-compose run --rm frontend npm run build

# Linting no container
docker-compose run --rm frontend npm run lint
docker-compose run --rm frontend npm run lint:fix

# Testes Cypress no container
docker-compose run --rm frontend npm run test:e2e
docker-compose run --rm frontend npm run test:e2e:open

# Format code no container
docker-compose run --rm frontend npm run format

# Entrar no bash do container para executar comandos customizados
docker-compose run --rm frontend bash
```

### Sem Docker (Local / Fallback)

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Linting
npm run lint
npm run lint:fix

# Testes Cypress
npm run test:e2e
npm run test:e2e:open

# Testes Selenium (Python)
pip install -r requirements.txt
pytest __tests__/e2e/selenium/

# Format code
npm run format
```

### Estrutura de Dockerfile e docker-compose.yml

Deverão ser criados em FE-001 (Setup do Projeto) com as seguintes características:

**Dockerfile (multi-stage):**
```dockerfile
# Stage 1: Development
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  frontend-dev:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: development
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
      - ./frontend/__tests__:/app/__tests__
    environment:
      - VITE_API_URL=http://localhost:8080/api/v1
    networks:
      - ecommerce

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: production
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=/api/v1
    networks:
      - ecommerce
    depends_on:
      - backend

networks:
  ecommerce:
    driver: bridge
```

---

## Referências

- [React 18 Docs](https://react.dev)
- [Vite Official](https://vitejs.dev)
- [Bootstrap 5](https://getbootstrap.com)
- [Cypress Docs](https://docs.cypress.io)
- [React Router v6](https://reactrouter.com)
- **[API_CONTRACT.md](../API_CONTRACT.md)** — Contrato da API Backend (FONTE ÚNICA DE VERDADE)

---

**Autor:** GitHub Copilot | Kauê Benk  
**Última atualização:** 1º de março de 2026  
**Status:** ✅ Pronto para iniciação do Ralph Loop

---

## 🔗 Dependência Crítica: Backend API

Este PRD assume que o backend Java seguirá **exatamente** o contrato documentado em [API_CONTRACT.md](../API_CONTRACT.md). A integração frontend-backend dependerá 100% dessa especificação.

**Para o desenvolvedor backend:** Implemente todos os endpoints, validações, formatos de resposta e códigos de erro conforme descrito no API_CONTRACT.md. Assim que o backend estiver rodando (em Docker), o frontend funcionará sem necessidade de ajustes.

**Para o desenvolvedor frontend:** Todo endpoint consumido está documentado no API_CONTRACT.md. Se um endpoint não existir ou retornar em formato diferente, consulte o contrato antes de fazer ajustes.
