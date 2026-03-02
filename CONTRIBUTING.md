# Contributing Guide — LES E-Commerce de Livros

Thank you for contributing! Please read this guide before opening a pull request.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Started](#getting-started)
3. [Coding Standards](#coding-standards)
4. [Component Pattern](#component-pattern)
5. [Commit Message Guide](#commit-message-guide)
6. [Pull Request Guidelines](#pull-request-guidelines)
7. [Code Review Checklist](#code-review-checklist)
8. [API Contract Reference](#api-contract-reference)

---

## Prerequisites

- Node.js 20+ / npm 11+
- Docker & Docker Compose (optional but recommended)
- Read [`frontend/SETUP.md`](frontend/SETUP.md) before making frontend changes

---

## Getting Started

```bash
# Clone and install
git clone <repo-url>
cd LES-ecommerce-livros/frontend
npm install

# Start the dev server
npm run dev

# Run linter
npm run lint

# Run e2e tests (requires dev server to be running)
npm run test:e2e
```

---

## Coding Standards

### General

- Language: **JavaScript (ES2020+)** with JSX for React components
- Formatter: **Prettier** — config in `frontend/.prettierrc`
- Linter: **ESLint** — config in `frontend/eslint.config.js`
- Never commit code that fails `npm run lint`

### Style Rules

| Rule | Value |
|---|---|
| Indentation | 2 spaces |
| Quotes | Single quotes (`'`) in JS; double in JSX attributes |
| Semicolons | Required |
| Trailing commas | ES5 (objects, arrays, params) |
| Max line length | 100 characters |
| End of line | LF (`\n`) |

### Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| React components | PascalCase | `BookCard.jsx` |
| Custom hooks | camelCase, `use` prefix | `useCart.js` |
| Services | camelCase, `Service` suffix | `catalogService.js` |
| CSS classes | Bootstrap utility + BEM | `book-card__title` |
| Constants | UPPER_SNAKE_CASE | `MAX_CART_ITEMS` |

### File Organisation

- One component per file
- Place new components in the appropriate `src/components/<domain>/` sub-folder
- Pages go in `src/pages/`
- Shared logic goes in `src/hooks/` (custom hooks) or `src/utils/` (pure helpers)
- All API calls go through `src/services/`; do **not** call `fetch`/`axios` directly in components

---

## Component Pattern

Every presentational component must follow this structure:

```jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * BookCard
 * @component
 * @description Displays a book cover, title, author, and price in a Bootstrap card.
 * @param {Object}  props
 * @param {Object}  props.book          - Book data object.
 * @param {string}  props.book.titulo   - Book title.
 * @param {string}  props.book.autor    - Author name.
 * @param {number}  props.book.preco    - Price in BRL.
 * @param {string}  props.book.capa     - Cover image URL.
 * @param {Function} props.onAddToCart  - Callback fired when "Add to cart" is clicked.
 * @returns {JSX.Element}
 */
const BookCard = ({ book, onAddToCart }) => {
  return (
    <div className="card h-100 shadow-sm" data-testid="book-card">
      <img src={book.capa} className="card-img-top" alt={book.titulo} />
      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{book.titulo}</h5>
        <p className="card-text text-muted small">{book.autor}</p>
        <p className="card-text fw-bold mt-auto">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
            book.preco
          )}
        </p>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onAddToCart(book)}
          aria-label={`Adicionar ${book.titulo} ao carrinho`}
        >
          Adicionar ao carrinho
        </button>
      </div>
    </div>
  );
};

BookCard.propTypes = {
  book: PropTypes.shape({
    titulo: PropTypes.string.isRequired,
    autor: PropTypes.string.isRequired,
    preco: PropTypes.number.isRequired,
    capa: PropTypes.string,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
};

export default BookCard;
```

**Key rules:**

- Always define `PropTypes` for every prop
- Always add a `data-testid` attribute to the root element for Cypress selectors
- Always add `aria-label` / `role` attributes for interactive elements
- Keep components **pure** — no direct API calls, no side effects outside `useEffect`
- Extract reusable logic into custom hooks

---

## Commit Message Guide

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, missing semicolons (no logic change) |
| `refactor` | Code change that is neither a fix nor a feature |
| `test` | Adding or fixing tests |
| `chore` | Build process, dependency updates |

### Examples

```
feat(cart): add item quantity controls to CartSidebar

fix(auth): redirect to /login on token expiry

docs: update SETUP.md with Docker run commands

test(checkout): add Cypress spec for address validation step
```

- Use the **imperative mood** ("add", not "added" or "adds")
- Keep the subject line under **72 characters**
- Reference issues with `Closes #<issue-number>` in the footer when applicable

---

## Pull Request Guidelines

1. **Branch from `main`** with a descriptive name:
   - `feat/cart-quantity-controls`
   - `fix/login-redirect`
   - `docs/setup-readme`

2. **Keep PRs small** — one logical change per PR

3. **Fill in the PR template** (description, motivation, screenshots for UI changes)

4. **All checks must pass** before requesting review:
   - `npm run lint` — no errors
   - `npm run test:e2e` — all Cypress specs green

5. **At least one approval** is required before merging

6. **Squash merge** into `main` to keep history clean

---

## Code Review Checklist

Use this checklist when reviewing a PR:

### Correctness
- [ ] Logic is correct and handles edge cases
- [ ] No hardcoded credentials, tokens, or secrets
- [ ] API calls match the contract in [`API_CONTRACT.md`](API_CONTRACT.md)
- [ ] Error states are handled (loading spinner, error message)

### Code Quality
- [ ] Component follows the [component pattern](#component-pattern)
- [ ] PropTypes are defined for all props
- [ ] No direct API calls in components — services are used
- [ ] No unused imports or variables
- [ ] Lint passes (`npm run lint`)

### Accessibility & UX
- [ ] Interactive elements have `aria-label` or `role` attributes
- [ ] Keyboard navigation works for new UI elements
- [ ] Loading and empty states are displayed

### Tests
- [ ] New features have a corresponding Cypress spec or fixture update
- [ ] `data-testid` attributes are present on key elements
- [ ] All existing tests still pass

### Documentation
- [ ] JSDoc comment added/updated for the component or function
- [ ] `SETUP.md` updated if new env vars or commands are introduced

---

## API Contract Reference

All API endpoints, request/response shapes, and authentication requirements are documented in [`API_CONTRACT.md`](API_CONTRACT.md).

Before implementing a new API integration:

1. Confirm the endpoint exists in `API_CONTRACT.md`
2. Match the exact request/response schema
3. Handle the documented error codes (400, 401, 403, 404, 409, 422, 500)
4. Add a fixture in `frontend/cypress/fixtures/` for the mock response used in tests

See [`docs/MOCKING_GUIDE.md`](docs/MOCKING_GUIDE.md) for mock data conventions used in Cypress tests.
