# Ralph Loop — How to Use (Fixed Version)

## ⚠️ Important: Execution Context Matters

The `ralph-loop.sh` script is a **launcher** and **orchestrator**. It must be run from your **TERMINAL**, NOT from within the Copilot CLI.

### ❌ WRONG
```bash
# Inside Copilot CLI (will not work):
$ copilot
> ./ralph-loop.sh --build    # ❌ This doesn't work
```

### ✅ CORRECT
```bash
# In your terminal:
$ ./ralph-loop.sh --build     # ✅ This works
```

## How It Works

The Ralph Loop orchestrates multi-step task execution:

```
┌─────────────────────────────────────┐
│  ./ralph-loop.sh --build (Terminal) │
└──────────────┬──────────────────────┘
               │
     ┌─────────▼──────────┐
     │ Read prd.json      │
     │ Generate plan      │
     │ Check progress     │
     └─────────┬──────────┘
               │
     ┌─────────▼────────────────────┐
     │ For each iteration:          │
     │ 1. Pick next pending task    │
     │ 2. Display task context      │
     │ 3. Record progress           │
     │ 4. Mark as done/failed       │
     └─────────┬────────────────────┘
               │
     ┌─────────▼──────────────────┐
     │ YOU implement the task:    │
     │ $ copilot                  │
     │ > (implement US-002, etc)  │
     └────────────────────────────┘
```

## Basic Commands

### Check Current Status
```bash
./ralph-loop.sh --status
```
Shows which tasks are done, pending, or failed.

### Generate Implementation Plan
```bash
./ralph-loop.sh --plan
```
Creates/updates `IMPLEMENTATION_PLAN.md` from `prd.json`.

### Start the Loop (Main Command)
```bash
# Run indefinitely (default: all pending tasks)
./ralph-loop.sh --build

# Run N iterations
./ralph-loop.sh --build -l 5

# Use specific model
./ralph-loop.sh --build -m claude-opus-4.6

# Use different PRD file
./ralph-loop.sh --build --prd prd-custom.json
```

## Workflow Example

### 1. Start the loop
```bash
$ ./ralph-loop.sh --build -l 1
```
This displays the first pending task (US-002).

### 2. Implement the task
The script shows you what to implement. You then:
```bash
$ copilot
# Now you're in Copilot CLI
> Please implement US-002: VALIDAR RF0012
> - Read IMPLEMENTATION_PLAN.md for details
> - Implement the feature
> - Write tests
> - Commit changes
```

### 3. Mark as done
Once you finish, the next run of `ralph-loop.sh` will:
- Detect the implementation is complete
- Mark US-002 as done in progress.txt
- Move to the next task (US-004, etc)

### 4. Check progress
```bash
$ ./ralph-loop.sh --status
```

## File Structure

- `prd.json` — Product requirements (84 user stories)
- `IMPLEMENTATION_PLAN.md` — Auto-generated task list from PRD
- `progress.txt` — Progress log (what's done/failed)
- `AGENTS.md` — Operational patterns and learnings
- `PROMPT.md` — Instructions for Copilot

## Resetting Tasks

If a task fails or needs re-execution:

```bash
# Reset single task
./ralph-loop.sh --reset US-002

# Reset all non-done tasks
./ralph-loop.sh --reset-all

# Then run again
./ralph-loop.sh --build
```

## Troubleshooting

### "Script hangs on Processing..."
This usually means you're running it from within Copilot CLI. 
- **Solution**: Exit Copilot (`Ctrl+D` or `/exit`)
- Run from terminal: `./ralph-loop.sh --build`

### "Task shows as failed"
Check `progress.txt` for the failure reason. Then:
```bash
./ralph-loop.sh --reset US-XXX
./ralph-loop.sh --build -l 1
```

### "Want to understand the full flow?"
Read these in order:
1. `RALPH_LOOP_QUICK_START.md` — Overview
2. `RALPH_LOOP_GUIDE.md` — Detailed explanation
3. `AGENTS.md` — Project-specific patterns

## Key Points

✅ ralph-loop.sh is run FROM terminal
✅ It orchestrates and tracks progress  
✅ You implement tasks using `copilot` command
✅ Progress is recorded automatically
✅ Rerun `./ralph-loop.sh --build` to continue

❌ Don't run ralph-loop.sh FROM within Copilot CLI
❌ Don't try to implement without reading the task context
❌ Don't skip running --plan if PRD changes
