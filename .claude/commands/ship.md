Commit pending work, run quality checks, open a PR, wait for the Android build, merge into main and verify the published Release.

## Arguments

- `$ARGUMENTS` - Optional. `review-only` stops after the PR build passes (no merge, no Release).

## Instructions

Always pass `-R AlexVOiceover/wardrobe-atlas` to `gh` — a bare `gh` resolves to the upstream repository, which must never be touched.

1. **Get current branch** — run `git branch --show-current` and save as `BRANCH`. If it is `main`, stop and tell the owner there is nothing to ship.

2. **Commit pending work** — stage everything except local files:
   `git add -A -- . ':!scratchpad.md' ':!.claude/loop' ':!.claude/settings.local.json' ':!.vscode/settings.json'`
   If `git diff --cached --quiet` reports staged changes, derive a commit message from them and commit (no AI attribution). Never stage `scratchpad.md`.

3. **Quality checks** — run these before pushing:
   - `npx tsc --noEmit`
   - `npm run lint` (zero warnings allowed)
   - `npm test`
   - If any fails, fix it, commit the fix and re-run until clean. Never claim a check passed unless it ran.

4. **Update the plan** — make sure `features/<slug>/PLAN.md` records the status, changes found during implementation, validation results and known limitations, and that `features/README.md` links it. Commit if changed.

   There is no version bump: CI sets the version to `0.1.<run number>` and publishes Release `v0.1.<run number>` from each push to `main`.

5. **Push and open the PR**:
   ```
   git push -u origin $BRANCH
   gh pr create -R AlexVOiceover/wardrobe-atlas --base main --head $BRANCH --title "<title>" --body "<body>"
   ```
   - Title: short, imperative, user-facing (e.g. "Add outfit statistics").
   - Body: what changed, checks run with results, saved-data impact, limitations, and a link to the plan. No APK download links.
   - If a PR for the branch already exists, reuse it.

6. **Wait for the PR build** — `gh pr checks <number> -R AlexVOiceover/wardrobe-atlas --watch`. If the `android` check fails, read the log (`gh run view <run-id> -R AlexVOiceover/wardrobe-atlas --log-failed`), fix, commit, push and wait again.

   If `$ARGUMENTS` is `review-only`, stop here and report the PR link.

7. **Merge into main** (squash, like earlier PRs):
   ```
   gh pr merge <number> -R AlexVOiceover/wardrobe-atlas --squash --delete-branch
   git checkout main
   git pull --ff-only origin main
   git branch -D $BRANCH 2>/dev/null || true
   ```

8. **Verify the Release** — find the `main` run for the merge commit and wait for it:
   ```
   gh run list -R AlexVOiceover/wardrobe-atlas --branch main --limit 3
   gh run watch <run-id> -R AlexVOiceover/wardrobe-atlas --exit-status
   gh release view -R AlexVOiceover/wardrobe-atlas --json tagName,isDraft,targetCommitish,assets
   ```
   Confirm the latest Release is not a draft, targets the merge commit and contains `Wardrobe-Atlas.apk`.

9. **Confirm** — tell the owner:
   - The PR link and that it was merged and the branch deleted.
   - The Release tag (e.g. *"v0.1.39 is published from commit `<sha>`"*) — installed apps will offer the update.
   - Anything still untested, especially the phone check.

## Rules

- **Never touch the upstream repository**; every `gh` call uses `-R AlexVOiceover/wardrobe-atlas`.
- **Respect `review-only`**: no merge and no Release.
- **Don't send APK download links** unless the owner asks. Installing on Android stays with the owner.
- **Don't include AI attribution** in commit messages or PR bodies.
- **Never commit `scratchpad.md`.**
- **If CI or the Release fails**, stop and surface the error — don't report success.
- **Don't edit `.github/workflows/`** — the current token lacks the `workflow` scope; ask the owner to run `gh auth refresh -h github.com -s workflow` first.
