# Codebase cleanup

Status: Owner asked for implementation and shipping on 2026-11-04.

Remove what the app doesn't use. Behaviour and saved data stay the same.

## Audit

- **Every app file is reachable.** Each one in `components/`, `screens/`, `utils/`, `redux/`, `hooks/` and `routers/` is imported by the app.
- **No unused variables:** `tsc --noUnusedLocals --noUnusedParameters` is clean.
- **No unused styles:** every `StyleSheet.create` entry is used.
- **No unused Redux actions** except one, listed below.
- **Translations:** 1 of 234 is unused.

## Removed

- **The iOS project** (owner):
  - `ios/` (the original Closet Archive Xcode project, never built here), `Gemfile`, the `ios` npm script and `@react-native-community/cli-platform-ios`.
  - The iOS entries in `.gitignore` and `react-native.config.js`.
  - The app is Android-only: its native modules (translation, background removal, garment isolation, updates) exist only in Kotlin.
- **`screens/stackNav/images.ts`.** It only exported `customCategorySprite = null`. New custom categories still save `spriteSheet: null`, written directly.
- **`setAppVer`.** The Redux action is never dispatched.
- **`NO_CATEGORY`.** The constant is never used.
- **The `Fit` translation.** The form no longer has a Fit field.
- **`@types/react-redux`.** react-redux 9 ships its own types.
- **`android/link-assets-manifest.json`.** It's an empty asset-linking manifest; no fonts or assets are linked.

## Kept on purpose

- **Saved fields** stay, so old data and backups still load and match:
  - `fit` on garments;
  - `appVer` in settings;
  - `spriteSheet` on categories.
- **`@react-native-community/datetimepicker` and `react-native-screens`.** They aren't imported directly, but other packages need them: `react-native-modal-datetime-picker` and React Navigation.
- **`@types/react-native-vector-icons`.** Version 10 has no types of its own.
- **`android/app/debug.keystore`.** Debug builds need it.
- **Feature plans and `.claude/`.** Project documentation and tooling.

## Acceptance checks

- `npx tsc --noEmit`, `npm run lint`, `npm test` and the Android build pass.
- No change in the app.

## Validation

- 188 tests pass across 21 suites. TypeScript and lint pass with zero warnings.
- The Android build runs on the PR.
