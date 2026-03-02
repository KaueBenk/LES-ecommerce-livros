# Guia de Padrão para Mock Data em Testes Frontend

## Visão Geral
Os testes do e-commerce de livros (LES 2026) utilizam **dados mockados localmente** no frontend, sem dependência de API ou banco de dados. Este documento padroniza como estruturar e utilizar mock data em cada teste.

## 1. Princípios Gerais

- **Isolamento**: Cada teste é independente e não interfere em outros
- **Realismo**: Dados mockados devem ser representativos do cenário real
- **Validação**: Mock data deve respeitar todas as regras de negócio (RN)
- **Rastreabilidade**: Cada dado mock deve ser rastreável até sua rule de origem

## 2. Estrutura de Mock Data no JSON

Cada user story no `prd-valida-DRS.json` contém um campo `mockData`:

```json
{
  "id": "US-001",
  "title": "VALIDAR RF0011: Cadastrar livro",
  "mockData": {
    "newBook": { ... },
    "existingBooks": [ ... ]
  }
}
```

## 3. Entidades Base e Suas Estruturas

### 3.1 Livro
```javascript
{
  id: Number,
  titulo: String,
  autor: String,
  isbn: String,           // Unique, 13 dígitos
  editora: String,
  edicao: Number,
  ano: Number,
  numeroPaginas: Number,
  sinopse: String,
  categoria: String[],    // Múltiplas categorias permitidas
  grupoPrecificacao: String,
  codigoBarras: String,
  custoPorUnidade: Decimal,
  precoVenda: Decimal,
  quantidadeEstoque: Number,
  statusLivro: 'ATIVO' | 'INATIVO',
  dataCadastro: ISO8601,
  dataAlteracao: ISO8601
}
```

**Validações (RN0011)**:
- Todos os campos acima são obrigatórios
- ISBN deve ser único no sistema
- Código de barras deve ser único
- Categoria pode ser associada a múltiplas categorias (RN0012)

### 3.2 Cliente
```javascript
{
  id: Number,
  codigo: String,         // Unique (RNF0035)
  nome: String,
  email: String,          // Unique
  cpf: String,            // Unique, validado
  dataNascimento: Date,
  genero: 'M' | 'F' | 'O',
  telefone: {
    tipo: 'CELULAR' | 'RESIDENCIAL' | 'COMERCIAL',
    ddd: String,
    numero: String
  },
  senha: String,          // Criptografada (RNF0033)
  statusCliente: 'ATIVO' | 'INATIVO',
  rankingCliente: Number, // Total gasto em R$ (RN0027)
  dataCadastro: ISO8601
}
```

**Validações (RN0026)**:
- Todos os campos acima são obrigatórios
- Senha deve ter 8+ caracteres, maiúsculas, minúsculas, caracteres especiais (RNF0031)
- Deve ser confirmada antes de salvar (RNF0032)

### 3.3 Endereço
```javascript
{
  id: Number,
  clienteId: Number,
  nome: String,           // Ex: "Casa", "Trabalho"
  tipoResidencia: 'CASA' | 'APARTAMENTO' | 'COMERCIAL',
  tipoLogradouro: 'RUA' | 'AVENIDA' | 'TRAVESSA',
  logradouro: String,
  numero: String,
  bairro: String,
  cep: String,            // Formato: XXXXX-XXX
  cidade: String,
  estado: String,         // Sigla do estado (SP, RJ, MG, ...)
  pais: String,           // Default: Brasil
  observacoes: String,    // Opcional
  tipoEndereco: 'ENTREGA' | 'COBRANCA' | 'AMBOS'
}
```

**Validações (RN0023)**:
- Todos os campos acima são obrigatórios (exceto observações)
- Cliente deve ter ao menos um endereço de cobrança (RN0021) e um de entrega (RN0022)

