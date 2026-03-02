#!/usr/bin/env bash
# ralph-loop.sh — Ralph Loop for Copilot CLI (Fresh Context Pattern)
# Reads from IMPLEMENTATION_PLAN.md, executes one task per iteration,
# maintains progress in progress.txt and .ralph/ state directory.
#
# Usage: ./ralph-loop.sh [OPTIONS]
#   --build           Run building loop (default)
#   --plan            Regenerate IMPLEMENTATION_PLAN.md only
#   --status          Show current progress summary
#   -l, --loops N     Max iterations per run (default: unlimited)
#   -m, --model M     Copilot model (default: claude-opus-4.5)
#   -r, --reset ID    Reset specific story for re-execution
#   --reset-all       Reset all non-done stories
#   --prd FILE        PRD file path (default: prd.json)
#   -h, --help        Show this help

set -euo pipefail

# Detect if we're running inside Copilot CLI context
# This prevents infinite recursion when the script tries to call copilot
if [[ -n "${INSIDE_COPILOT:-}" ]]; then
  echo "❌ Error: ralph-loop.sh cannot be executed from inside a Copilot CLI context"
  echo "   ralph-loop.sh is a launcher that CALLS copilot, not something copilot should run"
  echo ""
  echo "✓ Instead, run this from your terminal:"
  echo "  $ ./ralph-loop.sh --build"
  exit 1
fi

# Configuration
MODE="build"
MAX_LOOPS="${MAX_LOOPS:-0}"  # 0 = unlimited
MODEL_NAME="${MODEL_NAME:-claude-opus-4.5}"
COPILOT_ARGS="${COPILOT_ARGS:-}"
COPILOT_TIMEOUT="${COPILOT_TIMEOUT:-3600}"
PRD_FILE="${PRD_FILE:-prd.json}"
PROGRESS_FILE="${PROGRESS_FILE:-progress.txt}"
PLAN_FILE="${PLAN_FILE:-IMPLEMENTATION_PLAN.md}"
RALPH_DIR="${RALPH_DIR:-.ralph}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[✓]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_header()  { echo -e "\n${BOLD}${CYAN}════════════════════════════════════════${NC}"; \
                echo -e "${BOLD}${CYAN}  $*${NC}"; \
                echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"; }

# Parse arguments
RESET_STORY=""
RESET_ALL=false
while [[ $# -gt 0 ]]; do
  case $1 in
    --plan)        MODE="plan"; shift ;;
    --build)       MODE="build"; shift ;;
    --status)      MODE="status"; shift ;;
    -l|--loops)    MAX_LOOPS="$2"; shift 2 ;;
    -m|--model)    MODEL_NAME="$2"; shift 2 ;;
    -r|--reset)    RESET_STORY="$2"; shift 2 ;;
    --reset-all)   RESET_ALL=true; shift ;;
    --prd)         PRD_FILE="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,19p' "$0" | sed 's/^# \?//'
      exit 0 ;;
    *)
      log_error "Unknown option: $1"
      exit 1 ;;
  esac
done

# Validate dependencies
for cmd in jq copilot; do
  if ! command -v "$cmd" &>/dev/null; then
    log_error "'$cmd' is required but not installed"
    exit 1
  fi
done

if [[ ! -f "$PRD_FILE" ]]; then
  log_error "PRD file not found: $PRD_FILE"
  exit 1
fi

# Setup
mkdir -p "$RALPH_DIR"
[[ -f .gitignore ]] || touch .gitignore
grep -qxF "${RALPH_DIR}/" .gitignore 2>/dev/null || echo "${RALPH_DIR}/" >> .gitignore

if [[ ! -f "$PROGRESS_FILE" ]]; then
  { echo "# RALPH Progress"
    echo "# Format: <storyId> | <status> | <timestamp> | <notes>"
  } > "$PROGRESS_FILE"
fi

# Helper functions
_timestamp()         { date '+%Y-%m-%d %H:%M:%S'; }
_is_done()           { grep -q "^${1} | done |"   "$PROGRESS_FILE" 2>/dev/null; }
_is_failed()         { grep -q "^${1} | failed |" "$PROGRESS_FILE" 2>/dev/null; }
_record_done()       { echo "${1} | done | $(_timestamp) | ${2:-Success}" >> "$PROGRESS_FILE"; }
_record_failed()     { echo "${1} | failed | $(_timestamp) | ${2:-Failed}" >> "$PROGRESS_FILE"; }
_reset_story() {
  sed -i "/^${1} |/d" "$PROGRESS_FILE"
  log_info "Story $1 reset"
}

