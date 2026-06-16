# LES E-Commerce de Livros

Este é o repositório do projeto da disciplina de Laboratório de Engenharia de Software (LES) 2026.
O projeto consiste em um E-commerce de Livros completo com frontend em React/Vite e backend em Java/Spring Boot.

## 🚀 Como Inicializar o Projeto

A maneira mais rápida de rodar o projeto e suas dependências é utilizando o **Docker**.

### 1. Iniciar Banco de Dados e Backend
Na raiz do projeto, execute o comando abaixo para iniciar o PostgreSQL e a API:
```bash
docker compose up -d db backend
```
> **Nota sobre o Banco de Dados:** A inicialização do banco é automática. Assim que o backend sobe, o Spring Boot utiliza o arquivo `data.sql` (localizado em `backend/lesecommercelivros/src/main/resources/`) para criar e popular todas as tabelas.

O backend ficará disponível em `http://localhost:8080`.

### 2. Iniciar o Frontend
Em um terminal separado, instale as dependências e rode o servidor de desenvolvimento:
```bash
cd frontend
npm install
npm run dev
```
> O frontend ficará disponível e pronto para uso em `http://localhost:5173`.

*(Opcional)* Se preferir rodar o frontend via Docker, basta usar o profile de dev:
```bash
docker compose --profile dev up -d
```

## 🧪 Testes Automatizados das Entregas

Os testes E2E solicitados pelo professor estão organizados nas pastas de suas respectivas entregas (`frontend/cypress/e2e/entrega6` e `frontend/cypress/e2e/entrega7`).

Para abrir a interface gráfica do Cypress e executá-los manualmente:
```bash
cd frontend
npm run test:e2e:open
```

**Script de Apresentação Automatizado:**
Para facilitar a apresentação da 7ª Entrega, disponibilizamos um script que valida se o ambiente está rodando e executa a sequência de 10 testes obrigatórios de ponta a ponta automaticamente:
```bash
./scripts/apresentacao-7a-entrega.sh
```

