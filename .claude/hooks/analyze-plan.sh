#!/usr/bin/env bash
set -euo pipefail

# Plan Iterator Analysis (read-only)
# Shows what the plan-iterator hook would see, using the same parser.
# Usage: bash .claude/hooks/analyze-plan.sh [features/<slug>/PLAN.md]
#        (defaults to the plan named in .claude/loop)

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"

PLAN_FILE="${1:-}"
if [[ -z "$PLAN_FILE" && -f .claude/loop ]]; then
  PLAN_FILE="$(head -n 1 .claude/loop | tr -d '[:space:]')"
fi

if [[ -z "$PLAN_FILE" || ! -f "$PLAN_FILE" ]]; then
  echo "No plan file. Pass features/<slug>/PLAN.md or start the loop first."
  exit 1
fi

echo "=== PLAN ITERATOR ANALYSIS ==="
echo "Plan file: $PLAN_FILE (section: ## Tasks)"
echo "Loop active: $([[ -f .claude/loop ]] && echo yes || echo no)"
echo "Branch: $(git branch --show-current)"
echo ""
echo "Expected formats:"
echo "  Main tasks: 1. [ ] Task"
echo "  Subtasks:   - [ ] 1.1 Task"
echo ""

IFS=$'\x1f' read -r REMAINING COMPLETED NEXT_TASK LAST_DONE TO_COMPLETE < <(
  awk -f .claude/hooks/parse-plan.awk "$PLAN_FILE"
)

echo "Leaf tasks remaining: ${REMAINING:-0}"
echo "Leaf tasks completed: ${COMPLETED:-0}"
echo "Next task: ${NEXT_TASK:-<none>}"
echo "Last done: ${LAST_DONE:-<none>}"
echo "Main tasks eligible for auto-complete: ${TO_COMPLETE:-<none>}"
