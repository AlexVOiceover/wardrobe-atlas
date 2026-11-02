# Android icon and removal of logging reminders

Status: Implementation and publication explicitly requested by the owner on 2026-11-02.

## Scope
- Replace all Android launcher icon variants with a neutral, code-native WA monogram, including adaptive, round and themed icons.
- Remove periodic prompts to log outfits and their settings toggle/text. Preserve manual logs and laundry features.
- Cancel the old logging alarm (notification ID 1), its persisted schedule and delivered notification during app startup and package replacement, without requiring a launch after updating.
- Keep the application ID, development signing key and wardrobe data compatible. Keep the obsolete settings field false for old exports/persisted data; imports cannot re-enable it.
- Publish a newer main Release so the existing updater can offer it. Installation still requires Android confirmation.

## Implementation and checks
Use vector/adaptive launcher resources. Replace the logging scheduler with narrowly scoped legacy-alarm cleanup; laundry retains ID 2. Test old-reminder cancellation, laundry enabled/disabled behavior and import compatibility. Run TypeScript, targeted lint and all behavior tests; verify signed Android APK compilation before merging, then verify a newer public release and asset.

Phone acceptance: update from v0.1.17, confirm Android installation prompt and WA launcher icon, confirm no future logging prompts, check saved wardrobe/manual logging and laundry settings. Launcher icon refresh and physical-phone updating require device verification.

## Local verification

14 behavior tests pass, including cancellation of legacy ID 1, preserved laundry scheduling/disabled behavior and legacy-backup import. TypeScript and targeted ESLint pass. Android XML parses and all original launcher bitmaps are removed. The WA vector was rendered and visually checked. Native cleanup runs at application creation and MY_PACKAGE_REPLACED; Android APK compilation and phone installation checks remain pending.
