# Minimal functional base

Status: Merged in [PR #2](https://github.com/AlexVOiceover/wardrobe-atlas/pull/2). Scope and implementation approved on 2026-11-01. Documentation cleanup was subsequently authorized in the same chat.

## Scope and acceptance

- Plain light UI: system fonts, neutral colors, labeled lists/buttons/forms. Keep only layout, contrast and interaction styles.
- Remove custom animation, carousels, sprites, decorative artwork/fonts and unused styling dependencies. Disable configurable navigation/Paper animations. Platform behavior and functional input feedback remain.
- Preserve wardrobe operations, photos, garment colors/filters, categories/types, collections, logs/statistics, settings, import/export and Android updates.
- Replace colored usage indicators with text. Remove appearance-only collection color and custom category icon editors, retaining their saved fields for compatibility.
- Preserve application ID, signing key, storage schema and import/export format. No upstream changes, redesign, new product features or iOS validation.

## Implementation

Static React Native layout, ordinary state for panel visibility, plain full-width garment lists and category navigation. Selection reflects parent state; filters close with Close or Android Back. No replacement styling framework.

Removed NativeWind, Tailwind, Reanimated, carousel, Worklets and splash-screen packages, plus decorative assets and custom typefaces. Retained Paper controls, dropdown/date/color controls and functional icon fonts. Gesture handler is required by dropdown-picker. Garment color wheel, HEX input and automatic photo colors remain.

Documentation is limited to the README, working agreement and current plans. Removed upstream promotional/store metadata, unused Fastlane publishing setup, screenshots, badges, donations, template text and stale roadmap. Original attribution and MIT license remain.

## Verified

- [Android build #14](https://github.com/AlexVOiceover/wardrobe-atlas/actions/runs/41343570015), commit `943a693`: signed ARM64 APK succeeds.
- APK: 24,622,742 bytes versus 64,459,518 bytes in v0.1.10; 61.8% smaller. Removed sprites, custom fonts and animation libraries are absent from the APK archive.
- TypeScript and production JS bundling pass. ESLint has no errors in app/components/screens/navigation and new tests; style warnings remain.
- Nine tests pass: six APK-update tests, controlled garment selection, idempotent filter dismissal and garment-color picker state/save.

## Phone checks pending

Install over v0.1.10 and check existing data, then:

1. Navigate all screens; add/edit/delete garments and categories/types, including bulk entry.
2. Exercise camera/import/reset/photo preview, wheel/HEX/automatic colors and garment fields.
3. Create/rename/reorder/delete collections; verify membership, sorting and expansion.
4. Search/filter by name, category, type, season and color; close filters both ways.
5. Select garments; create/edit/delete outfit logs; check counts/statistics and text recency.
6. Exercise settings, backup import/export.
7. Check scrolling, keyboard access, small screens, dark-mode readability and APK updates.

Full phone parity, data preservation on an installed device, iOS compilation and end-to-end updating remain unverified. See the current core-cleanup plan for subsequent changes.
