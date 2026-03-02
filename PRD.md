# PRD — E-Commerce de Livros (LES 2026) — Ralph Loop — Frontend

**Data:** 1º de Março de 2026  
**Versão:** 1.0  
**Objetivo:** Implementação completa de interface do cliente para e-commerce de livros, com foco em testabilidade via Cypress e Selenium.

---

## Sumário

1. [Visão Geral do Ralph Loop](#visão-geral-do-ralph-loop)
2. [Stack Técnico](#stack-técnico)
3. [Arquitetura de Componentes](#arquitetura-de-componentes)
4. [Fase 0: Setup do Projeto (FE-001)](#fase-0-setup-do-projeto-fe-001)
5. [Fase 1: Autenticação (FE-002)](#fase-1-autenticação-fe-002)
6. [Fase 2: Dados Pessoais (FE-003)](#fase-2-dados-pessoais-fe-003)
7. [Fase 3+: Fluxos de Negócio](#fase-3-fluxos-de-negócio)
8. [Estratégia de Testes (Cypress + Selenium)](#estratégia-de-testes-cypress--selenium)
9. [Requisitos Não Funcionais](#requisitos-não-funcionais)
10. [Decisões de Design](#decisões-de-design)

---

## Visão Geral do Ralph Loop

O **Ralph Loop** é um ciclo iterativo de desenvolvimento que segue as fases:

1. **Plan (Planejar):** Definir requisitos baseado em issues e documentação
2. **Implement (Implementar):** Criar componentes/features com testes em mente
3. **Review (Revisar):** Validar testes funcionam, código é limpo
4. **Loop (Iterar):** Feedback → próxima fase

### Fases do Frontend

| Fase | Issue | Titulo | Prioridade | Status |
|------|-------|--------|-----------|--------|
| 0 | #42 | [FE-001] Setup do Projeto (Vite + Bootstrap + Router) | Alta | Not Started |
| 1 | #43 | [FE-002] Formulários de Autenticação | Alta | Not Started |
| 2 | #44 | [FE-003] Minha Conta - Dados Pessoais | Média | Not Started |
| 3+ | - | Catálogo, Carrinho, Checkout, Admin | Médias | Backlog |

---

## Stack Técnico

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

### Estrutura de Diretórios

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
- [ ] Criar `services/api.js` com axios instance
- [ ] Criar layout base (Header, Footer, Navbar)
- [ ] Criar `App.jsx` com rotas principais
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
| RNF0042 | Carrinho com timeout | Notificação 5min antes | Cypress timer test |
| RNF0043 | Gráfico de linhas | Chart.js renderizado | Snapshot test |
| RNF0044 | IA generativa | Chatbot integrado | Integration test |

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

| # | Decisão | Justificativa |
|---|---------|---------------|
| D1 | React Hooks over Class Components | Mais simples, menor bundle, testes mais diretos |
| D2 | Context API over Redux | Projeto de médio porte, não necessita middleware |
| D3 | Bootstrap 5 CSS Framework | Agilidade, componentes prontos, responsivo |
| D4 | Axios for HTTP | API simples, interceptadores, cancelamento de requisição |
| D5 | Cypress for E2E | Melhor DX, testes mais legíveis, não requer Selenium |
| D6 | Selenium para cross-browser | Validação em Chrome, Firefox, Edge simultaneamente |
| D7 | Data-testid attributes | Acesso determinístico em testes, desacoplado de CSS |
| D8 | localStorage para cart | Persistência sem backend (timeout server-side) |
| D9 | ISO 8601 timestamps | Standard internacional, fácil parse em JS |
| D10 | Error boundaries | Captura de crashes, UI não quebra |

---

## Prioridades Iniciais

### Sprint 1 — Fundação (1-2 semanas)
- [x] Fase 0: Setup (FE-001)
- [x] Fase 1: Auth (FE-002)
- [x] Fase 2: Account (FE-003)

### Sprint 2 — Catálogo
- [ ] Home page com featured books
- [ ] Catálogo com filtros
- [ ] Detalhes de livro com avaliações

### Sprint 3 — Compra
- [ ] Carrinho de compras
- [ ] Checkout (endereço + pagamento)
- [ ] Histórico de compras

### Sprint 4 — Admin + IA
- [ ] Dashboard administrativo
- [ ] Gestão de pedidos
- [ ] Chatbot com IA

---

## Comandos Úteis

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

---

## Referências

- [React 18 Docs](https://react.dev)
- [Vite Official](https://vitejs.dev)
- [Bootstrap 5](https://getbootstrap.com)
- [Cypress Docs](https://docs.cypress.io)
- [React Router v6](https://reactrouter.com)

---

**Autor:** GitHub Copilot | Kauê Benk  
**Última atualização:** 1º de março de 2026  
**Status:** ✅ Pronto para iniciação do Ralph Loop
