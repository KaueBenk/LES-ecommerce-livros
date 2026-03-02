# US-001: VALIDAR RF0011 — Cadastrar livro

## Status: ✅ CONCLUÍDO

## Implementação

### Mudanças Realizadas

1. **Configuração de Testes**
   - Instalado Vitest + React Testing Library
   - Configurado `vite.config.js` com suporte a testes
   - Criado arquivo de setup (`src/test/setup.js`)
   - Adicionados scripts de teste ao `package.json`

2. **Validação de ISBN Duplicado**
   - Modificado `validateStep()` para aceitar lista de livros existentes
   - Adicionado estado `existingBooks` ao componente
   - Carregamento de livros existentes no `useEffect` inicial
   - Normalização de ISBN (remoção de traços/espaços) para comparação
   - Mensagem de erro específica indicando livro com ISBN duplicado

3. **Melhorias no Formulário**
   - Normalização de ISBN no `buildPayload()` (remove traços/espaços)
   - Preço de venda agora é obrigatório no passo 3
   - Navegação após submit vai para `/admin/livros` (não `/admin`)

4. **Testes Criados**
   - `BookFormPage.test.jsx` com 7 testes cobrindo todos os critérios de aceitação
   - Todos os testes passando ✅

### Critérios de Aceitação

- ✅ **AC1**: Dados são mockados localmente no componente (sem API)
- ✅ **AC2**: É possível cadastrar um novo livro via interface de administrador
- ✅ **AC3**: O sistema impede o cadastro de dois livros com o mesmo ISBN
- ✅ **AC4**: O livro recém-cadastrado aparece na listagem de livros
- ✅ **AC5**: Todos os campos obrigatórios (RF0011/RN0011) são exigidos pelo formulário
- ✅ **AC6**: Os testes fazem sentido e estão de acordo com a lógica esperada
- ✅ **AC7**: Todos os testes passam com dados mockados

### Resultado dos Testes

```bash
 ✓ src/pages/BookFormPage.test.jsx (7 tests) 355ms

 Test Files  1 passed (1)
      Tests  7 passed (7)
```

### Campos Obrigatórios Validados (RF0011/RN0011)

**Passo 1 - Informações Básicas:**
- Título
- Autor
- Editora
- Edição
- Ano de Publicação (1000-2099)
- ISBN (10-13 dígitos numéricos)

**Passo 2 - Dados Físicos:**
- Todos opcionais

**Passo 3 - Preço & Categorias:**
- Preço de Venda (obrigatório, > 0)

### Mock Data Usado

Baseado em `prd-valida-DRS.json`:
- 2 autores (Robert C. Martin, Martin Fowler)
- 2 editoras (Prentice Hall, O'Reilly Media)
- 2 categorias (Programação, Engenharia de Software)
- 2 grupos de precificação (Técnico 40%, Geral 30%)
- 1 livro existente com ISBN `978-0-596-00712-6`

### Regra de Negócio Implementada

**RN0011**: ISBN deve ser único no sistema
- Validação ocorre no passo 1, antes de avançar para o passo 2
- Normalização automática de ISBN (remove traços e espaços)
- Comparação case-insensitive
- Exceção para edição (permite manter o próprio ISBN)

## Commit

```
test(books): add unit tests for book registration (US-001/RF0011)
SHA: a69b2ee
```
