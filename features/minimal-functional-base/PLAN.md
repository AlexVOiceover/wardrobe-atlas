# Feature: Minimal functional base

Status: In progress — owner approved scope and implementation in chat on 2026-11-01.

## Goal
Remove the existing visual design and animation layers to provide a small, plain, functional base for future development. Reduce unnecessary UI code, bundled assets and dependencies rather than merely recoloring the current design.

## Scope and UX
- Use system fonts, a neutral white background, dark text, simple borders and standard controls. Retain only layout, spacing, sizing and contrast needed to operate the app.
- Replace decorative cards, custom tabs, sprites and animated category carousels with plain labeled buttons, lists and forms.
- Remove custom animation code, navigation transitions where configurable, animated drawers, decorative splash artwork, custom fonts, shadows, gradients and decorative imagery.
- Keep every existing user operation reachable: clothing and category management, collections, filters, outfit/event logs, laundry functions, photos, settings, import/export and Android updates.
- Keep user photos and garment color information, color selection and filtering: these are wardrobe functionality. Present color values plainly; retain a functional color selector where required.
- Use text and borders to identify selections, errors and disabled controls; do not rely solely on color.
- Keep scrolling, keyboard handling, safe areas, readable touch targets, loading/error feedback and accessibility labels.
- Platform-controlled effects such as the Android installer are outside this app's animation scope.

## Data and compatibility
No storage schema, persisted identifiers or application ID changes. Preserve existing user data, import/export format, signing continuity and update behavior. Existing appearance-only stored values may remain for compatibility without driving UI; remove obsolete appearance controls.

## Technical approach
1. Inventory each route, action, dialog and control before replacement; record a manual parity checklist.
2. Introduce small shared plain UI primitives using React Native core components and a minimal shared neutral style definition.
3. Replace animation-driven state with ordinary React state, preserving visibility, selection, navigation and dismissal behavior.
4. Simplify navigation and every screen/component. Replace UI packages only after their functional responsibilities have a working replacement.
5. Remove unused animation/carousel/styling packages, their Babel/Metro/Tailwind configuration and bundled decorative assets/custom fonts after checking all references and native integration. Retain transitive dependencies required by remaining functional libraries.
6. Split functional color utilities from appearance tokens as needed; do not delete color categorization or filtering logic.
7. Keep React Native, navigation, Redux/persistence, image/camera/storage utilities, notifications and the update service as required by existing behavior.
8. Update this plan with actual dependency removals, validation results and remaining limitations. Work on feature/minimal-functional-base; no merge or release without explicit owner instruction.

## Risks and edge cases
Animation values currently control visibility and positioning in some components; simply deleting styles can hide actions. Third-party controls may depend on gesture/animation packages. Neutral styling must remain readable regardless of system dark mode and keyboard state. Removing asset references must include Android/iOS font and splash configuration where relevant. APK size and build-time improvement must be measured, not promised.

## Acceptance criteria
- All current operations remain reachable through plain UI with no intentional loss of functionality or data.
- No custom decorative animation, custom fonts, branded palette or decorative assets remain in the active UI/bundle.
- Remaining styles serve readability, layout, contrast or interaction.
- Unused direct styling/animation dependencies and configuration are removed; any retained dependency is documented with its functional reason.
- Existing APK update tests pass and Android release build succeeds.
- Before/after APK size and dependency removal list are recorded; no specific reduction is guaranteed.
- Phone validation covers navigation, CRUD, photos, color filters, collections, logs, laundry, settings, import/export and update behavior with existing data.

## Verification
Run targeted behavioral tests for changed interaction/state logic, existing update tests, TypeScript/lint checks with any pre-existing failures identified, and CI Android release compilation on the feature PR. Do not add snapshot tests for purely cosmetic removals. Manual phone validation is required to establish full interaction parity; report anything not exercised.

## Proposed decisions for owner review
- Interpret “remove colors” as removing UI decoration, while retaining garment color data and controls.
- Target a single neutral light UI for this baseline, with system fonts and basic layout only.
- Preserve current functionality; remove visual complexity and unused libraries rather than product features.
