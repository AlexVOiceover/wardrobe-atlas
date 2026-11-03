Add a task checklist to a feature plan, create the feature branch and wait for `start`.

## Arguments

- `$ARGUMENTS` - Feature slug (e.g., `outfit-stats`), matching `features/<slug>/PLAN.md`

## Instructions

1. **Find the feature plan**:
   - Read `features/$ARGUMENTS/PLAN.md`.
   - If not found, stop and tell the owner: "No plan found. Run `/next-feature $ARGUMENTS` first."
   - If it still has open decisions, list them and stop until the owner answers.

2. **Check implementation status**:
   - Search the codebase for the screens, components, Redux slices and tests the plan touches.
   - If fully implemented: tell the owner and stop.
   - If partially implemented: note what exists and focus the tasks on the remaining work.

3. **Create the feature branch** (from current `main`):
   - Make sure the working tree is clean apart from `scratchpad.md`; if not, stop and ask.
   - Run: `git checkout main && git pull --ff-only && git checkout -b feature/$ARGUMENTS`
   - If the branch already exists, check it out instead: `git checkout feature/$ARGUMENTS`

4. **Write the task checklist**:
   - Add (or replace) a `## Tasks` section in `features/$ARGUMENTS/PLAN.md`, just before `## Acceptance checks`.
   - Break the plan into numbered, actionable checkbox tasks (format below). Only this section is read by the loop.
   - Include a task for tests, and a final task for running `npx tsc --noEmit`, `npm run lint` and `npm test`.

**Claude stops here.** Do NOT create `.claude/loop` yet — the Stop hook would start working immediately. The owner reviews the tasks and says `start`.

## When the owner says `start`

That is the explicit instruction to implement (AGENTS.md item 3).

1. Confirm you are on `feature/<slug>`.
2. Update the plan's `Status:` line to say the owner authorized implementation, with today's date from `date +%F`.
3. Activate the loop: `printf 'features/<slug>/PLAN.md\n' > .claude/loop`
4. Start the first unchecked task. After each response the hook commits the finished task and hands you the next one.

## Tasks Format

```markdown
## Tasks

1. [ ] **Section Name**
   - [ ] 1.1 First step
   - [ ] 1.2 Second step

2. [ ] **Section Name**
   - [ ] 2.1 Next step
   - [ ] 2.2 Another step
```

## After the feature is complete

When every task is checked and the loop has stopped, the hook asks for checks, a plan update and a short report. Always end with a "How to test" summary so the owner can verify before shipping — one line per user-testable capability:

```
## How to test

* {Thing built}: {screen → button/action → expected result}
* {Other thing}: {how to test it}
```

Rules for the test summary:
- Lead with the thing, then the test. Name the tab (Closet, Outfits, More), screen, button and expected result.
- Skip purely internal work with no observable behaviour. If the whole feature is invisible, say what to run (e.g. `npm test -- <file>`) to confirm it.
- The phone check runs from the feature branch: `npm start` in one terminal and `npm run android` in another, with the phone connected over adb (see README).
- Mention saved-data effects: whether existing garments, logs and backups still load.

## Rules

- **Checkbox format**: `1. [ ]` for main tasks, `- [ ] 1.1` for subtasks (the hook reads these exactly, and only inside `## Tasks`)
- **Numbered structure**: numbered mains (1, 2, 3) with numbered subtasks (1.1, 1.2, etc.)
- **Small tasks**: each task = one focused, completable change
- **Logical order**: dependency-ordered
- **No time estimates**
- **The plan stays the source of truth**: record decisions and findings in it as you go
- **Always finish with the "How to test" summary** once the feature is complete
