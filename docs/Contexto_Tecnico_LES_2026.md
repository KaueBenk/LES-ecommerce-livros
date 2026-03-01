# Contexto Técnico — E-Commerce de Livros (LES 2026)

Este documento contém todas as especificações técnicas, decisões de projeto e specs de entidades necessárias para implementação. Deve ser lido por qualquer agente de IA antes de implementar uma tarefa.

---

## 1. Stack Tecnológico

| Camada | Tecnologia |
|---|---|
| Backend | Java 17+, Spring Boot 3.x, Spring Data JPA (Hibernate), Spring Security (JWT) |
| Frontend | React 18+ (Vite), Bootstrap 5, React Router, Chart.js, Cypress (testes E2E) |
| Banco de Dados | PostgreSQL 15+ (tabelas geradas pelo ORM, sem DDL manual) |
| IA | OpenAI API (GPT) via Spring AI |
| ORM | Hibernate com `ddl-auto: update` — entidades Java definem o schema |

## 2. Decisões de Projeto

| # | Decisão | Detalhe |
|---|---|---|
| D1 | Cálculo de frete | Mock fixo: **R$ 10,00** para qualquer endereço |
| D2 | Ranking do cliente | Valor numérico = **total gasto acumulado** (soma de todas as compras aprovadas em R$) |
| D3 | Parâmetro de inativação automática | Período sem vendas, **configurável pelo admin** via tabela `parametro_sistema` (chave: `DIAS_INATIVACAO_AUTOMATICA`) |
| D4 | Timeout do carrinho | **30 minutos** por padrão, **configurável pelo admin** via `parametro_sistema` (chave: `TIMEOUT_CARRINHO_MINUTOS`) |
| D5 | Notificações | **In-app** somente. Entity `Notificacao` persistida no banco, exibida no frontend como ícone de sino com badge de contagem |
| D6 | IA generativa | **OpenAI API** (GPT-4o-mini ou GPT-4o), integrada via **Spring AI**. Há orçamento disponível |
| D7 | Imagens de livros | **Sem upload de imagem**. Usar imagem placeholder padrão para todos os livros (ex: `/assets/book-placeholder.png`) |
| D8 | Mock operadora de cartão | Regra determinística: cartões com **último dígito PAR = REPROVADO**, **ímpar = APROVADO** |

## 3. Convenções de API

- **Base path:** `/api/v1`
- **Formato:** JSON (request e response)
- **Autenticação:** Bearer JWT no header `Authorization`
- **Perfis:** `ROLE_ADMIN` e `ROLE_CLIENTE`
- **Paginação:** `?page=0&size=20&sort=campo,asc`
- **Erros:** `{ "status": 400, "message": "...", "errors": [...] }`
- **Timestamps:** ISO 8601 (`yyyy-MM-dd'T'HH:mm:ss`)

## 4. Especificações de Entidades JPA

### 4.1 Domínios Base
```
Categoria { id: Long, nome: String, descricao: String }
Autor { id: Long, nome: String }
Editora { id: Long, nome: String }
Fornecedor { id: Long, nome: String, cnpj: String }
Bandeira { id: Long, nome: String } // Visa, Mastercard, etc.
GrupoPrecificacao { id: Long, nome: String, margemLucro: BigDecimal } // % de lucro
CategoriaInativacao { id: Long, descricao: String } // inclui "FORA_DE_MERCADO"
CategoriaAtivacao { id: Long, descricao: String }
```

### 4.2 Livro (RN0011, RN0012, RN0013)
```
Livro {
  id: Long (auto, unique - RNF0021)
  titulo: String (required)
  autor: Autor @ManyToOne (required)
  categorias: Set<Categoria> @ManyToMany (required, pode ter múltiplas - RN0012)
  ano: Integer (required)
  editora: Editora @ManyToOne (required)
  edicao: String (required)
  isbn: String (required, unique)
  numeroPaginas: Integer (required)
  sinopse: String @Lob (required)
  altura: Double (required, cm)
  largura: Double (required, cm)
  peso: Double (required, kg)
  profundidade: Double (required, cm)
  grupoPrecificacao: GrupoPrecificacao @ManyToOne (required)
  codigoBarras: String (required)
  valorVenda: BigDecimal (calculado: maior custo dos itens em estoque * (1 + margemLucro/100))
  ativo: Boolean (default true)
  motivoInativacao: String (nullable, obrigatório ao inativar)
  categoriaInativacao: CategoriaInativacao @ManyToOne (nullable)
  motivoAtivacao: String (nullable, obrigatório ao ativar)
  categoriaAtivacao: CategoriaAtivacao @ManyToOne (nullable)
}
```

