# Feature plans

Each proposed feature gets its own directory:

```text
features/
  README.md
  wardrobes/
    PLAN.md
  usage-statistics/
    PLAN.md
```

These are **examples**, not plans that have already been approved.

## Workflow

- **Discuss:** agree on the problem, behaviour, constraints, and acceptance criteria.
- **Plan:** create `features/<feature-slug>/PLAN.md` and refine it with the project owner before any implementation.
- **Authorise:** do not write feature code until the owner explicitly says to start implementing.
- **Build:** create `feature/<feature-slug>` from `main`, then implement, test, and fix issues independently using the approved plan.
- **Deliver:** provide a concise implementation summary, checks performed, and concrete manual test instructions. Leave the branch for review; merge only on request.

For the full coding-agent agreement, read [AGENTS.md](../AGENTS.md).

## Suggested `PLAN.md` outline

```markdown
# Feature: <title>

Status: Draft | Agreed | In progress | Ready for review | Done

## Goal and motivation
## Scope and non-goals
## User stories and UX
## Data model and storage
## Technical approach and integration
## Migration/backward compatibility
## Edge cases and risks
## Acceptance criteria
## Automated and manual test plan
## Open questions / decisions
```

Keep the plan specific enough that implementation can proceed without repeated check-ins. If a question changes the agreed scope, pause that decision and ask the owner rather than silently redefining the feature.
