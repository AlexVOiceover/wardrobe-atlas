# Smoother logging and a compact garment form

Status: Owner asked for implementation and shipping on 2026-11-04. Decisions marked *(Claude)* were not asked and can be overridden.

## Goals

- Log a garment faster from the Closet.
- Panels open where they're easy to reach.
- The garment form wastes less space on modern phones.
- "Keep only the garment" and "In storage" fit the form better.

## Non-goals

- Changing what gets logged, the Outfits list, or saved data.

## Panels in the middle (owner: all of them)

- Every panel opens centred on the screen as a rounded card: the log dialog, filters, grid size, move to wardrobe, rename, the wardrobe picker and the Outfits panel.
- A tap outside or Close still closes it. Long panels scroll inside, up to 85% of the screen.

## Double tap to log (owner)

- **Double tap** a garment in the Closet to log one use now, with no dialog.
  - A ✓ flashes on the card for about a second *(Claude)*.
  - The usual "Logged: …" bar appears with **Undo**.
- **Single tap** still opens the log dialog, after about 0.3 s, so a double tap can be told apart.
- **Long press** still edits. Select mode is unchanged: a tap ticks at once, with no double tap.
- **Screen readers:** a double tap already means "activate" there, so logging is offered as a "Log use" action on the card instead.

## Compact garment form *(Claude, approved with the go-ahead)*

- **Photo:** 152 → 112 px.
- **Spacing:** gaps between sections 16 → 8 px.
- **Pickers:** 48 → 40 px tall.
- **Color swatches:** 44 → 40 px.
- **Season and style chips:** 40 px tall, with less padding.
- Touch targets stay at least 36–40 px.

## Keep only the garment

- **A round ✂ icon** on the photo's bottom-right corner replaces the text button.
  - Its accessibility label says what it does: "Keep only the garment" for tops, bottoms and custom categories, "Remove background" for shoes and accessories.
- **While it works,** the photo darkens and shows a spinner, plus the percentage while the model downloads.
- **Afterwards,** the icon becomes ↶ **Undo** until Save.
- Messages ("No garment found", download failed…) still show under the photo.

## In storage (owner: chip next to the wardrobe)

- **In the form,** a small toggle chip with a box icon, "In storage", sits beside the wardrobe at the top. The separate row with a switch is gone. The chip is filled when on.
- **In the log dialog,** the same chip sits next to the photo and its uses, in place of the switch row *(Claude, for consistency)*.

## Implementation

- `components/BottomSheet.tsx`: centred card.
- `components/ItemBox.tsx`: `onDoubleTap`, the tap delay, the ✓ flash and the accessibility action.
- `components/QuickLogSheet.tsx`:
  - `logGarments()` is shared with the double tap;
  - the storage chip.
- `screens/bottomNav/HomeBottom.tsx`: the double tap logs with Undo.
- `components/FilterChip.tsx`: optional `icon` and `dense`.
- `screens/stackNav/ItemForm.tsx`: compact layout, the photo icon actions and the storage chip.

## Acceptance checks

- A single tap opens the log dialog. A double tap logs at once with the ✓ and Undo. A long press edits.
- Panels open centred.
- The form shows the ✂ and ↶ icons, a spinner while working, and the storage chip, which is saved.
- `npx tsc --noEmit`, `npm run lint`, `npm test` and the Android build pass.
- Phone check by the owner: the feel of the double tap and the 0.3 s single-tap delay, the form density, and the panels.

## Validation

- 189 tests pass across 21 suites. TypeScript and lint pass with zero warnings.
- New and updated tests cover:
  - a single tap opening the log only after the double-tap window;
  - a double tap logging one entry with no dialog and showing Undo;
  - the storage chip in the form and in the log dialog;
  - the photo's ✂ and ↶ icon actions, including the download progress.
- Not tested on a phone: the gesture timing, and how the denser form looks on a small screen.
