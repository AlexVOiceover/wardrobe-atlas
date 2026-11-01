# Wardrobe Atlas — Working Agreement for Coding Agents

These instructions apply to all contributors and AI coding agents working on this repository.

## Project workflow: plan first, implement only when requested

1. **Discuss first.** When a new feature is proposed, clarify its scope, expected behaviour, user experience, data changes, constraints, and acceptance criteria with the project owner. Do not start implementing it during this discussion.
2. **Write the plan.** Create and maintain `features/<feature-slug>/PLAN.md` at the repository root. This is the source of truth for that feature's agreed requirements and implementation plan. A plan should include goals, non-goals, proposed UX, data/storage changes, technical approach, migration/backward compatibility, edge cases, test/acceptance criteria, and open questions. Keep it up to date if decisions change.
3. **Wait for explicit go-ahead.** Writing or approving a plan is not permission to implement. Start implementation only when the project owner explicitly asks to implement that feature. Do not infer authorisation from silence.
4. **Create one branch per feature.** At implementation start, branch off the current `main` as `feature/<feature-slug>`. Keep feature code and relevant tests on that branch; do not commit unfinished feature work to `main`.
5. **Implement autonomously to completion.** Follow the agreed plan; make the code changes, add/update tests, run available checks, fix problems, and iterate until the acceptance criteria are met. Avoid routine progress messages or repeated confirmation requests. Only interrupt the project owner when a genuine blocker, missing decision, required permission, or material change of scope prevents responsible progress. No claim of passing tests without actually running them.
6. **Keep changes reviewable.** Prefer focused, understandable commits; avoid unrelated refactors. Update the feature plan with any agreed deviations and record any known limitations.
7. **Report briefly when complete.** Send a short summary, preferably bullets, covering (a) what was implemented, (b) tests/checks run and their results, and (c) specific steps to test it manually, including build/install instructions when applicable. Mention blockers or incomplete criteria clearly. Link to the feature branch or pull request.
8. **Do not merge or release automatically.** Keep the completed work on its branch for the owner's review. Merge to `main`, publish releases, or deploy only when the owner explicitly requests it.

## Repository conventions

- `features/` contains one folder per feature, e.g. `features/wardrobes/PLAN.md`; see `features/README.md`.
- `main` is the baseline; feature implementation belongs on `feature/<feature-slug>`.
- Do not change the upstream Closet-Archive repository. Work only in this fork.
- Preserve existing data and behaviour unless the agreed plan authorises changes. Plan and test migration/backward compatibility when changing persistent data.
- This workflow is a standing agreement; it does **not** by itself authorise implementing any particular feature.
