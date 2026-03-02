#!/usr/bin/env bash
# ralph-loop.sh — Ralph Loop for GitHub Copilot CLI
# Autonomous task loop: picks one task, calls copilot, records result, repeats.
#
# Usage: ./ralph-loop.sh [OPTIONS] [N]
#   (default)         Build mode — implement tasks autonomously
#   plan              Plan mode — generate/update IMPLEMENTATION_PLAN.md only
#   N                 Build mode, max N iterations (e.g. ./ralph-loop.sh 5)
#   --status          Show progress summary
#   -m, --model M     AI model (default: claude-sonnet-4.5)
#   -l, --loops N     Max iterations (same as positional N)
#   -r, --reset ID    Reset a story for re-execution
#   --reset-all       Reset all non-done stories
#   --prd FILE        PRD file path (default: prd.json)
#   -h, --help        Show this help

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
MODE="build"
MAX_LOOPS="${MAX_LOOPS:-0}"            # 0 = unlimited
MODEL_NAME="${MODEL_NAME:-claude-sonnet-4.5}"
COPILOT_TIMEOUT="${COPILOT_TIMEOUT:-900}"  # 15 min default
PRD_FILE="${PRD_FILE:-prd.json}"
PROGRESS_FILE="${PROGRESS_FILE:-progress.txt}"
PLAN_FILE="${PLAN_FILE:-IMPLEMENTATION_PLAN.md}"

# ── Colors / logging ──────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

log_info()   { echo -e "${CYAN}[INFO]${NC}  $*"; }
log_ok()     { echo -e "${GREEN}[✓]${NC}    $*"; }
log_warn()   { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
log_header() {
  echo ""
  echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}  $*${NC}"
  echo -e "${BOLD}${CYAN}════════════════════════════════════════${NC}"
}

# ── Argument parsing ──────────────────────────────────────────
RESET_STORY=""
RESET_ALL=false
while [[ $# -gt 0 ]]; do
  case $1 in
    plan|--plan)   MODE="plan";  shift ;;
    --build)       MODE="build"; shift ;;
    --status)      MODE="status"; shift ;;
    -l|--loops)    MAX_LOOPS="$2"; shift 2 ;;
    -m|--model)    MODEL_NAME="$2"; shift 2 ;;
    -r|--reset)    RESET_STORY="$2"; shift 2 ;;
    --reset-all)   RESET_ALL=true; shift ;;
    --prd)         PRD_FILE="$2"; shift 2 ;;
    -h|--help)     sed -n '2,15p' "$0" | sed 's/^# \?//'; exit 0 ;;
    [0-9]*)        MAX_LOOPS="$1"; shift ;;
    *)             log_error "Unknown option: $1"; exit 1 ;;
  esac
done

# ── Validate ──────────────────────────────────────────────────
for cmd in jq copilot; do
  command -v "$cmd" &>/dev/null || { log_error "'$cmd' is required"; exit 1; }
done
[[ -f "$PRD_FILE" ]] || { log_error "PRD file not found: $PRD_FILE"; exit 1; }
[[ -f PROMPT.md ]]   || { log_error "PROMPT.md not found"; exit 1; }

# ── Setup ─────────────────────────────────────────────────────
if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo "# RALPH Progress — format: ID | status | timestamp | notes" > "$PROGRESS_FILE"
fi

# ── Helper functions ──────────────────────────────────────────
_ts()            { date '+%Y-%m-%d %H:%M:%S'; }
_is_done()       { grep -q "^${1} | done |"   "$PROGRESS_FILE" 2>/dev/null; }
_is_failed()     { grep -q "^${1} | failed |" "$PROGRESS_FILE" 2>/dev/null; }
_record_done()   { echo "${1} | done | $(_ts) | ${2:-OK}" >> "$PROGRESS_FILE"; }
_record_failed() { echo "${1} | failed | $(_ts) | ${2:-Failed}" >> "$PROGRESS_FILE"; }
_reset_story()   { sed -i "/^${1} |/d" "$PROGRESS_FILE"; log_info "Reset $1"; }

