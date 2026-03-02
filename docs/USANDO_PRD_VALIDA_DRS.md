# Como Usar o prd-valida-DRS.json Transformado

## Visão Geral

O arquivo `prd-valida-DRS.json` contém **84 user stories** que validam **todas as regras** do documento `DRS_LES_1_2026.md`. Este arquivo foi transformado para um cenário **Frontend-First**, onde os testes são executados com **dados mockados localmente**, sem dependência de API ou banco de dados.

## 📄 Estrutura do Arquivo

Cada user story segue este padrão:

```json
{
  "id": "US-001",
  "title": "VALIDAR RF0011: Cadastrar livro",
  "description": "Descrição clara do que está sendo validado",
  "rules": ["RF0011", "RN0011", "RNF0021"],
  "testType": "Frontend Component Test (Mockado)",
  "acceptanceCriteria": [
    "Critério 1...",
    "Critério 2...",
    "..."
  ],
  "mockData": {
    // Dados para usar no teste
  },
  "priority": 1
}
```

### Campos Explicados

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **id** | Identificador único da user story | US-001 |
| **title** | Título mapeando a requisição validada | VALIDAR RF0011: Cadastrar livro |
| **description** | Descrição clara do requisito | "Validar que o sistema mantém um cadastro único para livros..." |
| **rules** | Quais regras (RF/RNF/RN) estão sendo testadas | ["RF0011", "RN0011", "RNF0021"] |
| **testType** | Tipo de teste — sempre "Frontend Component Test (Mockado)" | Frontend Component Test (Mockado) |
| **acceptanceCriteria** | Critérios de aceitação do teste | Lista de comportamentos esperados |
| **mockData** | Dados mockados para o teste | Objeto com estrutura específica por teste |
| **priority** | Prioridade de implementação (1=Critical, 4=Low) | 1, 2, 3 ou 4 |

## 🔍 Exemplo Completo: Cadastro de Livro (US-001)

```json
{
  "id": "US-001",
  "title": "VALIDAR RF0011: Cadastrar livro",
  "description": "Validar que o sistema mantém um cadastro único para livros, conforme RF0011.",
  "rules": ["RF0011", "RN0011", "RNF0021"],
  "testType": "Frontend Component Test (Mockado)",
  "acceptanceCriteria": [
    "Dados são mockados localmente no componente (sem API)",
    "É possível cadastrar um novo livro via interface de administrador",
    "O sistema impede o cadastro de dois livros com o mesmo ISBN",
    "O livro recém-cadastrado aparece na listagem de livros",
    "Todos os campos obrigatórios (RF0011/RN0011) são exigidos pelo formulário",
    "Todos os testes passem com dados mockados"
  ],
  "mockData": {
    "newBook": {
      "titulo": "Clean Code: A Handbook of Agile Software Craftsmanship",
      "autor": "Robert C. Martin",
      "isbn": "978-0-13-235088-4",
      "editora": "Prentice Hall",
      "edicao": 1,
      "ano": 2008,
      "numeroPaginas": 464,
      "sinopse": "Uma guia prático para escrever código limpo.",
      "categoria": ["Programação", "Engenharia de Software"],
      "grupoPrecificacao": "Técnico",
      "codigoBarras": "9780132350884"
    },
    "existingBooks": [
      {"isbn": "978-0-596-00712-6", "titulo": "Head First Design Patterns"}
    ]
  },
  "priority": 1
}
```

### Regras (Rules) Validadas
- **RF0011**: O sistema deve manter um cadastro único para livros
- **RN0011**: Dados obrigatórios para cadastro de livro (autor, categoria, ano, título, editora, edição, ISBN, páginas, sinopse, dimensões, grupo de precificação, código de barras)
- **RNF0021**: Todo livro cadastrado deve receber um código único no sistema

## 🚀 Como Usar na Implementação

### Passo 1: Ler a User Story
1. Identifique a user story pelo **ID** (ex: US-001)
2. Leia a **descrição** para entender o contexto
3. Note as **rules** que estão sendo validadas

