# API Contract — E-Commerce de Livros (LES 2026)

**Status:** ✅ Pronto para Implementação Backend  
**Última atualização:** 1º de março de 2026  
**Versão da API:** v1  
**Base URL:** `http://localhost:8080/api/v1` (desenvolvimento) | `https://api.domain.com/api/v1` (produção)

---

## 📋 Índice

1. [Convenções Globais](#convenções-globais)
2. [Autenticação](#autenticação)
3. [Módulo de Autenticação (Auth)](#módulo-de-autenticação-auth)
4. [Módulo de Clientes (Cliente)](#módulo-de-clientes-cliente)
5. [Módulo de Livros (Livro)](#módulo-de-livros-livro)
6. [Módulo de Catálogo (Catalog)](#módulo-de-catálogo-catalog)
7. [Módulo de Carrinho (Cart)](#módulo-de-carrinho-cart)
8. [Módulo de Checkout](#módulo-de-checkout)
9. [Módulo de Pedidos (Vendas)](#módulo-de-pedidos-vendas)
10. [Módulo de Trocas](#módulo-de-trocas)
11. [Módulo de Avaliações](#módulo-de-avaliações)
12. [Módulo de Notificações](#módulo-de-notificações)
13. [Módulo de Estoque](#módulo-de-estoque)
14. [Módulo de Admin (Backoffice)](#módulo-de-admin-backoffice)
15. [Módulo de Chat / IA](#módulo-de-chat--ia)
16. [Códigos de Erro](#códigos-de-erro)

---

## Convenções Globais

### Headers Obrigatórios

```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>  [exceto endpoints públicos]
```

### Formato de Resposta

**Sucesso (2xx):**
```json
{
  "statusCode": 200,
  "data": { /* objeto ou array */ },
  "message": "OK"
}
```

**Erro (4xx/5xx):**
```json
{
  "statusCode": 400,
  "message": "Descrição do erro",
  "errors": [
    { "field": "email", "message": "Email inválido" },
    { "field": "senha", "message": "Mínimo 8 caracteres" }
  ]
}
```

### Paginação

Query params: `?page=0&size=20&sort=campo,asc`

**Response:**
```json
{
  "statusCode": 200,
  "data": {
    "content": [ /* items */ ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0,
    "size": 20,
    "hasNext": true,
    "hasPrevious": false
  },
  "message": "OK"
}
```

### Timestamps

Formato: **ISO 8601** (`yyyy-MM-dd'T'HH:mm:ss`)  
Timezone: **UTC**

### Autenticação

**JWT Token:**
- Include no header: `Authorization: Bearer <token>`
- Payload deve conter: `id`, `cpf`, `email`, `role` (ROLE_CLIENTE ou ROLE_ADMIN)
- Expiry: Configurável (recomendado 24h)

---

## Autenticação

### POST /auth/register

**Descrição:** Cadastro de novo cliente

**Request:**
```json
{
  "nome": "João Silva",
  "genero": "MASCULINO",
  "cpf": "12345678901",
  "dataNascimento": "1990-01-15",
  "email": "joao@example.com",
  "senha": "SeNH@123",
  "confirmacaoSenha": "SeNH@123",
  "telefones": [
    { "tipo": "CELULAR", "ddd": "11", "numero": "987654321" }
  ],
  "enderecos": [
    {
      "apelido": "Casa",
      "tipoResidencia": "APARTAMENTO",
      "tipoLogradouro": "RUA",
      "logradouro": "Rua A",
      "numero": "123",
      "bairro": "Centro",
      "cep": "12345-678",
      "cidade": "São Paulo",
      "estado": "SP",
      "pais": "Brasil",
      "tipoEndereco": "AMBOS"
    }
  ]
}
```

**Validações:**
- CPF: Formato válido (11 dígitos), único no sistema
- Email: Válido, único no sistema
- Senha: ≥8 chars, ≥1 maiúscula, ≥1 minúscula, ≥1 caractere especial
- Confirmação: Deve ser igual a senha
- Telefones: ≥1 obrigatório
- Endereço cobrança: ≥1 obrigatório
- Endereço entrega: ≥1 obrigatório

**Response (201 Created):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Cliente cadastrado com sucesso"
}
```

---

### POST /auth/login

**Descrição:** Login de cliente ou admin

**Request:**
```json
{
  "email": "joao@example.com",
  "senha": "SeNH@123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",
    "role": "ROLE_CLIENTE",
    "ranking": 250.50,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login realizado com sucesso"
}
```

**Erro (401):**
```json
{
  "statusCode": 401,
  "message": "Email ou senha inválidos",
  "errors": []
}
```

---

## Módulo de Autenticação (Auth)

### PUT /auth/senha

**Descrição:** Alterar apenas a senha do usuário autenticado

**Headers:** `Authorization: Bearer <token>` (obrigatório)

**Request:**
```json
{
  "senhaAtual": "SeNH@123",
  "novaSenha": "NovaSeNH@456",
  "confirmacaoSenha": "NovaSeNH@456"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Senha alterada com sucesso"
}
```

---

## Módulo de Clientes (Cliente)

### GET /clientes/perfil

**Descrição:** Obter dados do cliente autenticado

**Headers:** `Authorization: Bearer <token>` (obrigatório)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",
    "genero": "MASCULINO",
    "dataNascimento": "1990-01-15",
    "ranking": 250.50,
    "ativo": true,
    "telefones": [
      { "id": 1, "tipo": "CELULAR", "ddd": "11", "numero": "987654321" }
    ]
  },
  "message": "OK"
}
```

---

### PUT /clientes/perfil

**Descrição:** Atualizar dados pessoais do cliente

**Headers:** `Authorization: Bearer <token>` (obrigatório)

**Request:**
```json
{
  "nome": "João Silva Santos",
  "genero": "MASCULINO",
  "dataNascimento": "1990-01-15",
  "telefones": [
    { "id": 1, "tipo": "CELULAR", "ddd": "11", "numero": "987654322" }
  ]
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Perfil atualizado com sucesso"
}
```

---

### GET /clientes/enderecos

**Descrição:** Listar endereços do cliente autenticado

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "apelido": "Casa",
      "tipoResidencia": "APARTAMENTO",
      "tipoLogradouro": "RUA",
      "logradouro": "Rua A",
      "numero": "123",
      "bairro": "Centro",
      "cep": "12345-678",
      "cidade": "São Paulo",
      "estado": "SP",
      "pais": "Brasil",
      "tipoEndereco": "COBRANCA"
    }
  ],
  "message": "OK"
}
```

---

### POST /clientes/enderecos

**Descrição:** Adicionar novo endereço

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "apelido": "Trabalho",
  "tipoResidencia": "CASA",
  "tipoLogradouro": "AVENIDA",
  "logradouro": "Av. Paulista",
  "numero": "1000",
  "bairro": "Bela Vista",
  "cep": "01310-100",
  "cidade": "São Paulo",
  "estado": "SP",
  "pais": "Brasil",
  "tipoEndereco": "ENTREGA"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": { "id": 2, "success": true },
  "message": "Endereço adicionado com sucesso"
}
```

---

### PUT /clientes/enderecos/{id}

**Descrição:** Atualizar endereço existente

**Headers:** `Authorization: Bearer <token>`

**Request:** (mesmo do POST)

**Response (200):** (sucesso)

---

### DELETE /clientes/enderecos/{id}

**Descrição:** Remover endereço

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Endereço removido com sucesso"
}
```

---

### GET /clientes/cartoes

**Descrição:** Listar cartões de crédito do cliente

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "ultimosDigitos": "1234",
      "bandeira": { "id": 1, "nome": "Visa" },
      "nomeImpresso": "JOAO SILVA",
      "preferencial": true
    }
  ],
  "message": "OK"
}
```

---

### POST /clientes/cartoes

**Descrição:** Adicionar novo cartão de crédito

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "numero": "1234567890123456",
  "nomeImpresso": "JOAO SILVA",
  "bandeira": "1",
  "codigoSeguranca": "123"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": { "id": 1, "success": true },
  "message": "Cartão adicionado com sucesso"
}
```

---

### PATCH /clientes/cartoes/{id}/preferencial

**Descrição:** Definir cartão como preferencial

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Cartão definido como preferencial"
}
```

---

### DELETE /clientes/cartoes/{id}

**Descrição:** Remover cartão de crédito

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Cartão removido com sucesso"
}
```

---

### GET /clientes/transacoes

**Descrição:** Listar histórico de pedidos (transações) do cliente

**Headers:** `Authorization: Bearer <token>`

**Query:** `?page=0&size=20&sort=dataPedido,desc`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "numeroNota": "PED-001",
        "dataPedido": "2026-03-01T10:30:00",
        "status": "ENTREGUE",
        "valorTotal": 150.50,
        "itens": [
          {
            "livroId": 5,
            "titulo": "Clean Code",
            "quantidade": 1,
            "valorUnitario": 89.90
          }
        ]
      }
    ],
    "totalElements": 10,
    "totalPages": 1,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### GET /clientes/cupons-troca

**Descrição:** Listar cupons de troca disponíveis do cliente

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "valor": 50.00,
      "utilizado": false,
      "dataGeracao": "2026-02-15T14:20:00",
      "pedidoOrigem": 1
    }
  ],
  "message": "OK"
}
```

---

## Módulo de Livros (Livro)

### GET /livros

**Descrição:** Listar livros com filtros e paginação

**Query Parameters:**
- `page=0` (padrão)
- `size=20` (padrão)
- `sort=titulo,asc` (asc/desc)
- `titulo=Clean` (filtro LIKE)
- `autorId=1` (filtro por ID do autor)
- `categoriaId=1` (filtro por ID de categoria)
- `ano=2020` (filtro por ano exato)
- `isbn=1234567890` (filtro por ISBN exato)
- `ativo=true` (padrão)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "codigo": "LIV-001",
        "titulo": "Clean Code",
        "autor": { "id": 1, "nome": "Robert C. Martin" },
        "categorias": [
          { "id": 1, "nome": "Programação" }
        ],
        "ano": 2008,
        "editora": { "id": 1, "nome": "Prentice Hall" },
        "edicao": "1ª",
        "isbn": "9780132350884",
        "numeroPaginas": 464,
        "sinopse": "Descrição do livro...",
        "altura": 24.0,
        "largura": 17.0,
        "profundidade": 3.0,
        "peso": 0.5,
        "valorVenda": 89.90,
        "codigoBarras": "9780132350884",
        "ativo": true,
        "estoque": {
          "quantidadeTotal": 50,
          "quantidadeDisponivel": 45,
          "quantidadeBloqueada": 5
        }
      }
    ],
    "totalElements": 100,
    "totalPages": 5,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### GET /livros/{id}

**Descrição:** Obter detalhes de um livro específico

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "codigo": "LIV-001",
    "titulo": "Clean Code",
    "autor": { "id": 1, "nome": "Robert C. Martin" },
    "categorias": [
      { "id": 1, "nome": "Programação" }
    ],
    "ano": 2008,
    "editora": { "id": 1, "nome": "Prentice Hall" },
    "edicao": "1ª",
    "isbn": "9780132350884",
    "numeroPaginas": 464,
    "sinopse": "Descrição do livro...",
    "altura": 24.0,
    "largura": 17.0,
    "profundidade": 3.0,
    "peso": 0.5,
    "valorVenda": 89.90,
    "codigoBarras": "9780132350884",
    "ativo": true,
    "estoque": {
      "quantidadeTotal": 50,
      "quantidadeDisponivel": 45,
      "quantidadeBloqueada": 5
    }
  },
  "message": "OK"
}
```

---

### GET /livros/{id}/avaliacoes

**Descrição:** Listar avaliações aprovadas de um livro

**Query:** `?page=0&size=10&aprovada=true`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "cliente": { "id": 1, "nome": "João Silva" },
        "estrelas": 5,
        "texto": "Excelente livro, muito recomendado!",
        "dataAvaliacao": "2026-02-20T15:30:00",
        "aprovada": true
      }
    ],
    "totalElements": 5,
    "totalPages": 1,
    "currentPage": 0,
    "size": 10
  },
  "message": "OK"
}
```

---

### POST /livros/{id}/avaliacoes

**Descrição:** Criar avaliação de um livro (cliente autenticado que comprou)

**Headers:** `Authorization: Bearer <token>` (obrigatório)

**Request:**
```json
{
  "estrelas": 4,
  "texto": "Bom livro, muito útil para aprender."
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": { "id": 2, "success": true },
  "message": "Avaliação enviada para moderação"
}
```

---

## Módulo de Catálogo (Catalog)

### GET /catalogo/autores

**Descrição:** Listar autores para filtros/selects

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    { "id": 1, "nome": "Robert C. Martin" },
    { "id": 2, "nome": "Joshua Bloch" }
  ],
  "message": "OK"
}
```

---

### GET /catalogo/categorias

**Descrição:** Listar categorias para filtros/selects

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    { "id": 1, "nome": "Programação" },
    { "id": 2, "nome": "Desenvolvimento Web" }
  ],
  "message": "OK"
}
```

---

### GET /catalogo/editoras

**Descrição:** Listar editoras

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    { "id": 1, "nome": "Prentice Hall" },
    { "id": 2, "nome": "O'Reilly" }
  ],
  "message": "OK"
}
```

---

### GET /catalogo/bandeiras

**Descrição:** Listar bandeiras de cartão de crédito

**Response (200):**
```json
{
  "statusCode": 200,
  "data": [
    { "id": 1, "nome": "Visa" },
    { "id": 2, "nome": "Mastercard" },
    { "id": 3, "nome": "American Express" }
  ],
  "message": "OK"
}
```

---

## Módulo de Carrinho (Cart)

### GET /carrinho

**Descrição:** Obter carrinho do cliente autenticado

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "itens": [
      {
        "id": 1,
        "livroId": 5,
        "titulo": "Clean Code",
        "quantidade": 2,
        "valorUnitario": 89.90,
        "subtotal": 179.80,
        "bloqueadoEm": "2026-03-01T10:30:00"
      }
    ],
    "totalItens": 2,
    "valorSubtotal": 179.80,
    "valorFrete": 10.00,
    "valorTotal": 189.80,
    "expiresAt": "2026-03-01T11:30:00"
  },
  "message": "OK"
}
```

---

### POST /carrinho/itens

**Descrição:** Adicionar item ao carrinho

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "livroId": 5,
  "quantidade": 2
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "livroId": 5,
    "titulo": "Clean Code",
    "quantidade": 2,
    "valorUnitario": 89.90,
    "bloqueadoEm": "2026-03-01T10:30:00"
  },
  "message": "Item adicionado ao carrinho"
}
```

**Erro (400):**
```json
{
  "statusCode": 400,
  "message": "Quantidade solicitada indisponível",
  "errors": []
}
```

---

### PUT /carrinho/itens/{id}

**Descrição:** Atualizar quantidade de item no carrinho

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "quantidade": 3
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Item atualizado"
}
```

