# Ralph Loop Guide — Fresh Context Pattern

## Overview

Este documento descreve o novo padrão de execução do Ralph Loop, baseado no [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/). O padrão anterior (monolítico) era extremamente lento porque tentava executar cada história completa em um único prompt gigante. O novo padrão usa **contexto fresco** a cada iteração, mantendo estado compartilhado em arquivos markdown/json.

## Padrão: Contexto Fresco

A cada iteração do loop:

1. **Bash loop** reinicia o copilot CLI
2. **Copilot lê PROMPT.md** (instrução única e clara)
3. **Copilot lê IMPLEMENTATION_PLAN.md** (tarefas + status atual)
4. **Copilot seleciona próxima tarefa** (a mais importante pendente)
5. **Copilot implementa a tarefa** (cria código, passa testes)
6. **Copilot marca como done** (atualiza IMPLEMENTATION_PLAN.md)
7. **Copilot faz commit** (registra progresso em git)
8. **Loop termina** contexto é descartado
9. **Bash loop reinicia** → volta ao passo 1

**Benefício:** Cada iteração tem contexto limpo, sem bloat de execuções anteriores. A IA fica no "smart zone" (60-80% de utilização contexto).

## Arquivos Principais

### `PROMPT.md` 
Instrução única que copilot lê a cada iteração. Define:
- Ler IMPLEMENTATION_PLAN.md
- Selecionar tarefa mais importante
- Implementar completamente
- Rodar testes se houver
- Commit quando pronto
- Marcar como done no plano
- Sair (loop reinicia)

### `IMPLEMENTATION_PLAN.md`
Estado persistente das tarefas. Gerado automaticamente a partir do `prd.json`:
- Lista de todas as user stories
- Status de cada uma: `[ ]` pending, `[→]` in_progress, `[✓]` done, `[✗]` failed, `[⏹]` blocked
- Atualizado a cada iteração conforme progresso

### `AGENTS.md`
Guia operacional que evolui conforme o loop descobre padrões:
- Comandos do projeto (npm, docker, etc.)
- Estrutura do PRD
- Convenções de commit
- Estratégia de testes
- Padrões descobertos
- Blockers conhecidos

### `progress.txt`
Registro histórico imutável (nunca é deletado/editado):
```
# RALPH Progress
# Format: <storyId> | <status> | <timestamp> | <notes>
US-001 | done | 2026-03-02 14:30:00 | Completed successfully
US-002 | done | 2026-03-02 14:35:00 | Completed successfully
```

### `prd.json` ou `prd-*.json`
Arquivo de requisitos original (compatível com ambos):
```json
{
  "project": "...",
  "branchName": "...",
  "userStories": [
    {
      "id": "US-001",
      "title": "...",
      "description": "...",
      "acceptanceCriteria": ["...", "..."],
      "priority": 1
    },
    ...
  ]
}
```

## Usando o Loop

### Start/Restart
```bash
# Gerar plano inicial
./ralph-loop.sh --plan

# Executar loop indefinidamente
./ralph-loop.sh --build

# Executar N iterações (tarefas)
./ralph-loop.sh --build -l 5

# Com outro PRD
./ralph-loop.sh --build --prd prd-valida-DRS.json
```

### Monitoring
```bash
# Ver status atual
./ralph-loop.sh --status

# Com outro PRD
./ralph-loop.sh --status --prd prd-valida-DRS.json
```

### Reset/Retry
```bash
# Resetar uma tarefa específica para re-executar
./ralph-loop.sh --reset US-001

# Resetar todas as não-concluídas
./ralph-loop.sh --reset-all

# Re-gerar plano (reflete progress.txt)
./ralph-loop.sh --plan
```

### Configuration
```bash
# Via CLI
./ralph-loop.sh --build -m claude-sonnet-4 -l 10

# Via variáveis de ambiente
export MODEL_NAME="claude-opus-4.5"
export MAX_LOOPS=10
export COPILOT_TIMEOUT=7200
./ralph-loop.sh --build
```

## Como o Ralph Loop Determina Progresso

1. **progress.txt**: Arquivo que nunca é editado, apenas lido
   - Cada `done` ou `failed` é adicionado uma vez
   - Serve como histórico imutável

