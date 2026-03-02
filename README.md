# LES E-Commerce de Livros

React-based bookstore e-commerce frontend built for the LES (Laboratório de Engenharia de Software) 2026 course project.

## Quick Start

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Or with Docker:

```bash
docker-compose up frontend   # http://localhost:5173
```

## Documentation

| Document | Description |
|---|---|
| [frontend/SETUP.md](frontend/SETUP.md) | Installation, environment variables, dev server, build, tests, Docker, troubleshooting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Coding standards, component patterns, commit guide, PR guidelines, code review checklist |
| [API_CONTRACT.md](API_CONTRACT.md) | All backend API endpoints, request/response schemas, and authentication |
| [docs/MOCKING_GUIDE.md](docs/MOCKING_GUIDE.md) | Cypress mock data conventions |
| [docs/Contexto_Tecnico_LES_2026.md](docs/Contexto_Tecnico_LES_2026.md) | Technical context and architecture |

## Tech Stack

- **React 19** + **Vite 7**
- **Bootstrap 5.3** + Sass
- **React Router v6**
- **Axios** with JWT interceptor
- **Cypress** for end-to-end tests

## Available Commands

```bash
cd frontend

npm run dev          # Start development server (hot reload)
npm run build        # Production build → dist/
npm run lint         # ESLint check
npm run test:e2e     # Cypress end-to-end tests (headless)
npm run test:e2e:open # Cypress interactive UI
npm run preview      # Preview production build locally
```

## Project Structure

```
frontend/
├── src/
│   ├── components/   # Reusable UI components organised by domain
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # One component per route
│   ├── services/     # API service layer (axios)
│   ├── store/        # React Context providers
│   ├── styles/       # SCSS files
│   └── utils/        # Pure helpers and constants
├── cypress/          # End-to-end test specs and fixtures
├── Dockerfile        # Multi-stage: development + production (nginx)
└── SETUP.md          # Full setup guide
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards, commit message format, PR guidelines, and the code review checklist.
