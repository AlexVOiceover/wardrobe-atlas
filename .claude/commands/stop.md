Stop the plan iterator loop.

## Instructions

1. Note the active plan, then remove the loop marker:
   ```bash
   head -n 1 .claude/loop 2>/dev/null; rm -f .claude/loop
   ```

2. Confirm to the owner: "Plan iterator stopped. Resume later by saying `start` (or `printf 'features/<slug>/PLAN.md\n' > .claude/loop`). The checklist stays in the plan's `## Tasks` section."
