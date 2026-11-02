# Working agreement

Applies to this repository and all contributors or coding agents.

1. Discuss each new feature with the owner: scope, behavior, UX, data changes, constraints and acceptance criteria. Do not implement during discussion.
2. Write the agreed plan in `features/<feature-slug>/PLAN.md`. Cover goals/non-goals, UX, implementation, storage/migration, edge cases, acceptance checks and open decisions. Keep it current; it is the feature's source of truth.
3. Wait for the owner's explicit instruction to implement. Plan approval alone and silence do not authorize implementation.
4. Start implementation from current `main` on `feature/<feature-slug>`. Keep unfinished work off `main`.
5. Once authorized, implement autonomously: finish the agreed work, run relevant checks, fix failures and update the plan. Ask only for genuine blockers, missing decisions, required permission or material scope changes. Never claim unrun tests passed.
6. Keep commits focused. Preserve existing data and behavior unless the agreed scope changes them; plan and test compatibility when persistent data changes.
7. Report briefly: changes, checks/results, limitations and manual build/install/test steps. Link the branch or PR.
8. Deliver requested app changes through validated PRs, merge to `main` and verify the published Release so installed apps receive updates. The owner authorized this as the default delivery flow on 2026-11-02. Respect any explicit review-only instruction. Do not send APK download links unless requested. Android installation approval remains with the owner.

Work only in this fork; do not modify the upstream Closet-Archive repository. These rules do not authorize any feature by themselves. See [feature plans](features/README.md).