### 3.4 Cartão de Crédito
```javascript
{
  id: Number,
  clienteId: Number,
  numeroCartao: String,   // Será exibido como **** **** **** 1234
  nomeTitular: String,
  bandeira: 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX',
  codigoSeguranca: String,
  dataValidade: String,   // Formato: MM/YY
  preferencial: Boolean   // Apenas um cartão pode ser preferencial
}
```

**Validações (RN0024, RN0025)**:
- Bandeira deve existir no sistema (RN0025)
- Apenas uma bandeira é salva, não os últimos 4 dígitos após validação

### 3.5 Item de Carrinho
```javascript
{
  id: Number,
  carrinhoId: Number,
  livroId: Number,
  titulo: String,         // Desnormalizado para exibição
  precoUnitario: Decimal,
  quantidade: Number,
  subtotal: Decimal,      // precoUnitario * quantidade
  dataAdicao: ISO8601,
  statusItem: 'DISPONIVEL' | 'BLOQUEADO' | 'REMOVIDO'
}
```

**Validações (RN0031, RN0032, RN0044)**:
- Quantidade não pode ser zero (RN0061)
- Estoque deve ser validado ao adicionar (RN0031)
- Quantidade não pode exceder estoque disponível (RN0031)
- Item é bloqueado quando adicionado (RN0044)
- Bloqueio expira em 30 minutos (default, configurável — RN0044)
- Usuário é notificado 5 minutos antes do bloqueio expirar

### 3.6 Compra (Pedido)
```javascript
{
  id: Number,
  clienteId: Number,
  dataPedido: ISO8601,
  enderecoEntregaId: Number,
  enderecoCobrancaId: Number,
  itensCompra: CartItem[],
  subtotal: Decimal,
  frete: Decimal,         // Default R$ 10,00 (D1)
  desconto: Decimal,      // Cupons aplicados
  total: Decimal,         // subtotal + frete - desconto
  statusCompra: 'EM_PROCESSAMENTO' | 'APROVADA' | 'REPROVADA' | 'EM_TRANSPORTE' | 'ENTREGUE' | 'EM_TROCA' | 'TROCA_AUTORIZADA' | 'TROCADO',
  formasPagamento: [{
    tipo: 'CREDITO' | 'CUPOM_PROMOCIONAL' | 'CUPOM_TROCA',
    valor: Decimal,
    referencia: String    // ID do cartão ou cupom
  }],
  dataPagamento: ISO8601,
  dataAprovacao: ISO8601,
  dataEntrega: ISO8601
}
```

**Validações (RN0032, RN0037, RN0038)**:
- Estoque é validado no momento da compra (RN0032)
- Status muda para EM_PROCESSAMENTO após finalização (RF0037)
- Forma de pagamento é validada para mudança de status (RN0037)
- Se aprovado, status muda para APROVADA (RN0038)
- Se reprovado, status muda para REPROVADA (RN0038)

### 3.7 Cupom
```javascript
{
  id: Number,
  codigo: String,         // Unique
  tipoCupom: 'PROMOCIONAL' | 'TROCA',
  valor: Decimal,
  dataCriacao: ISO8601,
  dataValidade: ISO8601,
  statusCupom: 'ATIVO' | 'USADO' | 'EXPIRADO',
  clienteId: Number       // Null para cupons promocionais públicos
}
```

**Validações (RN0033, RN0036)**:
- Apenas um cupom promocional por compra (RN0033)
- Cupom de troca é gerado automaticamente se valor supera compra (RN0036)
- Sistema não permite uso desnecessário de múltiplos cupons

## 4. Padrões de Teste por Contexto

### 4.1 Teste de Cadastro (RF0011, RF0021, etc)
```javascript
mockData: {
  newEntity: { /* dados completos e válidos */ },
  existingEntities: [ /* entidades já cadastradas para validar duplicatas */ ]
}
```

### 4.2 Teste de Consulta (RF0015, RF0024)
```javascript
mockData: {
  allEntities: [ /* lista completa */ ],
  searchFilters: [
    { campo: 'titulo', valor: 'Clean Code', esperado: [livro1] },
    { campo: 'autor', valor: 'Martin', esperado: [livro1, livro3] }
  ]
}
```