### 4.3 Cliente (RN0026)
```
Cliente {
  id: Long (auto, unique - RNF0035)
  genero: Enum(MASCULINO, FEMININO, OUTRO) (required)
  nome: String (required)
  dataNascimento: LocalDate (required)
  cpf: String (required, unique, validar formato)
  email: String (required, unique)
  senha: String (required, BCrypt, ≥8 chars, maiúsculas+minúsculas+especiais - RNF0031)
  ranking: BigDecimal (default 0, = soma total gasto em compras aprovadas)
  ativo: Boolean (default true)
  telefones: List<Telefone> @OneToMany (required, ≥1)
  enderecos: List<Endereco> @OneToMany (required, ≥1 cobrança + ≥1 entrega)
  cartoes: List<CartaoCredito> @OneToMany
}

Telefone { id, tipo: Enum(FIXO,CELULAR), ddd: String, numero: String }
```

### 4.4 Endereço (RN0023)
```
Endereco {
  id: Long
  apelido: String (frase curta identificadora - RF0026)
  tipoResidencia: Enum(CASA, APARTAMENTO, OUTRO) (required)
  tipoLogradouro: Enum(RUA, AVENIDA, TRAVESSA, ALAMEDA, OUTRO) (required)
  logradouro: String (required)
  numero: String (required)
  bairro: String (required)
  cep: String (required)
  cidade: String (required)
  estado: String (required, UF 2 chars)
  pais: String (required, default "Brasil")
  observacoes: String (optional)
  tipoEndereco: Enum(COBRANCA, ENTREGA, AMBOS) (required)
  cliente: Cliente @ManyToOne
}
```

### 4.5 Cartão de Crédito (RN0024, RN0025)
```
CartaoCredito {
  id: Long
  numero: String (required)
  nomeImpresso: String (required)
  bandeira: Bandeira @ManyToOne (required, deve ser cadastrada no sistema)
  codigoSeguranca: String (required)
  preferencial: Boolean (default false, apenas 1 por cliente)
  cliente: Cliente @ManyToOne
}
```

### 4.6 Estoque
```
EntradaEstoque {
  id: Long
  livro: Livro @ManyToOne (required)
  quantidade: Integer (required, > 0 - RN0061)
  valorCusto: BigDecimal (required, > 0 - RN0062)
  fornecedor: Fornecedor @ManyToOne (required)
  dataEntrada: LocalDate (required - RNF0064)
}

Estoque { // View consolidada ou tabela atualizada por triggers da aplicação
  id: Long
  livro: Livro @OneToOne
  quantidadeTotal: Integer
  quantidadeBloqueada: Integer // itens em carrinhos ativos
  quantidadeDisponivel: Integer // = total - bloqueada
}
```

### 4.7 Carrinho
```
CarrinhoCompra {
  id: Long
  cliente: Cliente @ManyToOne
  itens: List<ItemCarrinho> @OneToMany
  ultimaAtualizacao: LocalDateTime // marca o timestamp do último item adicionado
}

ItemCarrinho {
  id: Long
  livro: Livro @ManyToOne
  quantidade: Integer
  bloqueadoEm: LocalDateTime // timestamp do bloqueio no estoque
  carrinho: CarrinhoCompra @ManyToOne
}
```

### 4.8 Pedido e Pagamento
```
Pedido {
  id: Long
  cliente: Cliente @ManyToOne
  itens: List<ItemPedido> @OneToMany
  enderecoEntrega: String @Lob // JSON snapshot do endereço no momento da compra
  status: Enum(EM_PROCESSAMENTO, APROVADA, REPROVADA, EM_TRANSITO, ENTREGUE, EM_TROCA, TROCA_AUTORIZADA, TROCADO)
  valorFrete: BigDecimal (fixo R$ 10.00)
  valorTotal: BigDecimal
  formasPagamento: List<FormaPagamento> @OneToMany
  dataPedido: LocalDateTime
}

ItemPedido {
  id: Long
  livro: Livro @ManyToOne
  quantidade: Integer
  valorUnitario: BigDecimal
  pedido: Pedido @ManyToOne
}

FormaPagamento {
  id: Long
  tipo: Enum(CARTAO_CREDITO, CUPOM_TROCA, CUPOM_PROMOCIONAL)
  valor: BigDecimal
  cartaoCredito: CartaoCredito @ManyToOne (nullable)
  cupom: Long // ID do cupom usado (nullable)
  pedido: Pedido @ManyToOne
}
```