---

### DELETE /carrinho/itens/{id}

**Descrição:** Remover item do carrinho

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Item removido do carrinho"
}
```

---

### DELETE /carrinho

**Descrição:** Limpar todo o carrinho

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Carrinho limpo"
}
```

---

## Módulo de Checkout

### POST /checkout/frete

**Descrição:** Calcular frete (fixo em R$ 10,00 para qualquer endereço)

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "enderecoId": 1
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "valorFrete": 10.00,
    "enderecoId": 1
  },
  "message": "Frete calculado"
}
```

---

### POST /checkout/validar-cupons

**Descrição:** Validar e calcular desconto de cupons

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "cupomsTroca": [1, 2],
  "cupomPromocional": "PROMO123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "cupomsTrocaValor": 50.00,
    "cupomPromocionalValor": 25.00,
    "desconto": 75.00,
    "restante": 114.80
  },
  "message": "Cupons validados"
}
```

---

### POST /checkout/finalizar

**Descrição:** Finalizar compra e processar pagamento

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "enderecoEntregaId": 1,
  "cupomsTroca": [1],
  "cupomPromocional": "PROMO123",
  "formasPagamento": [
    {
      "tipo": "CARTAO_CREDITO",
      "cartaoId": 1,
      "valor": 114.80
    }
  ]
}
```

**Response (201 — Aprovado):**
```json
{
  "statusCode": 201,
  "data": {
    "pedidoId": 1,
    "numero": "PED-001",
    "status": "APROVADA",
    "valorTotal": 189.80,
    "dataCompra": "2026-03-01T10:45:00",
    "dataEntregaPrevista": "2026-03-08T00:00:00"
  },
  "message": "Compra finalizada com sucesso"
}
```

**Response (402 — Reprovado):**
```json
{
  "statusCode": 402,
  "message": "Pagamento recusado pela operadora",
  "errors": [
    {
      "cartaoUltimosDigitos": "1234",
      "motivo": "CardBlocked"
    }
  ]
}
```

---

## Módulo de Pedidos (Vendas)

### GET /pedidos

**Descrição:** Listar pedidos do cliente autenticado

**Headers:** `Authorization: Bearer <token>`

**Query:** `?page=0&size=20&status=ENTREGUE`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "numero": "PED-001",
        "dataPedido": "2026-03-01T10:45:00",
        "status": "ENTREGUE",
        "valorFrete": 10.00,
        "valorTotal": 189.80,
        "itens": [
          {
            "id": 1,
            "livroId": 5,
            "titulo": "Clean Code",
            "quantidade": 2,
            "valorUnitario": 89.90
          }
        ]
      }
    ],
    "totalElements": 3,
    "totalPages": 1,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### GET /pedidos/{id}

**Descrição:** Obter detalhes de um pedido específico

**Headers:** `Authorization: Bearer <token>`

**Response (200):** (detalhado)

---

## Módulo de Trocas

### POST /pedidos/{id}/trocas

**Descrição:** Solicitar troca de itens de um pedido

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "itens": [
    {
      "itemPedidoId": 1,
      "quantidade": 1,
      "justificativa": "Livro com páginas danificadas"
    }
  ]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "id": 1,
    "status": "EM_TROCA",
    "dataSolicitacao": "2026-03-01T11:00:00"
  },
  "message": "Solicitação de troca enviada"
}
```

