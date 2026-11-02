# Core cleanup

Status: Owner requested implementation on 2026-11-02. Keep changes on a feature branch for review.

## Contract
- English and Spanish only across translations, clothing/season lists, settings and layouts. Remove unused packs and directional-layout branches.
- Remove the seven-character username cap.
- Keep core garment, collection and outfit logging only; remove garment-care UI/state and the entire background-prompt stack, including native integrations, permissions, dependencies, exports and old cleanup handlers.
- Use a versioned, allowlisted data format. Preserve garments/photos, collections, logs, custom categories and current settings while omitting any fields outside the supported model. Preserve Spanish from older saved data/backups; unsupported language settings fall back to English.
- No placeholder fields or retired runtime features. Do not rewrite Git history.

## Approach and checks
Normalize persisted state and backups through one current-schema boundary; identify new format with version 1 and persistence version 1. Translate previous Spanish index 2 to current index 1; current-format Spanish index 1 stays Spanish. Existing custom category labels remain user data. Keep default wardrobe values stable across languages.

Test normalization, versioned round trips, language packs, core logging and long usernames. Run TypeScript, relevant lint, production bundle and signed Android build; inspect the APK for removed native components. Phone checks: existing data, language selection, import/export, long names, garment forms and outfit logging. Merge/publish requires a separate instruction.

## Verification

20 behavior tests pass, including schema filtering, old Spanish preference conversion, versioned backup round trips, long usernames, stable bilingual clothing values and core outfit logging/export. TypeScript and targeted ESLint pass. Production Android JS bundle generates successfully. Source/native integration audit and Android XML parsing pass. Signed APK compilation and phone checks are tracked in the PR.
