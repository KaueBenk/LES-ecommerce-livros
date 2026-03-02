# Frontend Setup Guide

## Overview

React frontend for LES Livraria e-commerce, built with Vite + Bootstrap 5 + React Router v6.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.x | UI framework |
| Vite | 7.x | Build tool + dev server |
| Bootstrap | 5.3 | CSS framework |
| React Router | 6.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Sass | Latest | SCSS preprocessing |

## Getting Started

### Prerequisites

- Node.js 20+ (or use Docker)
- npm 11+

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
# Dev server runs at http://localhost:5173 with hot reload
```

### Build

```bash
npm run build
# Output in dist/
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── common/        # Header, Footer, Navbar, ErrorBoundary, LoadingSpinner
│   ├── auth/          # ProtectedRoute, LoginForm, RegisterForm
│   ├── customer/      # ProfileForm, AddressForm, CreditCardForm
│   ├── catalog/       # BookCard, BookGrid, SearchBar
│   ├── cart/          # CartIcon, CartSidebar, CartItemRow
│   ├── checkout/      # CheckoutFlow, DeliveryAddressStep
│   ├── admin/         # OrderManagement, AnalyticsDashboard
│   └── reviews/       # ReviewForm, ReviewList
├── hooks/             # useAuth, useCart, useFetch, useNotification, usePageTitle
├── pages/             # One file per route
├── services/          # api.js (axios), authService, catalogService, etc.
├── store/             # AuthContext, CartContext, NotificationContext
├── styles/            # main.scss, variables.scss, forms.scss
└── utils/             # validators, formatters, constants, helpers
```

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Backend API base URL |

## API Configuration

The axios instance in `src/services/api.js` is configured with:

- **Base URL:** `/api/v1` (proxied to `VITE_API_URL` in dev)
- **JWT interceptor:** Attaches `Authorization: Bearer <token>` automatically
- **401 handler:** Clears auth and redirects to `/login`

## Testing

### End-to-End Tests (Cypress)

Tests run against the dev server using mock API responses — no live backend required.

**Headless (CI mode):**

```bash
npm run test:e2e
```

**Interactive UI:**

```bash
npm run test:e2e:open
```

> The dev server (`npm run dev`) must be running before executing Cypress tests.
> Fixtures live in `cypress/fixtures/`. See [`docs/MOCKING_GUIDE.md`](../docs/MOCKING_GUIDE.md) for mock data conventions.

## Docker

### Development (hot reload)

```bash
# From the repo root:
docker-compose up frontend
# Accessible at http://localhost:5173
```

**Run a one-off command inside the container:**

```bash
docker-compose run --rm frontend npm run lint
docker-compose run --rm frontend npm run build
```

### Production

```bash
docker-compose --profile production up frontend-prod
# Accessible at http://localhost:80
```

**Build the production image manually:**

```bash
docker build --target production -t les-frontend:prod ./frontend
docker run -p 80:80 les-frontend:prod
```

## Troubleshooting

### `npm install` fails with peer dependency errors

Ensure you are using Node.js **20+** and npm **11+**:

```bash
node -v  # should be >= 20
npm -v   # should be >= 11
```

Use [nvm](https://github.com/nvm-sh/nvm) to switch versions:

```bash
nvm install 20 && nvm use 20
```

### Dev server can't connect to the backend API

Check that `VITE_API_URL` in `.env.local` points to your running backend:

```env
VITE_API_URL=http://localhost:8080
```

If the backend isn't running you will see `Network Error` in the browser console. The frontend remains usable for UI exploration; only data-fetching features will fail.

### Docker container exits immediately

The development target expects the source to be mounted. Run from the **repo root** (where `docker-compose.yml` lives):

```bash
docker-compose up frontend
```

### Cypress tests time out or fail to find elements

1. Confirm the dev server is running: `npm run dev`
2. Confirm `baseUrl` in `cypress.config.js` matches the server address (`http://localhost:5173`)
3. Run with `--browser electron` if the default browser causes issues:

```bash
npx cypress run --browser electron
```

### Port 5173 already in use

Kill the process occupying the port:

```bash
lsof -ti :5173 | xargs kill -9
```

Or choose a different port in `vite.config.js` (`server.port`).
