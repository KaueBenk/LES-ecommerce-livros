# Copilot Instructions — LES E-Commerce de Livros

## ⚠️ MANDATORY: Requirements Document (DRS)

**ALL code changes MUST comply with requirements in `docs/DRS_LES_1_2026.md`.**

This document specifies:
- **Functional Requirements (RF)**: Features like cart management, checkout, admin operations, analytics, reviews
- **Non-Functional Requirements (RNF)**: Performance (1s max response), logging, password strength, cart TTL with notifications
- **Business Rules (RN)**: Stock validation, payment logic, coupon usage, item blocking/unblocking, status transitions, exchange procedures

Before implementing ANY feature, consult the DRS to:
1. Identify the requirement ID (e.g., RF0031, RNF0042, RN0044)
2. Understand the complete specification and related business rules
3. Verify all edge cases are covered
4. Ensure admin features, validations, and state transitions match exactly

**Key DRS Rules to Remember:**
- Cart items expire after 30 minutes (parametrized) with 5-minute warning notification (RN0044)
- Stock must be validated at both cart addition and checkout (RN0031, RN0032)
- Payment must use couplons optimally—no wasting coupons (RN0036)
- Only ENTREGUE orders can request exchanges (RN0043)
- Soft-delete with transactional link validation for clients
- All write operations must log: timestamp, user, changed data (RNF0012)

## Build, Test & Lint

### Frontend (React + Vite)

All commands run from `frontend/`:

```bash
# Development
npm run dev              # Dev server at http://localhost:5173
npm run build            # Production build → dist/
npm run lint             # ESLint check

# Unit tests (Vitest + Testing Library)
npm run test             # Run all unit tests once
npm run test:watch       # Watch mode
npm run test:ui          # Interactive UI dashboard
npx vitest run src/store/cartContext.test.jsx   # Run single test file

# E2E tests (Cypress — requires dev server running)
npm run test:e2e         # Headless
npm run test:e2e:open    # Interactive UI
npx cypress run --spec cypress/e2e/auth.cy.js  # Run single spec
```

**Environment variables:**
- `VITE_API_URL`: Backend API URL (default: `http://localhost:8080`)
- `CYPRESS_BASE_URL`: Cypress test base URL (default: `http://localhost:5173`)
- `CYPRESS_API_BASE_URL`: Cypress API base URL (default: `http://localhost:8080/api/v1`)

**Docker:**
```bash
docker-compose up frontend    # Dev with hot reload at http://localhost:5173
```

### Backend (Spring Boot)

All commands run from `backend/lesecommercelivros/`:

```bash
./mvnw clean install         # Build & test
./mvnw spring-boot:run       # Start server at http://localhost:8080
./mvnw test                  # Run tests
```

**Docker:**
```bash
docker-compose up backend    # Start backend server
```

## Architecture

This is a **React 19 + Vite 7** bookstore frontend and **Spring Boot 3.2.3** backend for the LES (Laboratório de Engenharia de Software) 2026 course — a Brazilian university software engineering project.

### State & Data Flow

- **Global state** uses React Context (no Redux): `AuthProvider` → `CartProvider` → `NotificationProvider`, nested in that order in `App.jsx`.
- **API layer**: Each domain has a service module in `src/services/` (e.g., `catalogService.js`, `cartService.js`). All services use a shared Axios instance (`api.js`) that auto-injects the JWT Bearer token and handles 401 → logout.
- **Response unwrapping**: The backend wraps responses as `{ data: { ... } }`. Services extract via `response.data.data`.
- **Demo mode**: Setting `VITE_DEMO_MODE=true` activates `demoInterceptor.js`, which intercepts all API calls with mock data — no backend required.

### Routing

React Router v6 with lazy-loaded pages via `React.lazy()` + `Suspense`. Protected routes wrap pages in `<ProtectedRoute>` (customer) or `<ProtectedRoute adminOnly>` (admin). Route constants live in `src/utils/constants.js`.

### Cart

Cart state persists to `localStorage` with a 30-minute TTL (`CART_TTL_MS`). The `useCartTimer` hook provides per-item countdown timers with warning/expired callbacks.

### Backend (Spring Boot)

