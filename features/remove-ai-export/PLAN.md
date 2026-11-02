# Remove AI text-copy export

Status: Removal explicitly requested by the owner on 2026-11-02. Implemented; delivery tracked by PR and main Android workflows.

## Scope

Remove the Settings text-copy action completely: section choices, confirmation, loading overlay, text generator, success message, translations, exclusive tests and unused clipboard dependency. Update documentation so it describes only supported exports. Keep shared confirmation dialogs needed for outfit logs.

## Compatibility and UX

Settings retains JSON backup export/import, language, username, usage display and update controls. No replacement action, data deletion, schema change or migration is needed. Existing clothes, wardrobes, photos and logs remain intact. Work from main on feature/remove-ai-export and publish through the normal validated PR/main Release flow.

## Acceptance and validation

Confirm no runtime text-generator or clipboard references remain, and no native clipboard module is autolinked. Run TypeScript, relevant lint and the remaining behavior tests, including backup round trips and Settings backup actions. Verify Android builds and the published update. Report phone testing separately.

Local verification: 49 tests pass across 10 suites (two tests belonging to the removed feature deleted; one Settings backup integration test added). TypeScript and targeted ESLint pass. Source/dependency audit finds no removed generator, overlay or clipboard imports; React Native autolinking configuration contains no clipboard dependency. No connected-phone test performed.