2. **IMPLEMENTATION_PLAN.md**: Regenerado a cada iteração com base em progress.txt
   - Lê progress.txt
   - Ordena stories por prioridade
   - Marca status [✓], [✗], [ ]
   - Copilot lê isso para selecionar próxima tarefa

3. **Task Selection**: Copilot automatically picks
   - Primeira tarefa sem status em progress.txt (menor priority)
   - Ignora `done` e `failed`
   - Prioriza por número da priority (1 > 2 > 3)

## Padrão de Commit

Cada tarefa concluída → commit automático:
```bash
git commit -m "feat(area): description [US-001]" \
  --trailer "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Plano atualizado → commit separado:
```bash
git commit -m "docs: update IMPLEMENTATION_PLAN.md — US-001 done" \
  --trailer "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

Histórico limpo no git, rastreável por story ID.

## Performance: Antes vs Depois

### Antes (Monolítico)
- 1 prompt gigante por story
- Copilot tenta fazer tudo numa execução
- Context window fica poluído
- Extremamente lento (horas sem completar)
- Difícil de debugar quando algo dá errado

### Depois (Fresh Context)
- 1 prompt breve + task + AC por iteração
- Copilot sabe exatamente o que fazer
- Context window sempre limpo
- Velocidade ~10x melhor
- Falhas são isoladas a uma tarefa específica

## Tuning o Loop

Conforme o loop executa, você descobre padrões. Ajuste:

1. **PROMPT.md** — Adicione guardrails se o copilot falha em patterns específicos
2. **AGENTS.md** — Documente descobertas: comandos que funcionam, convenções, blockers
3. **PRD** — Se descobrir requirement ambíguo, edite o prd.json e regen o plano
4. **Code patterns** — Se o copilot segue padrões errados, ajuste código existente

Exemplo: Se copilot sempre esquece de rodar testes:
```markdown
## Important (AGENTS.md)
Always run tests:
npm test
npm run lint
docker-compose up -d && npm run e2e
```

## Troubleshooting

### Loop fica preso em uma tarefa
- Timeout padrão é 3600s (1h)
- Configure: `export COPILOT_TIMEOUT=7200`
- Ou redefina manualmente: `./ralph-loop.sh --reset US-XXX`

### Task foi marcada como done mas não estava
- Redefina: `./ralph-loop.sh --reset US-XXX`
- Loop retentará na próxima iteração

### PRD tem histórias muito grandes
- Divida em sub-histórias menores
- Cada história = 1 feature bem-definida
- Acceptance criteria devem ser testáveis

### Loop sempre falha em uma tarefa
- Marque como bloqueada em AGENTS.md
- Redefina e tente com modelo diferente:
  `./ralph-loop.sh --reset US-XXX && ./ralph-loop.sh -m claude-opus-4.5 -l 1`

## Comparação com Ralph Playbook Oficial

Este padrão segue o Ralph Playbook de [Clayton Farr](https://claytonfarr.github.io/ralph-playbook/), com adaptações para Copilot CLI e prd.json:

| Aspecto | Official Ralph | Este Loop |
|---------|----------------|-----------|
| Entrada | specs/* + JTBD analysis | prd.json (já definido) |
| Plano | IMPLEMENTATION_PLAN.md | IMPLEMENTATION_PLAN.md (gerado) |
| Prompt | PROMPT.md + AGENTS.md | PROMPT.md + AGENTS.md |
| Iteração | claude-cli stdin | copilot CLI |
| Commit | Após cada task | Após cada task + plano |
| Status | Plan file | progress.txt + IMPLEMENTATION_PLAN.md |

Mantém os princípios do Ralph (contexto fresco, backpressure, estado persistente) adaptados para seu setup.

## Próximos Passos

1. Executar: `./ralph-loop.sh --build -l 3`
2. Observar padrões e falhas comuns
3. Adicionar descobertas ao AGENTS.md
4. Refinar PROMPT.md se copilot falha em patterns específicos
5. Deixar rodar continuamente conforme necessário

---

**Última atualização:** 2026-03-02
**Base:** [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) + Copilot CLI
