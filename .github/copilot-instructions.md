# Copilot Instructions — LES E-Commerce de Livros

## Build, Test & Lint

All commands run from `frontend/`:

```bash
npm run dev              # Dev server at http://localhost:5173
npm run dev:demo         # Dev with mock API (no backend needed)
npm run build            # Production build → dist/
npm run lint             # ESLint

# Unit tests (Vitest + Testing Library)
npm run test             # Run all unit tests
npm run test:watch       # Watch mode
npx vitest run src/store/cartContext.test.jsx   # Run a single test file

# E2E tests (Cypress — requires dev server running)
npm run test:e2e         # Headless
npm run test:e2e:open    # Interactive UI
npx cypress run --spec cypress/e2e/auth.cy.js  # Run a single spec
```

Docker: `docker-compose up frontend` (dev with hot reload).

## Architecture

This is a **React 19 + Vite 7** bookstore frontend for a Brazilian university software engineering course. The backend is a separate Spring Boot API (not in this repo).

### State & Data Flow

- **Global state** uses React Context (no Redux): `AuthProvider` → `CartProvider` → `NotificationProvider`, nested in that order in `App.jsx`.
- **API layer**: Each domain has a service module in `src/services/` (e.g., `catalogService.js`, `cartService.js`). All services use a shared Axios instance (`api.js`) that auto-injects the JWT Bearer token and handles 401 → logout.
- **Response unwrapping**: The backend wraps responses as `{ data: { ... } }`. Services extract via `response.data.data`.
- **Demo mode**: Setting `VITE_DEMO_MODE=true` activates `demoInterceptor.js`, which intercepts all API calls with mock data — no backend required.

### Routing

React Router v6 with lazy-loaded pages via `React.lazy()` + `Suspense`. Protected routes wrap pages in `<ProtectedRoute>` (customer) or `<ProtectedRoute adminOnly>` (admin). Route constants live in `src/utils/constants.js`.

### Cart

Cart state persists to `localStorage` with a 30-minute TTL (`CART_TTL_MS`). The `useCartTimer` hook provides per-item countdown timers with warning/expired callbacks.

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
