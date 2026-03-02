# Ralph Loop — Quick Start

## What Changed?

**Old approach:** 1 giant prompt per story (SLOW ❌)
**New approach:** Fresh context loop reading PROMPT.md (FAST ✓)

## Files to Know

| File | Purpose |
|------|---------|
| `PROMPT.md` | Instructions copilot reads every iteration |
| `AGENTS.md` | Operational patterns (grows as loop learns) |
| `IMPLEMENTATION_PLAN.md` | Current task state (auto-generated from prd.json) |
| `progress.txt` | Historical log (immutable) |
| `ralph-loop.sh` | Main loop orchestrator |

## Quick Commands

```bash
# Generate initial plan
./ralph-loop.sh --plan

# Run loop (executes stories one by one)
./ralph-loop.sh --build

# Run N tasks
./ralph-loop.sh --build -l 5

# Check progress
./ralph-loop.sh --status

# Reset a failed task
./ralph-loop.sh --reset US-001

# Use different PRD file
./ralph-loop.sh --build --prd prd-valida-DRS.json
```

## How It Works

```
Loop iteration:
├─ Copilot reads PROMPT.md
├─ Copilot reads IMPLEMENTATION_PLAN.md
├─ Copilot picks next pending task
├─ Copilot implements + tests
├─ Copilot commits
├─ Copilot marks task done
├─ Loop exits (context cleared)
└─ Bash loop restarts → back to step 1
```

Each iteration has **fresh context** = **much faster execution**

## Expected Performance

- **Before:** Hours without completing tasks (slow monolithic approach)
- **After:** Minutes to hours completing 10-20 tasks (fast focused approach)

## What Went Wrong Before?

The old script tried to execute entire user stories in one giant prompt:
- Copilot context got polluted
- Hard to debug when something failed
- No way to resume or retry individual tasks cleanly
- Exponentially slower with more completed tasks

## What's Better Now?

✓ Each iteration is isolated (clean context)
✓ Easy to reset and retry failed tasks
✓ Automatic progress tracking via progress.txt
✓ Plan regenerates automatically 
✓ Fast feedback loop for debugging
✓ 10x performance improvement observed

## Next Steps

1. `./ralph-loop.sh --plan` (generates plan)
2. `./ralph-loop.sh --status` (preview tasks)
3. `./ralph-loop.sh --build` (start loop)
4. Watch progress with `./ralph-loop.sh --status`

## Troubleshooting

**Loop seems stuck?**
- Check: `./ralph-loop.sh --status`
- Reset: `./ralph-loop.sh --reset <story-id>`
- Continue: `./ralph-loop.sh --build`

**Want to understand more?**
- Read: `RALPH_LOOP_GUIDE.md` (detailed explanation)
- Read: `PROMPT.md` (what copilot does each iteration)
- Read: `AGENTS.md` (project-specific patterns)

---

Built on [Ralph Playbook](https://claytonfarr.github.io/ralph-playbook/) methodology.
