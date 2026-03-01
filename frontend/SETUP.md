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

## Docker

### Development (hot reload)

```bash
docker-compose up frontend
# Accessible at http://localhost:5173
```

### Production

```bash
docker-compose --profile production up frontend-prod
# Accessible at http://localhost:80
```