---

## Módulo de Avaliações

### POST /livros/{id}/avaliacoes

**Descrição:** (Verificar seção de Módulo de Livros)

---

## Módulo de Notificações

### GET /notificacoes

**Descrição:** Listar notificações do cliente autenticado

**Headers:** `Authorization: Bearer <token>`

**Query:** `?page=0&size=10&lida=false`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "titulo": "Pedido Entregue",
        "mensagem": "Seu pedido PED-001 foi entregue",
        "lida": false,
        "dataCriacao": "2026-03-01T14:30:00"
      }
    ],
    "totalElements": 5,
    "totalPages": 1,
    "currentPage": 0,
    "size": 10
  },
  "message": "OK"
}
```

---

### GET /notificacoes/nao-lidas/count

**Descrição:** Contar notificações não lidas (para badge do ícone de sino)

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "count": 3 },
  "message": "OK"
}
```

---

### PATCH /notificacoes/{id}/lida

**Descrição:** Marcar notificação como lida

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Notificação marcada como lida"
}
```

---

## Módulo de Estoque

### GET /admin/estoque/entradas

**Descrição:** Listar histórico de entradas de estoque

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?livroId=5&page=0&size=20`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "livroId": 5,
        "titulo": "Clean Code",
        "quantidade": 100,
        "valorCusto": 50.00,
        "fornecedorId": 1,
        "fornecedor": "Fornecedor A",
        "dataEntrada": "2026-02-01"
      }
    ],
    "totalElements": 10,
    "totalPages": 1,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### POST /admin/estoque/entradas

