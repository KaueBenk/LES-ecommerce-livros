#!/bin/bash

echo "🔍 Testando visibilidade de logs do Docker"
echo "=========================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Verificando se o backend está rodando...${NC}"
if docker ps | grep -q "les-backend"; then
    echo -e "${GREEN}✓ Backend está rodando${NC}"
else
    echo "❌ Backend não está rodando. Execute: docker compose up -d"
    exit 1
fi

echo ""
echo -e "${YELLOW}2. Últimas 30 linhas de log do backend:${NC}"
echo "=========================================="
docker compose logs --tail=30 backend

echo ""
echo -e "${YELLOW}3. Seguindo logs em tempo real (Ctrl+C para parar):${NC}"
echo "=========================================="
docker compose logs -f backend