### 4.9 Cupons
```
CupomTroca {
  id: Long
  cliente: Cliente @ManyToOne
  valor: BigDecimal
  utilizado: Boolean (default false)
  dataGeracao: LocalDateTime
  pedidoOrigem: Pedido @ManyToOne // pedido que gerou o cupom
}

CupomPromocional {
  id: Long
  codigo: String (unique)
  valor: BigDecimal
  valido: Boolean
  dataValidade: LocalDate
}
```

### 4.10 Troca
```
SolicitacaoTroca {
  id: Long
  pedido: Pedido @ManyToOne
  itensDevolvidos: List<ItemTroca> @OneToMany
  status: Enum(EM_TROCA, TROCA_AUTORIZADA, TROCADO)
  dataSolicitacao: LocalDateTime
}

ItemTroca {
  id: Long
  itemPedido: ItemPedido @ManyToOne
  quantidade: Integer
  justificativa: String
  retornarAoEstoque: Boolean (definido pelo admin ao confirmar recebimento)
}
```

### 4.11 Avaliação
```
Avaliacao {
  id: Long
  livro: Livro @ManyToOne
  cliente: Cliente @ManyToOne
  estrelas: Integer (1-5, required)
  texto: String (required)
  aprovada: Boolean (default false = pendente de moderação)
  dataAvaliacao: LocalDateTime
}
```

### 4.12 Notificação e Log
```
Notificacao {
  id: Long
  cliente: Cliente @ManyToOne
  titulo: String
  mensagem: String
  lida: Boolean (default false)
  dataCriacao: LocalDateTime
}

LogTransacao { // preenchido automaticamente por EntityListener
  id: Long
  entidade: String // nome da classe
  entidadeId: Long
  operacao: Enum(INSERT, UPDATE)
  dadosAnteriores: String @Lob // JSON
  dadosNovos: String @Lob // JSON
  usuario: String // username do JWT
  dataHora: LocalDateTime
}
```

### 4.13 Parâmetro do Sistema
```
ParametroSistema {
  id: Long
  chave: String (unique) // ex: TIMEOUT_CARRINHO_MINUTOS, DIAS_INATIVACAO_AUTOMATICA
  valor: String
  descricao: String
}
// Seed inicial: TIMEOUT_CARRINHO_MINUTOS=30, DIAS_INATIVACAO_AUTOMATICA=90
```

## 5. Regras de Negócio — Referência Rápida

| ID | Regra | Lógica |
|---|---|---|
| RN0014 | Margem de lucro | Preço só pode ser alterado dentro da margem do grupo. Abaixo da margem exige `ROLE_ADMIN` com flag `autorizacaoGerencial=true` |
| RN0031 | Estoque no carrinho | Não permitir adicionar item se `estoque.quantidadeDisponivel < quantidade_solicitada` |
| RN0032 | Estoque na compra | Se estoque mudou entre adição e compra: notificar, atualizar quantidade ou remover item |
| RN0033 | Cupom promocional | Máximo 1 cupom promocional por compra |
| RN0034 | Múltiplos cartões | Permitido N cartões, cada um com valor ≥ R$ 10,00 |
| RN0035 | Misto cupom+cartão | Priorizar cupons. Se cupons cobrem quase tudo, cartão pode ser < R$ 10 |
| RN0036 | Cupom de troco | Se soma dos cupons > valor da compra, gerar cupom de troco com a diferença. Não permitir uso desnecessário de cupons |
| RN0044 | Bloqueio carrinho | Ao adicionar ao carrinho, bloquear item no estoque. Timeout = `TIMEOUT_CARRINHO_MINUTOS`. Notificar 5min antes de expirar |
| D8 | Mock operadora | Último dígito do nº cartão: PAR = REPROVADO, ÍMPAR = APROVADO |