count_done() {
  local n
  n=$(grep -c " | done |" "$PROGRESS_FILE" 2>/dev/null) || true
  echo "${n:-0}"
}

count_failed() {
  local n
  n=$(grep -c " | failed |" "$PROGRESS_FILE" 2>/dev/null) || true
  echo "${n:-0}"
}

# ── Generate IMPLEMENTATION_PLAN.md ───────────────────────────
generate_plan() {
  local project description total dc
  project=$(jq -r '.project' "$PRD_FILE")
  description=$(jq -r '.description' "$PRD_FILE")
  total=$(jq '.userStories | length' "$PRD_FILE")
  dc=$(count_done)

  {
    echo "# IMPLEMENTATION PLAN"
    echo ""
    echo "**Project:** $project"
    echo "**Description:** $description"
    echo "**Progress:** $dc / $total completed"
    echo ""
    echo "## Tasks"
    echo ""

    jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE" | while IFS= read -r story; do
      local sid stitle pri mark
      sid=$(echo "$story" | jq -r '.id')
      stitle=$(echo "$story" | jq -r '.title')
      pri=$(echo "$story" | jq -r '.priority')
      if   _is_done "$sid";   then mark="✓"
      elif _is_failed "$sid"; then mark="✗"
      else                         mark=" "
      fi
      echo "- [$mark] **$sid** (P$pri) — $stitle"
    done
  } > "$PLAN_FILE"

  log_ok "Generated $PLAN_FILE"
}

# ── Show status ───────────────────────────────────────────────
show_status() {
  local project total_n done_n fail_n pend_n
  project=$(jq -r '.project' "$PRD_FILE")
  total_n=$(jq '.userStories | length' "$PRD_FILE")
  done_n=$(count_done)
  fail_n=$(count_failed)
  pend_n=$(( total_n - done_n - fail_n ))
  [[ $pend_n -lt 0 ]] && pend_n=0

  log_header "RALPH Status — $project"
  echo ""
  printf "  %-10s %-60s %s\n" "ID" "Title" "Status"
  printf "  %-10s %-60s %s\n" "──────────" "────────────────────────────────────────────────────────────" "────────"

  jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE" | while IFS= read -r story; do
    local sid stitle lbl
    sid=$(echo "$story" | jq -r '.id')
    stitle=$(echo "$story" | jq -r '.title' | cut -c1-60)
    if   _is_done "$sid";   then lbl="${GREEN}done${NC}"
    elif _is_failed "$sid"; then lbl="${RED}failed${NC}"
    else                         lbl="${CYAN}pending${NC}"
    fi
    printf "  %-10s %-60s " "$sid" "$stitle"
    echo -e "$lbl"
  done

  echo ""
  echo -e "  Total: ${total_n}  |  ${GREEN}Done: ${done_n}${NC}  |  ${CYAN}Pending: ${pend_n}${NC}  |  ${RED}Failed: ${fail_n}${NC}"
  echo ""
}