**Descrição:** Registrar entrada de estoque

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Request:**
```json
{
  "livroId": 5,
  "quantidade": 50,
  "valorCusto": 49.90,
  "fornecedorId": 1,
  "dataEntrada": "2026-03-01"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": { "id": 2, "success": true },
  "message": "Entrada de estoque registrada"
}
```

---

## Módulo de Admin (Backoffice)

### GET /admin/livros

**Descrição:** Listar livros para CRUD admin

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?page=0&size=20&ativo=true&titulo=Clean`

**Response (200):** (mesma estrutura de /livros, mas com dados completos para edição)

---

### POST /admin/livros

**Descrição:** Criar novo livro

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Request:**
```json
{
  "titulo": "Clean Code",
  "autorId": 1,
  "editoraId": 1,
  "edicao": "1ª",
  "ano": 2008,
  "isbn": "9780132350884",
  "numeroPaginas": 464,
  "sinopse": "Descrição...",
  "altura": 24.0,
  "largura": 17.0,
  "profundidade": 3.0,
  "peso": 0.5,
  "codigoBarras": "9780132350884",
  "grupoPrecificacaoId": 1,
  "categoriaIds": [1, 2]
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": { "id": 1, "codigo": "LIV-001" },
  "message": "Livro criado com sucesso"
}
```

---

### PUT /admin/livros/{id}

**Descrição:** Atualizar livro existente

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Request:** (mesma estrutura de POST)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Livro atualizado com sucesso"
}
```

