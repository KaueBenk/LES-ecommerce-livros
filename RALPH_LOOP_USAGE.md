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
┌──────────────────────────────────────────────┐
│  Terminal: ./ralph-loop.sh --build           │
└──────────────┬───────────────────────────────┘
               │
     ┌─────────▼──────────────────────────┐
     │ 1. Read prd.json                   │
     │ 2. Generate IMPLEMENTATION_PLAN.md │
     │ 3. Check progress.txt              │
     └─────────┬──────────────────────────┘
               │
     ┌─────────▼──────────────────────┐
     │ For each iteration:            │
     │ ✓ Pick next pending task       │
     │ ✓ Display task context         │
     │ ✓ Show implementation guide    │
     │ ✓ Wait for user input          │
     └─────────┬──────────────────────┘
               │
     ┌─────────▼─────────────────────────────┐
     │ YOU implement the task:               │
     │                                       │
     │ $ copilot                             │
     │ > Read IMPLEMENTATION_PLAN.md         │
     │ > Implement US-002 according to spec  │
     │ > Run tests                           │
     │ > Commit changes                      │
     │ (Ctrl+D to exit copilot)              │
     │                                       │
     │ OR edit manually in your editor       │
     └─────────┬─────────────────────────────┘
               │
     ┌─────────▼──────────────────────┐
     │ Next run detects completion    │
     │ and marks task as done         │
     └───────────────────────────────┘
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

Output shows:
- Task summary
- PROMPT.md instructions
- Guide on how to implement
- Prompt to press Enter when ready

### 2. Implement the task

You have two options:

**Option A: Using Copilot CLI (Recommended)**
```bash
$ copilot
# Now in Copilot CLI
> Please implement US-002 as described
> - Read IMPLEMENTATION_PLAN.md
> - Write the feature code
> - Write tests
> - Verify all tests pass
> Commit the changes
```

**Option B: Manual editing**
- Edit files directly in your editor
- Follow the acceptance criteria
- Write tests as needed
- Commit when done

### 3. Next iteration
```bash
$ ./ralph-loop.sh --build -l 1
```

The script detects your implementation and marks US-002 as done, moving to US-004.

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

✅ ralph-loop.sh is run FROM terminal (not from Copilot CLI)
✅ It coordinates and tracks progress
✅ It presents tasks clearly with implementation guidance
✅ You implement tasks using copilot or manual editing
✅ Progress is recorded automatically in progress.txt
✅ No automatic execution (which was causing hangs)
✅ Next run automatically detects completion

❌ Don't run ralph-loop.sh FROM within Copilot CLI
❌ Don't expect it to automatically implement tasks
❌ Don't skip implementing - just press Enter and work
❌ Don't modify progress.txt manually (let the script manage it)
