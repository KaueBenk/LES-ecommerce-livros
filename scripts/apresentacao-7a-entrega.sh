#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

DEV_PORT="${DEV_PORT:-5174}"
BASE_URL="${BASE_URL:-http://localhost:${DEV_PORT}}"
API_URL="${API_URL:-http://localhost:8080}"
CYPRESS_API_BASE_URL="${CYPRESS_API_BASE_URL:-${API_URL}/api/v1}"
BROWSER="${BROWSER:-electron}"
AUTO="${AUTO:-0}"
HEADED="${HEADED:-1}"

CYPRESS_UI_ARGS=()
if [[ "$HEADED" == "1" ]]; then
  CYPRESS_UI_ARGS=(--headed)
fi

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  echo "ERRO: Docker Compose não encontrado (use 'docker compose' ou instale 'docker-compose')." >&2
  exit 1
fi

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "==> Iniciando backend (Docker)..."
cd "$ROOT_DIR"
"${COMPOSE[@]}" up -d backend

echo "==> Aguardando backend em $API_URL..."
until curl -s "$CYPRESS_API_BASE_URL/livros?page=0&size=1" > /dev/null; do
  sleep 2
done
echo "==> Backend pronto!"

echo "==> Iniciando frontend (Vite)..."
cd "$FRONTEND_DIR"
VITE_API_URL="$API_URL" npm run dev -- --host --port "$DEV_PORT" > /tmp/les-frontend.log 2>&1 &
FRONTEND_PID=$!

cd "$ROOT_DIR"

echo "==> Aguardando frontend em $BASE_URL..."
until curl -s "$BASE_URL" > /dev/null; do
  if [[ -n "${FRONTEND_PID:-}" ]] && ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    echo "ERRO: Frontend não iniciou corretamente. Log em /tmp/les-frontend.log" >&2
    tail -n 200 /tmp/les-frontend.log || true
    exit 1
  fi
  sleep 2
done
echo "==> Frontend pronto!"

if [[ "$AUTO" != "1" ]]; then
  read -r -p "Pressione Enter para iniciar a sequencia de 10 testes obrigatorios..."
fi

FAILED_TESTS=()
PASSED_TESTS=()
SPECS=(
  "cypress/e2e/entrega7/01-cliente-realiza-compra.cy.js"
  "cypress/e2e/entrega7/02-cliente-pagamento-combinado.cy.js"
  "cypress/e2e/entrega7/03-cliente-novo-cartao-endereco.cy.js"
  "cypress/e2e/entrega7/04-usuario-solicita-troca.cy.js"
  "cypress/e2e/entrega7/05-admin-confirma-pagamento.cy.js"
  "cypress/e2e/entrega7/06-admin-aceita-nega-troca.cy.js"
  "cypress/e2e/entrega7/07-admin-em-transporte.cy.js"
  "cypress/e2e/entrega7/08-admin-confirma-recebimento.cy.js"
  "cypress/e2e/entrega7/09-sistema-gera-cupom.cy.js"
  "cypress/e2e/entrega7/10-admin-confirma-entregue.cy.js"
)

for i in "${!SPECS[@]}"; do
  spec="${SPECS[$i]}"
  FILENAME=$(basename "$spec")
  SCENARIO_NAME="${FILENAME%.cy.js}"
  
  echo "----------------------------------------------------------------------"
  echo "==> EXECUTANDO CENARIO: $SCENARIO_NAME"
  echo "----------------------------------------------------------------------"
  
  cd "$FRONTEND_DIR"
  CYPRESS_BASE_URL="$BASE_URL" \
  CYPRESS_API_BASE_URL="$CYPRESS_API_BASE_URL" \
  npx cypress run ${CYPRESS_UI_ARGS[@]:+"${CYPRESS_UI_ARGS[@]}"} --browser "$BROWSER" --spec "$spec"
  
  EXIT_CODE=$?
  if [[ $EXIT_CODE -eq 0 ]]; then
    PASSED_TESTS+=("$SCENARIO_NAME")
    echo "✓ SUCESSO: $SCENARIO_NAME"
  else
    FAILED_TESTS+=("$SCENARIO_NAME")
    echo "✗ FALHA: $SCENARIO_NAME (exit code: $EXIT_CODE)"
  fi

  cd "$ROOT_DIR"
  echo ""
  if [[ "$AUTO" != "1" ]]; then
    if (( i + 1 < ${#SPECS[@]} )); then
      next_spec="${SPECS[$i+1]}"
      read -r -p "Pressione Enter para o proximo cenario ($next_spec)..."
    else
      read -r -p "Pressione Enter para finalizar..."
    fi
  fi
done

echo ""
echo "======================================================================"
echo "==> RESUMO DOS TESTES"
echo "======================================================================"
echo "✓ Aprovados: ${#PASSED_TESTS[@]}"
for test in "${PASSED_TESTS[@]}"; do
  echo "  ✓ $test"
done

if [[ ${#FAILED_TESTS[@]} -gt 0 ]]; then
  echo ""
  echo "✗ Falhados: ${#FAILED_TESTS[@]}"
  for test in "${FAILED_TESTS[@]}"; do
    echo "  ✗ $test"
  done
fi
echo "======================================================================"

echo "==> Concluido."