---

### PATCH /admin/livros/{id}/ativar

**Descrição:** Ativar livro inativo

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Request:**
```json
{
  "motivoAtivacao": "Volta ao estoque",
  "categoriaAtivacaoId": 1
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Livro ativado"
}
```

---

### PATCH /admin/livros/{id}/inativar

**Descrição:** Inativar livro ativo

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Request:**
```json
{
  "motivoInativacao": "Fora de mercado",
  "categoriaInativacaoId": 2
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "success": true },
  "message": "Livro inativado"
}
```

---

### GET /admin/pedidos

**Descrição:** Listar pedidos para gestão logística

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?status=EM_PROCESSAMENTO&page=0&size=20`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "numero": "PED-001",
        "dataPedido": "2026-03-01T10:45:00",
        "status": "EM_PROCESSAMENTO",
        "cliente": { "id": 1, "nome": "João Silva", "email": "joao@example.com" },
        "valorTotal": 189.80,
        "itens": [ /* ... */ ]
      }
    ],
    "totalElements": 5,
    "totalPages": 1,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### PATCH /admin/pedidos/{id}/despachar

**Descrição:** Marcar pedido como despachado (EM_TRANSITO)

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "status": "EM_TRANSITO" },
  "message": "Pedido despachado"
}
```

---