### Passo 2: Preparar o Mock Data
1. Localize a seção `mockData` na user story
2. Copie os dados para seu teste (usando dados mockados localmente)
3. Se a estrutura estiver incompleta (placeholder), complete usando `docs/MOCKING_GUIDE.md`

### Passo 3: Implementar o Teste
1. Crie um componente React que implemente a funcionalidade
2. Use os dados de `mockData` como entrada do teste
3. Valide cada `acceptanceCriteria` no teste

### Passo 4: Executar e Validar
1. Rode o teste (Cypress, Vitest, etc)
2. Verifique se todos os `acceptanceCriteria` passam
3. Verifique se todas as `rules` foram satisfeitas

## 📊 Estatísticas de Cobertura

| Tipo | Quantidade | Exemplos |
|------|-----------|----------|
| **RF (Requisitos Funcionais)** | 37 ref. | RF0011, RF0015, RF0031, RF0033 |
| **RNF (Não-Funcionais)** | 33 ref. | RNF0011, RNF0031, RNF0043, RNF0044 |
| **RN (Regras de Negócio)** | 68 ref. | RN0011, RN0031, RN0044, RN0051 |
| **Total de Rules Únicas** | **87** | - |

## 🎯 Prioridades de Implementação

### Priority 1 (42 user stories) — CRÍTICAS
Implementar primeiro. Formam a base do sistema:
- Cadastro de livros (RF0011-RF0016)
- Cadastro de clientes (RF0021-RF0028)
- Carrinho de compra (RF0031-RF0032)
- Realização de compra (RF0033-RF0037)

### Priority 2 (35 user stories) — ALTAS
Implementar após priority 1:
- Entrega e trocas (RF0038-RF0044)
- Controle de estoque (RF0051-RF0054)
- Análise (RF0055, RF00064)

### Priority 3 (6 user stories) — MÉDIAS
Melhorias e funcionalidades avançadas:
- Validações complexas
- Comportamentos de edge case

### Priority 4 (1 user story) — BAIXA
Implementar ao final:
- Funcionalidades nice-to-have

## 📋 Checklist de Conformidade

Para cada user story implementada, verifique:

- [ ] Todos os `acceptanceCriteria` passam nos testes
- [ ] Todos as `rules` (RF/RNF/RN) são atendidas
- [ ] Mock data é usado (sem chamadas reais a API)
- [ ] Comportamento está conforme a descrição
- [ ] Dados respeitam as restrições listadas no `mockData`
- [ ] Componente é isolado e testável
- [ ] Código está documentado conforme necessário

## 🔗 Links de Referência

- **DRS_LES_1_2026.md**: Requisitos completos (fonte de verdade)
- **Contexto_Tecnico_LES_2026.md**: Decisões técnicas e stack
- **MOCKING_GUIDE.md**: Padrão detalhado de mock data
- **prd-valida-DRS.json**: User stories (este arquivo)

## ❓ Perguntas Frequentes

### P: O que significa "Frontend Component Test (Mockado)"?
R: Significa que o teste é executado no frontend, usando dados mockados localmente, sem chamar nenhuma API ou banco de dados real.

### P: O `mockData` está completo em todas as user stories?
R: Não. 5 user stories têm exemplos detalhados, 79 têm placeholder. Use `MOCKING_GUIDE.md` para preencher conforme as rules.

### P: Como priorizo a implementação?
R: Siga a ordem: Priority 1 → Priority 2 → Priority 3 → Priority 4. Dentro de cada prioridade, siga a dependência de funcionalidades.

### P: E se uma user story tiver erro no teste?
R: 1) Revise o `acceptanceCriteria` 2) Verifique as `rules` no DRS 3) Ajuste o `mockData` ou o componente 4) Re-execute o teste

### P: Posso modificar as user stories?
R: Sim, mas mantenha rastreabilidade com as `rules`. Qualquer mudança deve estar alinhada com DRS_LES_1_2026.md.

---

**Última Atualização**: 2026-03-02  
**Transformação**: prd-valida-DRS.json v2 (Frontend-First com Mock Data)