# ── Execute one iteration ────────────────────────────────────
# Returns: 0 = task completed, 1 = task failed, 2 = no pending tasks
execute_iteration() {
  generate_plan

  # Find next pending story (sorted by priority)
  local next_id=""
  while IFS= read -r story; do
    local sid
    sid=$(echo "$story" | jq -r '.id')
    if ! _is_done "$sid" && ! _is_failed "$sid"; then
      next_id="$sid"
      break
    fi
  done < <(jq -c '.userStories | sort_by(.priority)[]' "$PRD_FILE")

  if [[ -z "$next_id" ]]; then
    log_ok "No more pending tasks"
    return 2
  fi

  # Extract story details
  local task_json story_title story_desc story_criteria
  task_json=$(jq -c ".userStories[] | select(.id == \"$next_id\")" "$PRD_FILE")
  story_title=$(echo "$task_json" | jq -r '.title')
  story_desc=$(echo "$task_json" | jq -r '.description')
  story_criteria=$(echo "$task_json" | jq -r '.acceptanceCriteria[]' | sed 's/^/- /')

  log_header "[$next_id] $story_title"
  echo ""
  echo "  $story_desc"
  echo ""
  echo "Criteria:"
  echo "$story_criteria"
  echo ""

  # Build prompt
  local prompt_file prompt
  prompt_file=$(mktemp)
  trap "rm -f '$prompt_file'" RETURN

  {
    cat PROMPT.md
    echo ""
    echo "## Current Task"
    echo ""
    echo "**Story ID:** $next_id"
    echo "**Title:** $story_title"
    echo "**Description:** $story_desc"
    echo ""
    echo "**Acceptance Criteria:**"
    echo "$story_criteria"
  } > "$prompt_file"

  prompt=$(<"$prompt_file")

  # Call copilot
  local start_time exit_code elapsed
  start_time=$(date +%s)
  log_info "Calling copilot -p ... --yolo --model $MODEL_NAME (timeout ${COPILOT_TIMEOUT}s)"

  exit_code=0
  timeout "$COPILOT_TIMEOUT" copilot -p "$prompt" --yolo --model "$MODEL_NAME" 2>&1 || exit_code=$?

  elapsed=$(( $(date +%s) - start_time ))
  echo ""

  # Record result
  if [[ $exit_code -eq 0 ]]; then
    log_ok "✓ Completed $next_id (${elapsed}s)"
    _record_done "$next_id" "Completed in ${elapsed}s"
    return 0
  elif [[ $exit_code -eq 124 ]]; then
    log_warn "⏱️  $next_id timed out after ${COPILOT_TIMEOUT}s"
    _record_failed "$next_id" "Timed out (${COPILOT_TIMEOUT}s)"
    return 1
  else
    log_warn "✗ $next_id failed (exit $exit_code, ${elapsed}s)"
    _record_failed "$next_id" "Exit $exit_code (${elapsed}s)"
    return 1
  fi
}

# ── Main ──────────────────────────────────────────────────────
case "$MODE" in
  plan)
    log_header "PLANNING MODE"
    generate_plan
    ;;

  status)
    show_status
    ;;

  build)
    # Handle reset flags
    if [[ -n "$RESET_STORY" ]]; then
      _reset_story "$RESET_STORY"
      log_ok "Story reset — run again to re-execute"
      exit 0
    fi
    if [[ "$RESET_ALL" == true ]]; then
      log_warn "Resetting all non-done stories…"
      jq -r '.userStories[].id' "$PRD_FILE" | while IFS= read -r sid; do
        _is_done "$sid" && continue
        _reset_story "$sid"
      done
      log_ok "All non-done stories reset"
      exit 0
    fi

    # Build loop
    project=$(jq -r '.project' "$PRD_FILE")
    iterations=0
    loop_start=$(date +%s)

    log_header "RALPH Loop — $project"
    echo "  Model   : $MODEL_NAME"
    echo "  PRD     : $PRD_FILE"
    echo "  Timeout : ${COPILOT_TIMEOUT}s per task"
    echo "  Max iter: ${MAX_LOOPS} (0=unlimited)"
    echo "  Started : $(_ts)"
    echo ""

    while true; do
      # Check iteration limit
      if [[ $MAX_LOOPS -gt 0 && $iterations -ge $MAX_LOOPS ]]; then
        log_info "Reached max iterations ($MAX_LOOPS)"
        break
      fi

      # Run one iteration
      iter_rc=0
      execute_iteration || iter_rc=$?

      if [[ $iter_rc -eq 2 ]]; then
        # No pending tasks remain
        log_ok "🎉 All pending tasks processed!"
        break
      fi

      iterations=$((iterations + 1))
      loop_elapsed=$(( $(date +%s) - loop_start ))
      log_info "Elapsed: ${loop_elapsed}s | Iterations: $iterations"
      echo ""
    done

    show_status
    ;;

  *)
    log_error "Unknown mode: $MODE"
    exit 1
    ;;
esac
