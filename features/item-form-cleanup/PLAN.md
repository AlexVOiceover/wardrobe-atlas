# Item form cleanup and scrolling

Status: Implemented following the owner request on 2026-11-02; delivery tracked by the PR and main Android workflows.

## Scope and UX

Remove the random-name dice, its generator and unused sample-name data. Remove Fit and Season dropdowns and their unused form state; remove the now-unused fit option list. Existing saved values remain compatible and are preserved when editing. New items leave these fields empty. Season filtering for existing data is outside this form change.

Fix the clipped Add/Edit garment form: keep Back available and put every field, wardrobe selector, colors, validation and Save/Delete controls within a bounded vertical ScrollView. Provide bottom padding and keyboard tap handling. Remaining dropdowns open as dialogs, avoiding nested lists clipping or intercepting form scrolling. Existing Android adjustResize accommodates the keyboard.

## Implementation and compatibility

Work on feature/item-form-cleanup from current main. Change ItemForm and remove unused data only; no schema, backup or native changes. Preserve all other garment fields and existing assignments/photos/log links. No new dependencies or visual redesign.

## Acceptance checks

- Add/Edit form contains no random-name action, Fit or Season dropdown.
- Name input stays editable, wardrobe assignment works and Save dispatches the entered values.
- Existing Fit/Season values survive editing; new items use empty/absent values.
- All color controls and Save/Delete are descendants of the scroll container; keyboard taps are handled and dropdowns use dialogs.
- Run component behavior tests, existing suite, TypeScript, relevant lint and Android CI. Small-screen scrolling and keyboard behavior require a phone check, reported separately.
- Deliver through a validated PR and main Release, per AGENTS.md.

## Validation

50 tests pass across 9 suites. The new form tests exercise new-item saving, old-value preservation during edits, removal of the dice/Fit/Season controls, dialog-based dropdowns and scroll containment of the lower colors and Save/Delete controls. TypeScript passes. Targeted ESLint has no errors; four pre-existing shadowing/equality warnings remain in image handling. Android build results are recorded by GitHub Actions; native small-screen/keyboard scrolling has not been tested on a connected phone.
