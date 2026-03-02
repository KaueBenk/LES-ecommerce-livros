# AGENTS — Operational Learnings

This file documents patterns, tools, and learnings discovered during Ralph Loop iterations.
Update this file as you discover useful patterns or encounter common issues.

## Project Structure

- **Frontend:** React + Vite in `/frontend` directory
- **Package manager:** npm
- **Testing:** Jest / Vitest
- **Linting:** ESLint + Prettier
- **Build tool:** Vite
- **API:** REST with axios

## Common Commands

```bash
# Frontend development
cd frontend && npm install
npm run dev              # Start dev server (port 5173)
npm run build          # Production build
npm run test           # Run tests
npm run test:watch    # Watch mode
npm run lint          # Check code style
npm run format        # Auto-fix formatting

# Docker
docker-compose up     # Start all services
docker-compose down   # Stop services
```

## PRD Structure

User stories in `prd*.json` follow this format:
```json
{
  "id": "US-001",
  "title": "Feature description",
  "description": "Detailed description",
  "acceptanceCriteria": ["Criterion 1", "Criterion 2", ...],
  "priority": 1
}
```

## Patterns & Conventions

### Commits

Use conventional commit format:
- `feat(component): add new feature`
- `fix(api): resolve endpoint issue`
- `test(utils): add unit tests`
- `docs: update readme`

Always include Co-authored-by trailer:
```
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
```

### Testing Strategy

- Unit tests for utilities and hooks
- Component tests for React components (use data-testid)
- E2E tests for user workflows (if applicable)
- Mock external APIs in tests (no actual API calls)

## Known Issues / Blockers

### Cypress E2E Tests in Codespaces
- **Issue**: Cypress requires Xvfb for headless mode, which is not available in GitHub Codespaces
- **Workaround**: Run tests in Docker container with `cypress/included` image or in CI/CD pipeline
- **Resolution**: Tests run successfully in environments with proper dependencies

### ESLint Configuration
- **Solved**: Added Cypress globals configuration to eslint.config.js
- **Pattern**: Use separate config block for Cypress files to define `cy`, `describe`, `it`, etc.

## Notes for Next Iterations

### Code Quality
- PropTypes validation should be added during component creation
- Context files that export both components and hooks trigger React Fast Refresh warnings (non-blocking)
- Avoid calling impure functions like `Date.now()` directly in render - wrap in useMemo/useState

### Build Process
- Build time: ~5-8 seconds for production build
- All 163 modules transform successfully
- Final bundle: 368.67 kB (gzipped: 118.66 kB)