### 4.3 Teste de Carrinho (RF0031, RF0032)
```javascript
mockData: {
  products: [ /* produtos disponíveis */ ],
  cartInitial: [ /* itens já no carrinho */ ],
  operations: [
    { acao: 'add', produtoId: 1, quantidade: 2 },
    { acao: 'update', itemId: 1, novaQuantidade: 5 },
    { acao: 'remove', itemId: 2 }
  ],
  resultadoEsperado: [ /* carrinho após operações */ ]
}
```

### 4.4 Teste de Status (RF0037, RF0038, RF0039)
```javascript
mockData: {
  compraInicial: { statusCompra: 'EM_PROCESSAMENTO' },
  validacaoPagamento: { resultado: 'APROVADA' },
  estadoEsperado: { statusCompra: 'APROVADA' }
}
```

## 5. Dados Realistas Pré-Definidos

### Livros Padrão para Testes
```javascript
const LIVROS_MOCK = [
  {
    id: 1,
    titulo: 'Clean Code',
    autor: 'Robert C. Martin',
    isbn: '978-0-13-235088-4',
    preco: 89.90,
    estoque: 5
  },
  {
    id: 2,
    titulo: 'Design Patterns',
    autor: 'Gang of Four',
    isbn: '978-0-20-163361-0',
    preco: 95.00,
    estoque: 3
  },
  // ... mais livros
];
```

### Estados Brasileiros para Endereços
```javascript
const ESTADOS_BR = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 
  'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
```

### Bandeiras de Crédito
```javascript
const BANDEIRAS = ['VISA', 'MASTERCARD', 'ELO', 'AMEX'];
```

## 6. Regra Mock para Operadora de Cartão (D8)

**Decisão D8**: Cartões com **último dígito PAR = REPROVADO**, **ímpar = APROVADO**

```javascript
function validarCartaoMock(numeroCartao: string): 'APROVADO' | 'REPROVADO' {
  const ultimoDigito = parseInt(numeroCartao.slice(-1));
  return ultimoDigito % 2 === 0 ? 'REPROVADO' : 'APROVADO';
}
```

## 7. Exemplo Completo: Teste de Compra (RF0033)

```javascript
// user story no JSON
{
  "id": "US-033",
  "title": "VALIDAR RF0033: Realizar compra",
  "mockData": {
    "carrinhoValido": [
      { livroId: 1, titulo: "Clean Code", preco: 89.90, quantidade: 2 },
      { livroId: 2, titulo: "Design Patterns", preco: 95.00, quantidade: 1 }
    ],
    "enderecosEntrega": [
      { id: 1, nome: "Casa", rua: "Av. Paulista", numero: "1000", 
        cidade: "São Paulo", estado: "SP", cep: "01311-100" }
    ],
    "cartoesCredito": [
      { numero: "**** **** **** 5555", bandeira: "VISA", dataValidade: "12/25" }
    ],
    "resultadoEsperado": {
      "statusCompra": "EM_PROCESSAMENTO",
      "subtotal": 274.80,
      "frete": 10.00,
      "total": 284.80
    }
  }
}
```

## 8. Checklist para Novo Teste

- [ ] Mock data é completo (todos os campos obrigatórios)
- [ ] Dados respeitam todas as rules (RN) associadas
- [ ] Não há dependência de API ou banco de dados
- [ ] Dados são realistas e representam cenários reais
- [ ] Test é isolado e não interfere em outros testes
- [ ] Resultado esperado está explícito no mockData
- [ ] Comentários explicam dados complexos ou não-óbvios

## Referências

- **DRS_LES_1_2026.md**: Documento de requisitos funcional
- **Contexto_Tecnico_LES_2026.md**: Decisões técnicas e convenções
- **prd-valida-DRS.json**: User stories com mock data integrado