# Count done stories
count_done() {
  grep -c " | done |" "$PROGRESS_FILE" 2>/dev/null || echo 0
}

# Generate plan from prd.json
generate_plan() {
  local project description branch total done_count
  project=$(jq -r '.project' "$PRD_FILE")
  description=$(jq -r '.description' "$PRD_FILE")
  branch=$(jq -r '.branchName' "$PRD_FILE")
  total=$(jq '.userStories | length' "$PRD_FILE")
  done_count=$(count_done)
  
  cat > "$PLAN_FILE" <<EOF
# IMPLEMENTATION_PLAN

## Project Overview

**Project:** $project
**Description:** $description
**Branch:** $branch
**Total Stories:** $total
**Completed:** $done_count / $total

## Task List

### Status Legend
- \`[ ]\` = pending
- \`[→]\` = in_progress  
- \`[✓]\` = done
- \`[✗]\` = failed
- \`[⏹]\` = blocked

---

EOF

  jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE" | while read -r story; do
    local id title priority status
    id=$(echo "$story" | jq -r '.id')
    title=$(echo "$story" | jq -r '.title')
    priority=$(echo "$story" | jq -r '.priority')
    
    if _is_done "$id"; then
      status="✓"
    elif _is_failed "$id"; then
      status="✗"
    else
      status=" "
    fi
    
    echo "- [$status] **$id** (P$priority) — $title" >> "$PLAN_FILE"
  done
  
  cat >> "$PLAN_FILE" <<EOF

---

## Implementation Notes

- Each story maps to acceptance criteria in prd.json
- Run with: \`./ralph-loop.sh --build\`
- To reset a task: \`./ralph-loop.sh --reset <story-id>\`
- For status: \`./ralph-loop.sh --status\`
EOF

  log_ok "Generated $PLAN_FILE"
}

# Show status
show_status() {
  local project total_count done_count failed_count pending
  project=$(jq -r '.project' "$PRD_FILE")
  total_count=$(jq '.userStories | length' "$PRD_FILE" || echo "0")
  done_count=$(count_done)
  failed_count=$(grep -c " | failed |" "$PROGRESS_FILE" 2>/dev/null || true)
  pending=$(( total_count - done_count - failed_count ))
  
  log_header "RALPH Status — $project"
  echo ""
  printf "  %-10s %-60s %s\n" "ID" "Title" "Status"
  printf "  %-10s %-60s %s\n" "----------" "------------------------------------------------------------" "--------"
  
  jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE" | while read -r story; do
    local id title status_label
    id=$(echo "$story" | jq -r '.id')
    title=$(echo "$story" | jq -r '.title' | cut -c1-60)
    
    if _is_done "$id"; then
      status_label="${GREEN}done${NC}"
    elif _is_failed "$id"; then
      status_label="${RED}failed${NC}"
    else
      status_label="${CYAN}pending${NC}"
    fi
    
    printf "  %-10s %-60s " "$id" "$title"
    echo -e "$status_label"
  done
  
  echo ""
  echo -e "  Total: ${total_count}  |  ${GREEN}Done: ${done_count}${NC}  |  ${CYAN}Pending: ${pending}${NC}  |  ${RED}Failed: ${failed_count}${NC}"
  echo ""
}

# Extract next pending story ID
get_next_pending_id() {
  jq -r '.userStories[] | select(.id as $id | input | index($id) == null) | .id' "$PRD_FILE" 2>/dev/null | head -1 || true
}

# Execute single task iteration
execute_iteration() {
  if [[ ! -f "$PLAN_FILE" ]]; then
    log_warn "$PLAN_FILE not found; regenerating…"
    generate_plan
  fi
  
  # Find next pending task
  local next_id
  next_id=""
  while IFS= read -r story; do
    local id
    id=$(echo "$story" | jq -r '.id')
    if ! _is_done "$id" && ! _is_failed "$id"; then
      next_id="$id"
      break
    fi
  done < <(jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE")
  
  if [[ -z "$next_id" ]]; then
    return 0
  fi
  
  # Get story details
  local next_task story_title story_desc story_criteria
  next_task=$(jq -c ".userStories[] | select(.id == \"$next_id\")" "$PRD_FILE")
  story_title=$(echo "$next_task" | jq -r '.title')
  story_desc=$(echo "$next_task" | jq -r '.description')
  story_criteria=$(echo "$next_task" | jq -r '.acceptanceCriteria[]' | sed 's/^/- /')
  
  log_header "Story: $next_id — $story_title"
  echo ""
  echo "Description:"
  echo "$story_desc"
  echo ""
  echo "Acceptance Criteria:"
  echo "$story_criteria"
  echo ""
  echo -e "${YELLOW}⏳ Processing…${NC}"
  echo ""
  
  # Execute copilot with fresh context
  log_info "Starting Copilot (model: $MODEL_NAME)…"
  log_info "Timeout: ${COPILOT_TIMEOUT}s"
  echo ""
  
  local exit_code=0
  local prompt start_time elapsed prompt_file
  prompt_file=$(mktemp)
  trap "rm -f '$prompt_file'" RETURN
  
  # Write prompt to file instead of using command substitution for better handling
  {
    cat PROMPT.md
    echo ""
    echo "## Current Task"
    echo ""
    echo "**Story ID:** $next_id"
    echo ""
    echo "**Title:** $story_title"
    echo ""
    echo "**Description:** $story_desc"
    echo ""
    echo "**Acceptance Criteria:**"
    echo "$story_criteria"
  } > "$prompt_file"
  
  start_time=$(date +%s)
  
  # Use unbuffered output and line buffering for better responsiveness
  # Set environment variable to prevent recursion
  timeout "$COPILOT_TIMEOUT" \
    bash -c "INSIDE_COPILOT=1 stdbuf -oL -eL copilot -p \"\$(cat '$prompt_file')\" --allow-all-tools --model \"$MODEL_NAME\"" \
    || exit_code=$?
  
  elapsed=$(($(date +%s) - start_time))
  echo ""
  log_info "Copilot finished after ${elapsed}s (exit code: $exit_code)"
  echo ""
  
  # Check result
  if [[ $exit_code -eq 0 ]]; then
    log_ok "✓ Story $next_id completed successfully (${elapsed}s)"
    _record_done "$next_id" "Completed successfully"
    # Update plan
    generate_plan
    
    # Commit plan update
    git add "$PLAN_FILE" 2>/dev/null && \
    git commit -m "docs: update IMPLEMENTATION_PLAN.md — $next_id done" \
      --trailer "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>" 2>/dev/null || true
    
    return 0
  elif [[ $exit_code -eq 124 ]]; then
    log_warn "✗ Story $next_id timed out after ${COPILOT_TIMEOUT}s"
    _record_failed "$next_id" "Timeout after ${COPILOT_TIMEOUT}s"
    return 1
  else
    log_warn "✗ Story $next_id failed (exit code: $exit_code, ${elapsed}s)"
    _record_failed "$next_id" "Copilot exited with code $exit_code"
    return 1
  fi
}

# Main
case "$MODE" in
  plan)
    log_header "PLANNING MODE"
    generate_plan
    exit 0
    ;;
  
  status)
    show_status
    exit 0
    ;;
  
  build)
    # Handle single-action flags
    if [[ -n "$RESET_STORY" ]]; then
      _reset_story "$RESET_STORY"
      log_ok "Story reset — run again to re-execute"
      exit 0
    fi
    
    if [[ "$RESET_ALL" == true ]]; then
      log_warn "Resetting all non-done stories…"
      jq -r '.userStories[].id' "$PRD_FILE" | while read -r id; do
        _is_done "$id" && continue
        _reset_story "$id"
      done
      log_ok "All non-done stories reset"
      exit 0
    fi
    
    # Build loop
    project=$(jq -r '.project' "$PRD_FILE")
    iterations=0
    loop_start=$(date +%s)
    
    log_header "RALPH Loop — $project (BUILD MODE)"
    echo "  Model    : $MODEL_NAME"
    echo "  PRD      : $PRD_FILE"
    echo "  Max iter : ${MAX_LOOPS:-unlimited}"
    echo "  Started  : $(_timestamp)"
    echo ""
    
    while true; do
      if [[ $MAX_LOOPS -gt 0 ]] && [[ $iterations -ge $MAX_LOOPS ]]; then
        break
      fi
      
      if ! execute_iteration; then
        log_warn "Iteration $iterations failed; continuing…"
      fi
      
      iterations=$((iterations + 1))
      loop_elapsed=$(($(date +%s) - loop_start))
      log_info "Elapsed: ${loop_elapsed}s | Iterations: $iterations"
      echo ""
      
      # Check if all done
      total=$(jq '.userStories | length' "$PRD_FILE")
      done=$(count_done)
      if [[ $done -ge $total ]]; then
        log_ok "🎉 All $total stories completed!"
        break
      fi
    done
    
    show_status
    exit 0
    ;;
  
  *)
    log_error "Unknown mode: $MODE"
    exit 1
    ;;
esac