### PATCH /admin/pedidos/{id}/entregar

**Descrição:** Confirmar entrega do pedido (ENTREGUE)

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "status": "ENTREGUE" },
  "message": "Pedido entregue"
}
```

---

### GET /admin/clientes

**Descrição:** Listar clientes para gestão admin

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?nome=João&cpf=&email=&ativo=true&page=0&size=20`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "nome": "João Silva",
        "cpf": "12345678901",
        "email": "joao@example.com",
        "ranking": 250.50,
        "ativo": true,
        "dataCadastro": "2025-12-01T08:00:00"
      }
    ],
    "totalElements": 50,
    "totalPages": 3,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### GET /admin/clientes/{id}

**Descrição:** Obter detalhes completos de um cliente

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "cpf": "12345678901",
    "email": "joao@example.com",
    "genero": "MASCULINO",
    "dataNascimento": "1990-01-15",
    "ranking": 250.50,
    "ativo": true,
    "enderecos": [ /* ... */ ],
    "cartoes": [ /* ... */ ],
    "transacoes": [ /* ... */ ]
  },
  "message": "OK"
}
```

---

### GET /admin/avaliacoes

**Descrição:** Listar avaliações pendentes de moderação

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?aprovada=false&page=0&size=20`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "livroId": 5,
        "livroTitulo": "Clean Code",
        "clienteId": 1,
        "clienteNome": "João Silva",
        "estrelas": 5,
        "texto": "Excelente livro!",
        "dataAvaliacao": "2026-03-01T12:00:00",
        "aprovada": false
      }
    ],
    "totalElements": 10,
    "totalPages": 1,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### PATCH /admin/avaliacoes/{id}/aprovar

**Descrição:** Aprovar avaliação

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "aprovada": true },
  "message": "Avaliação aprovada"
}
```

---

### PATCH /admin/avaliacoes/{id}/rejeitar

**Descrição:** Rejeitar avaliação

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "aprovada": false },
  "message": "Avaliação rejeitada"
}
```

---

### GET /admin/trocas

