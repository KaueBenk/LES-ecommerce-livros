#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

DEV_PORT="${DEV_PORT:-5174}"
BASE_URL="${BASE_URL:-http://localhost:${DEV_PORT}}"
API_URL="${API_URL:-http://localhost:8080}"
CYPRESS_API_BASE_URL="${CYPRESS_API_BASE_URL:-${API_URL}/api/v1}"
BROWSER="${BROWSER:-electron}"

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Iniciando backend (Docker)..."
cd "$ROOT_DIR"
docker-compose up -d backend

echo "==> Iniciando frontend (Vite)..."
cd "$FRONTEND_DIR"
VITE_API_URL="$API_URL" npm run dev -- --host --port "$DEV_PORT" > /tmp/les-frontend.log 2>&1 &
FRONTEND_PID=$!

cd "$ROOT_DIR"

echo "==> Aguarde o frontend subir em $BASE_URL"
read -r -p "Pressione Enter para iniciar os testes..."

SPECS=(
  "cypress/e2e/checkout-new-card-address.cy.js"
  "cypress/e2e/sales-checkout-consultation-4entrega.cy.js"
  "cypress/e2e/checkout.cy.js"
  "cypress/e2e/exchanges-reviews.cy.js"
  "cypress/e2e/cart-timer.cy.js"
)

for spec in "${SPECS[@]}"; do
  echo "==> Rodando $spec"
  cd "$FRONTEND_DIR"
  CYPRESS_BASE_URL="$BASE_URL" \
  CYPRESS_API_BASE_URL="$CYPRESS_API_BASE_URL" \
  npx cypress run --headed --browser "$BROWSER" --spec "$spec"

  cd "$ROOT_DIR"
  read -r -p "Pressione Enter para o proximo teste..."
done

echo "==> Concluido."