- **Language**: Java 17
- **API Base Path**: `/api/v1`
- **Database**: PostgreSQL (configured via `application.properties`)
- **Authentication**: JWT Bearer token (auto-injected by frontend Axios interceptor)
- **Key Services**: `AdminService`, `AdminWorkflowService`, `CartService`, `ClienteService`, `OrderService`, etc.
- **Controllers**: `AdminController` (admin endpoints), `ClienteController` (customer endpoints), `CartController`, `OrderController`, etc.
- **Admin Features**: Soft delete with transactional block validation, client search with coalesce+cast filters (prevents Postgres `lower(bytea)` null errors)

## Key Conventions

### Code Style

- **Prettier**: single quotes, semicolons, trailing commas (es5), 100-char width, 2-space indent.
- **No TypeScript** — use PropTypes for component prop validation with JSDoc `@component` / `@description` comments.
- **No CSS modules or styled-components** — use Bootstrap 5 utility classes directly in JSX. Global custom styles go in `src/styles/`.

### Path Aliases (vite.config.js)

Use these import aliases instead of relative paths:

```js
import Component from '@components/common/Header';
import api from '@services/api';
import { useAuth } from '@hooks/useAuth';
import { ROUTES } from '@utils/constants';
import '@styles/main.scss';
```

### Service Module Pattern

```js
const fooService = {
  getItems: async (params) => {
    const response = await api.get('/items', { params });
    return response.data.data;
  },
};
export default fooService;
```

### Component Pattern

```jsx
const MyComponent = ({ title, onAction }) => { /* ... */ };

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onAction: PropTypes.func,
};

export default MyComponent;
```

### Testing

- **Unit tests**: Vitest + `@testing-library/react`. Test files co-located as `ComponentName.test.jsx`.
- **E2E tests**: Cypress specs in `cypress/e2e/`. Use `data-testid` attributes for selectors.
- **Custom Cypress commands**: `cy.login()`, `cy.loginByAPI()`, `cy.mockAPI()`, `cy.addToCart()`, `cy.logout()`, `cy.mobile()`, `cy.tablet()`, `cy.desktop()`.

### Brazilian Locale

All user-facing text, validators, and formatters are Portuguese (pt-BR). Key utilities in `src/utils/`:

- **validators.js**: `isValidCpf()`, `isValidEmail()`, `validatePassword()`, `isValidCep()`, `isValidPhone()`
- **formatters.js**: `formatCurrency()` (BRL), `formatCpf()`, `formatCep()`, `formatPhone()`, `formatDate()` (pt-BR)
- **constants.js**: Enums for `ORDER_STATUS`, `GENDER_OPTIONS`, `ADDRESS_TYPES`, `BRAZIL_STATES`, `CREDIT_CARD_BRANDS`, etc.

### Business Rules

- **D8 — Card mock**: Credit card ending in an even digit = DECLINED; odd digit = APPROVED.
- **Shipping**: Fixed R$10.00.
- **Cart TTL**: 30 minutes (configurable via admin parameter).
- **Ranking**: BRONZE → PRATA → OURO → PLATINA, based on total approved purchase amount.

### API Contract

Backend base path: `/api/v1`. Pagination: `?page=0&size=20&sort=campo,asc`. Full contract in `docs/API_CONTRACT.md`.

## Testing Guide

### Unit Tests (Vitest)

- **Location**: Colocated as `ComponentName.test.jsx` next to component
- **Setup**: Global test setup in `src/test/setup.js` provides DOM matchers
- **Command**: Run `npm run test` or `npm run test:watch` from `frontend/`
- **Example**: `npx vitest run src/store/cartContext.test.jsx`

### E2E Tests (Cypress)

- **Location**: Specs in `cypress/e2e/`
- **Selectors**: Use `data-testid` attributes (not class names or element types)
- **Support File**: `cypress/support/e2e.js` — contains custom commands like `cy.login()`, `cy.addToCart()`, etc.
- **Fixtures**: Mock data in `cypress/fixtures/` (follow pt-BR mocking conventions in `docs/MOCKING_GUIDE.md`)
- **Config**: `cypress.config.js` — default desktop viewport (1280×720), retries in CI, custom timeouts
- **Run**: `npm run test:e2e` (headless) or `npm run test:e2e:open` (interactive)

### Admin Endpoints (Key Test Patterns)

- **DELETE `/api/v1/admin/clientes/{id}`**: Blocked if client has transactional links (orders, cart). Frontend uses `data-testid="delete-client-<id>"` for delete action.
- **GET `/api/v1/admin/clientes/search`**: Filters by `nome`, `cpf`, `email` with coalesce+cast to handle nulls safely.