**Descrição:** Listar trocas para gestão

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?status=EM_TROCA&page=0&size=20`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "content": [
      {
        "id": 1,
        "pedidoId": 1,
        "numeroNota": "PED-001",
        "status": "EM_TROCA",
        "dataSolicitacao": "2026-03-01T13:00:00",
        "itens": [
          {
            "id": 1,
            "livroTitulo": "Clean Code",
            "quantidade": 1,
            "justificativa": "Páginas danificadas"
          }
        ]
      }
    ],
    "totalElements": 3,
    "totalPages": 1,
    "currentPage": 0,
    "size": 20
  },
  "message": "OK"
}
```

---

### PATCH /admin/trocas/{id}/autorizar

**Descrição:** Autorizar troca (TROCA_AUTORIZADA)

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "status": "TROCA_AUTORIZADA" },
  "message": "Troca autorizada"
}
```

---

### PATCH /admin/trocas/{id}/confirmar-recebimento

**Descrição:** Confirmar recebimento de itens para troca

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Request:**
```json
{
  "itens": [
    {
      "id": 1,
      "retornarAoEstoque": true
    }
  ]
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": { "status": "TROCADO" },
  "message": "Troca finalizada, cupom gerado"
}
```

---

### GET /admin/analise/vendas

**Descrição:** Análise de vendas por período (Dashboard)

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?dataInicio=2026-01-01&dataFim=2026-03-01&agrupamento=CATEGORIA`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "periodo": {
      "dataInicio": "2026-01-01",
      "dataFim": "2026-03-01"
    },
    "series": [
      {
        "nome": "Programação",
        "data": [
          { "mes": "2026-01", "quantidade": 15, "valor": 1500.00 },
          { "mes": "2026-02", "quantidade": 12, "valor": 1200.00 },
          { "mes": "2026-03", "quantidade": 8, "valor": 800.00 }
        ]
      },
      {
        "nome": "Web Design",
        "data": [
          { "mes": "2026-01", "quantidade": 10, "valor": 900.00 },
          { "mes": "2026-02", "quantidade": 14, "valor": 1260.00 },
          { "mes": "2026-03", "quantidade": 9, "valor": 810.00 }
        ]
      }
    ]
  },
  "message": "OK"
}
```

---

### GET /admin/analise/vendas-regiao

**Descrição:** Análise de vendas por região (estado)

**Headers:** `Authorization: Bearer <ADMIN_TOKEN>`

**Query:** `?dataInicio=2026-01-01&dataFim=2026-03-01`

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "periodo": {
      "dataInicio": "2026-01-01",
      "dataFim": "2026-03-01"
    },
    "estados": [
      { "estado": "SP", "quantidade": 45, "valor": 4500.00 },
      { "estado": "RJ", "quantidade": 32, "valor": 3200.00 },
      { "estado": "MG", "quantidade": 28, "valor": 2800.00 }
    ]
  },
  "message": "OK"
}
```

---

## Módulo de Chat / IA

### POST /chat

**Descrição:** Enviar mensagem para chatbot IA

**Headers:** `Authorization: Bearer <token>` (opcional)

**Request:**
```json
{
  "mensagem": "Qual livro você recomenda sobre programação?",
  "sessionId": "uuid-aqui-opcional"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "resposta": "Recomendo o livro 'Clean Code' de Robert C. Martin. É essencial para todo desenvolvedor...",
    "sessionId": "uuid-aqui",
    "timestamp": "2026-03-01T14:50:00"
  },
  "message": "OK"
}
```

---

## Códigos de Erro

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Requisição inválida",
  "errors": [
    { "field": "email", "message": "Email inválido" }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Token inválido ou expirado",
  "errors": []
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Acesso negado. Permissão insuficiente.",
  "errors": []
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Recurso não encontrado",
  "errors": []
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "CPF já cadastrado",
  "errors": []
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Erro interno do servidor",
  "errors": []
}
```

---

## 🚀 Próximos Passos

1. **Backend:** Implementar todos os endpoints conforme este contrato
2. **Frontend:** Todos os serviços já estão estruturados para consumir estes endpoints
3. **Testes:** Validar com Cypress/Selenium após o backend estar rodando
4. **Docker Compose:** Ambos frontend e backend rodarão juntos com Docker

---

**Autor:** GitHub Copilot | Kauê Benk  
**Última atualização:** 1º de março de 2026  
**Status:** ✅ Pronto para Implementação
