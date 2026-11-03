# Parses the "## Tasks" section of a feature PLAN.md (leaf-only semantics).
# Shared by plan-iterator.sh and analyze-plan.sh. Outputs one line separated by
# \x1f (not tabs: bash read collapses empty tab-separated fields):
# remaining, completed, next task, last done, mains to auto-complete.

function trim(s) { sub(/^[[:space:]]+/, "", s); sub(/[[:space:]]+$/, "", s); return s }
function after_checkbox(s) {
  # main: "1. [ ] Task"  sub: "   - [ ] 1.1 Task"
  gsub(/^[[:space:]]*[0-9]+\.[[:space:]]*\[[ x]\][[:space:]]*/, "", s)
  gsub(/^[[:space:]]*-[[:space:]]*\[[ x]\][[:space:]]*/, "", s)
  return trim(s)
}

BEGIN { remaining = 0; completed = 0; next_task = ""; last_done = ""; in_tasks = 0 }

/^## / { in_tasks = ($0 ~ /^## Tasks[[:space:]]*$/); next }
!in_tasks { next }

# Main task: incomplete (strict [ ])
/^[0-9]+\.[[:space:]]*\[ \]/ {
  n = $0; sub(/\..*$/, "", n)
  main_state[n] = "incomplete"; main_text[n] = after_checkbox($0)
  if (!(n in order_seen)) { order[++mains] = n; order_seen[n] = 1 }
  next
}

# Main task: complete (strict [x])
/^[0-9]+\.[[:space:]]*\[x\]/ {
  n = $0; sub(/\..*$/, "", n)
  main_state[n] = "complete"; main_text[n] = after_checkbox($0)
  if (!(n in order_seen)) { order[++mains] = n; order_seen[n] = 1 }
  next
}

# Subtask: strict [ ] or [x], with a leading number like 1.1, 2.3
/^[[:space:]]*-[[:space:]]*\[[ x]\][[:space:]]*[0-9]+\.[0-9]+/ {
  status = ($0 ~ /^[[:space:]]*-[[:space:]]*\[x\]/) ? "x" : " "
  n = $0
  sub(/^[[:space:]]*-[[:space:]]*\[[ x]\][[:space:]]*/, "", n)
  sub(/\..*$/, "", n)
  sub_any[n] = 1
  if (status == "x") {
    sub_complete[n]++; completed++; last_done = after_checkbox($0)
  } else {
    sub_incomplete[n]++; remaining++
    if (next_task == "") next_task = after_checkbox($0)
  }
  next
}

END {
  # Standalone mains (no subtasks) are leaf/actionable, in file order
  for (i = 1; i <= mains; i++) {
    n = order[i]
    if (sub_any[n]) continue
    if (main_state[n] == "complete") { completed++; last_done = main_text[n] }
    else { remaining++; if (next_task == "") next_task = main_text[n] }
  }

  # Incomplete mains whose subtasks are all done (and at least one exists)
  to_complete = ""
  for (n in sub_any) {
    if (main_state[n] == "incomplete" && sub_incomplete[n] == 0 && sub_complete[n] > 0) {
      to_complete = to_complete (to_complete ? " " : "") n
    }
  }

  printf "%d\037%d\037%s\037%s\037%s\n", remaining, completed, next_task, last_done, to_complete
}
