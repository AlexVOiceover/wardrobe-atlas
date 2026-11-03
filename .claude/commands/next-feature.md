Draft the next feature plan in `features/<slug>/PLAN.md`, following AGENTS.md.

## Arguments

- `$ARGUMENTS` - Optional slug (e.g., `outfit-stats`) or a short description of the idea. If omitted, use the feature currently being discussed; if nothing is being discussed, read `scratchpad.md` and suggest candidates.

## Instructions

1. **Find the feature**:
   - If a feature was discussed in this conversation, use that discussion as the scope.
   - Otherwise read `scratchpad.md` (the owner's ideas file — read only, never edit, delete or commit it). If it has ideas, list them briefly and ask which one to plan. If it is empty, ask the owner what to build.
   - Check `features/README.md` and existing `features/*/PLAN.md` so you don't duplicate or contradict a plan.

2. **Discuss before writing** (AGENTS.md item 1):
   - Read the relevant code (screens/, components/, redux/, utils/) to ground the plan.
   - If scope, behaviour, UX, data changes or acceptance criteria are unclear, ask the owner first. Do not implement anything.

3. **Pick the slug**:
   - Use `$ARGUMENTS` if it is already a kebab-case slug; otherwise derive a short kebab-case slug from the feature name.
   - Stop if `features/<slug>/` already exists — update that plan instead.

4. **Write the plan**:
   - Create `features/<slug>/PLAN.md` in the format below.
   - Add a link line to `features/README.md`.

5. **Confirm**:
   - Tell the owner the path and list the open decisions.
   - Suggest: "Review and adjust the plan, then run `/execute <slug>`."

## Plan Format

```markdown
# {Feature title}

Status: Draft — awaiting the owner's go.

{One paragraph: the problem and what this feature delivers.}

## Goals

- {Outcome}

## Non-goals

- {Thing deliberately left out}

## UX

{Screens, navigation, labels (English and Spanish), empty states. ASCII sketch if it helps.}

## Implementation

- `{path}`: {change}

## Storage and compatibility

{Redux / redux-persist / backup changes and migration, or "No saved-data changes."}

## Edge cases

- {Case}

## Acceptance checks

- {Observable check}
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass, with tests added for new behaviour.
- Phone check by the owner through `npm run android`.

## Open decisions

1. {Question} — recommendation: {answer}
```

## Rules

- Keep scope tight — one feature should be completable in one focused session.
- Always include Non-goals to prevent scope creep.
- Persistent data changes need a compatibility plan (old saved data and old backups must still load).
- Writing the plan does not authorize implementation.
