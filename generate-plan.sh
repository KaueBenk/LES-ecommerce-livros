#!/usr/bin/env bash
# generate-plan.sh — Generate IMPLEMENTATION_PLAN.md from prd.json
# Converts user stories into implementation tasks with status tracking

set -euo pipefail

PRD_FILE="${1:-prd.json}"
PLAN_FILE="IMPLEMENTATION_PLAN.md"
PROGRESS_FILE="progress.txt"

if [[ ! -f "$PRD_FILE" ]]; then
  echo "Error: PRD file not found: $PRD_FILE"
  exit 1
fi

# Extract project metadata
project=$(jq -r '.project' "$PRD_FILE")
description=$(jq -r '.description' "$PRD_FILE")
branch=$(jq -r '.branchName' "$PRD_FILE")
total_stories=$(jq '.userStories | length' "$PRD_FILE")

# Count existing progress
done_count=0
if [[ -f "$PROGRESS_FILE" ]]; then
  done_count=$(grep -c " | done |" "$PROGRESS_FILE" 2>/dev/null || echo 0)
fi

# Generate plan file
cat > "$PLAN_FILE" <<'EOF'
# IMPLEMENTATION_PLAN

## Project Overview

EOF

echo "**Project:** $project" >> "$PLAN_FILE"
echo "**Description:** $description" >> "$PLAN_FILE"
echo "**Branch:** $branch" >> "$PLAN_FILE"
echo "**Total Stories:** $total_stories" >> "$PLAN_FILE"
echo "**Completed:** $done_count / $total_stories" >> "$PLAN_FILE"
echo "" >> "$PLAN_FILE"

cat >> "$PLAN_FILE" <<'EOF'
## Task List

### Status Legend
- `[ ]` = pending
- `[→]` = in_progress  
- `[✓]` = done
- `[✗]` = failed
- `[⏹]` = blocked

---

EOF

# Generate task list
jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE" | while read -r story; do
  id=$(echo "$story" | jq -r '.id')
  title=$(echo "$story" | jq -r '.title')
  priority=$(echo "$story" | jq -r '.priority')
  
  # Determine status
  if [[ -f "$PROGRESS_FILE" ]]; then
    if grep -q "^${id} | done |" "$PROGRESS_FILE"; then
      status="✓"
    elif grep -q "^${id} | failed |" "$PROGRESS_FILE"; then
      status="✗"
    else
      status=" "
    fi
  else
    status=" "
  fi
  
  echo "- [$status] **$id** (P$priority) — $title" >> "$PLAN_FILE"
done

echo "" >> "$PLAN_FILE"
echo "---" >> "$PLAN_FILE"
echo "" >> "$PLAN_FILE"
echo "## Implementation Notes" >> "$PLAN_FILE"
echo "" >> "$PLAN_FILE"
echo "- Each story maps to an acceptance criteria set" >> "$PLAN_FILE"
echo "- Run with: \`./ralph-loop.sh --build\`" >> "$PLAN_FILE"
echo "- To reset a task: \`./ralph-loop.sh --reset <story-id>\`" >> "$PLAN_FILE"
echo "- For status: \`./ralph-loop.sh --status\`" >> "$PLAN_FILE"

echo "✓ Generated $PLAN_FILE ($total_stories stories, $done_count done)"
