#!/usr/bin/env bash
set -euo pipefail

# Plan Iterator Hook (Stop event)
# Automatically continues through the "## Tasks" checklist of the active
# feature plan (features/<slug>/PLAN.md).
#
# Activation: .claude/loop exists and its first line is the plan path
#             (written when the owner says "start" after /execute)
# Deactivation:
#   - Complete all tasks (auto-removes marker)
#   - /stop, or manually delete .claude/loop

cd "${CLAUDE_PROJECT_DIR:-.}"

LOOP_MARKER=".claude/loop"

# Only run if loop marker exists (opt-in)
[[ -f "$LOOP_MARKER" ]] || exit 0

PLAN_FILE="$(head -n 1 "$LOOP_MARKER" | tr -d '[:space:]')"

# No plan file = stop and cleanup
if [[ -z "$PLAN_FILE" || ! -f "$PLAN_FILE" ]]; then
  rm -f "$LOOP_MARKER"
  exit 0
fi

# --- Helpers ---------------------------------------------------------------

json_escape() {
  python3 -c 'import sys,json; print(json.dumps(sys.stdin.read())[1:-1])'
}

block() {
  echo "{\"decision\": \"block\", \"reason\": \"$(printf '%s' "$1" | json_escape)\"}"
}

sanitize_git_subject() {
  # Read stdin, output a safe one-line git subject (<=72 chars), no newlines.
  # The script is passed with -c so stdin stays the piped task text.
  python3 -c '
import re, sys
s = " ".join(sys.stdin.read().split())  # collapse whitespace and newlines
s = s.replace("**", "").lstrip("-").strip()
s = re.sub(r"^[0-9]+(\.[0-9]+)?\s+", "", s)  # drop task numbering like "1.2 "
if len(s) > 72:
    s = s[:69] + "..."
print(s)
'
}

parse_plan() {
  awk -f .claude/hooks/parse-plan.awk "$PLAN_FILE"
}

# --- Guard: never auto-commit on main (AGENTS.md: unfinished work stays off main)

BRANCH="$(git branch --show-current 2>/dev/null || true)"
if [[ "$BRANCH" == "main" || -z "$BRANCH" ]]; then
  rm -f "$LOOP_MARKER"
  block "PLAN ITERATOR: Stopped. The current branch is '${BRANCH:-detached}', and the loop never commits there. Tell the owner, then switch to feature/<slug> and say 'start' again."
  exit 0
fi

# --- Parse, auto-complete finished mains, re-parse --------------------------

IFS=$'\x1f' read -r REMAINING COMPLETED NEXT_TASK LAST_DONE TO_COMPLETE < <(parse_plan)

if [[ -n "${TO_COMPLETE:-}" ]]; then
  for n in $TO_COMPLETE; do
    sed -i "/^## Tasks/,/^## /s/^${n}\.[[:space:]]*\\[ \\]/${n}. [x]/" "$PLAN_FILE"
  done
  IFS=$'\x1f' read -r REMAINING COMPLETED NEXT_TASK LAST_DONE _ < <(parse_plan)
fi

# --- Commit the finished task ----------------------------------------------

# scratchpad.md is the owner's ideas file and must never be committed.
git add -A -- . ':!scratchpad.md' ':!.claude/loop' ':!.claude/settings.local.json' >/dev/null 2>&1 || true

if ! git diff --cached --quiet 2>/dev/null; then
  if [[ "${COMPLETED:-0}" -gt 0 && -n "${LAST_DONE:-}" ]]; then
    SAFE_SUBJECT="$(printf '%s' "$LAST_DONE" | sanitize_git_subject)"
    if [[ -n "$SAFE_SUBJECT" ]]; then
      git commit -m "$SAFE_SUBJECT" >/dev/null 2>&1 || true
    fi
  fi
fi

# --- All tasks complete -----------------------------------------------------

if [[ "${REMAINING:-0}" -eq 0 ]]; then
  rm -f "$LOOP_MARKER"
  block "PLAN ITERATOR: All tasks in $PLAN_FILE are complete.

1. Run the checks and fix any failure: \`npx tsc --noEmit\`, \`npm run lint\`, \`npm test\`. Never claim a check passed unless it ran.

2. Update $PLAN_FILE so it stays the source of truth: status, changes found during implementation, validation (what ran and the results) and known limitations. Add it to features/README.md if missing. Commit it.

3. Give the owner a brief report, no narrative:
   - **What changed**: user-visible behaviour first, then notable internals
   - **Checks**: what ran and the results
   - **Saved data**: whether Redux/persist/backup data changed and how compatibility was handled
   - **How to test**: one bullet per user-testable capability (screen, button, expected result). The phone check runs from this branch with \`npm start\` and \`npm run android\`
   - **Limitations**: anything unfinished or untested

Then wait. Delivery happens with /ship."
  exit 0
fi

# --- Continue with the next task --------------------------------------------

block "PLAN ITERATOR: Continue with the next task in $PLAN_FILE.

## Current Progress
Completed: $COMPLETED | Remaining: $REMAINING

## Next Task
$NEXT_TASK

## Post-Task Checklist (do after completing the task above)

1. **Mark done**: Change \`1. [ ]\` or \`- [ ]\` to \`1. [x]\` or \`- [x]\` for the completed task in the Tasks section of $PLAN_FILE

2. **Working preferences**:
   - Keep changes small and focused; stay inside the agreed scope (ask only for genuine blockers or material scope changes)
   - Match existing patterns: tokens from utils/theme.ts, strings in utils/localization.ts (English and Spanish), shared components in components/
   - Preserve saved data and behaviour unless the plan changes them
   - Add or update Jest tests in __tests__/ for behaviour you change
   - Never modify or commit scratchpad.md
   - Never add AI attribution

## To Stop Early
Run /stop or delete .claude/loop"
