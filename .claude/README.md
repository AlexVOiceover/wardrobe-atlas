# Claude Code Workflow

Automation for the feature workflow in [AGENTS.md](../AGENTS.md): discuss → plan → explicit go → branch → loop → PR → Release.

## Quick Reference

| Command | Description |
|---------|-------------|
| `/next-feature [slug or idea]` | Draft `features/<slug>/PLAN.md` from a discussion or a `scratchpad.md` idea |
| `/execute <slug>` | Add a task checklist to the plan, create `feature/<slug>` and wait |
| `start` | The owner's go: activates the loop and begins task 1 |
| `/stop` | Stop the loop early |
| `/ship [review-only]` | Checks → PR → Android build → squash merge → verify Release |

---

## User Guide

### Starting a new feature

**Step 1 — Plan it:**

```
/next-feature outfit-stats
```

Claude discusses the idea, reads the relevant code and writes `features/outfit-stats/PLAN.md` (goals, non-goals, UX, implementation, storage, edge cases, acceptance checks, open decisions). Answer the open decisions and adjust the plan.

Ideas can live in `scratchpad.md`. Claude reads it but never edits or commits it.

**Step 2 — Prepare implementation:**

```
/execute outfit-stats
```

Claude checks what already exists, creates `feature/outfit-stats` from current `main` and adds a `## Tasks` checklist to the plan. **Claude stops and waits.**

**Step 3 — Start:**

Say `start`. That is the explicit go. Claude writes the plan path to `.claude/loop` and works through the tasks; after each response the hook commits the finished task and hands over the next one.

**Step 4 — When the loop ends:**

Claude runs `tsc`, lint and tests, updates the plan and gives a short report with "How to test". Check it on the phone from the branch (`npm start` + `npm run android`), then run `/ship`.

**Step 5 — Ship:**

```
/ship              # PR, wait for the Android build, merge, verify Release v0.1.<n>
/ship review-only  # stop after the PR build passes
```

Installed apps pick up the new Release through the in-app update.

---

### Stopping and resuming

```
/stop                                                # pause; the checklist stays in the plan
printf 'features/<slug>/PLAN.md\n' > .claude/loop   # resume from the first unchecked task
```

Inspect what the loop sees without changing anything:

```
bash .claude/hooks/analyze-plan.sh [features/<slug>/PLAN.md]
```

---

### What the loop does automatically

After each Claude response the hook (`.claude/hooks/plan-iterator.sh`):

1. Reads the plan path from `.claude/loop`
2. Stops (and removes the marker) if the branch is `main` — the loop never commits there
3. Parses the `## Tasks` section and finds the next unchecked task
4. Marks a main task `[x]` once all its subtasks are done
5. Commits the finished task (never `scratchpad.md`, `.claude/loop` or local settings)
6. Injects the next task, or the wrap-up steps when everything is `[x]` (and deletes `.claude/loop`)

---

## Files

| File | Purpose |
|------|---------|
| `features/<slug>/PLAN.md` | Feature plan and source of truth; its `## Tasks` section drives the loop |
| `features/README.md` | Index of feature plans |
| `scratchpad.md` | Owner's ideas file — local only, never edited or committed |
| `.claude/loop` | Marker that activates the iterator; first line is the plan path (local only) |
| `.claude/settings.json` | Registers the Stop hook and shared permissions |
| `.claude/settings.local.json` | Personal permissions (gitignored) |
| `.claude/hooks/plan-iterator.sh` | The auto-loop hook |
| `.claude/hooks/parse-plan.awk` | Task checklist parser shared by the hook and the analysis script |
| `.claude/hooks/analyze-plan.sh` | Read-only view of the loop state |
| `.claude/commands/next-feature.md` | `/next-feature` command |
| `.claude/commands/execute.md` | `/execute` command |
| `.claude/commands/stop.md` | `/stop` command |
| `.claude/commands/ship.md` | `/ship` command |
