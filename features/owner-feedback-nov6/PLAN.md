# Owner feedback on the usability pass

Status: owner asked for these changes on 2026-11-06 after trying v0.1.96. Implemented on `feature/owner-feedback`. Decisions marked *(Claude)* were not asked and can be overridden.

## Changes

- **Panels in the middle again.** Batch E had turned every panel into a bottom sheet, against the owner's earlier choice (#31). All panels are centred again, with the ✕, scrolling and keyboard handling kept.
- **Garment panel** (tap a garment):
  - Title is the garment's name, not "Log use".
  - A big round **Log use** button in the middle, with "Now · change" under it.
  - A clear **Edit garment** button at the bottom. Tapping the name no longer edits.
- **Garment form:**
  - The ✂/↶ shortcut on the photo is gone; removing the background or the person lives only in the photo view. The 🖌 shortcut stays, now in the bottom-right corner *(Claude: the owner only named the scissors)*.
  - "Keep only the garment" is now **Remove person and background** / "Quitar persona y fondo".
  - Details fields share one look: same border colour, same height, label in small text inside the box (Wardrobe, In storage, Size, Unit, Collection, Purchase date, Quantity).
  - **In storage** is a tick box (empty square / ticked) with the storage icon, same border and height as the other fields.
  - **Unit** starts at the unit of the last garment saved with one.
  - Purchase date and Quantity share the row equally; Quantity has down/up arrows (minimum 1, maximum 99).
- **Tab bar:** Closet · Collections · Outfits · More.
- **Selection bar** (long-press in the Closet): white with a coloured border and rounded top, so it no longer blends into the tab bar.

## Storage and migration

- Settings gain an optional `lastSizeUnit` (missing = no unit), kept through load, import and backups. No other data changes.

## Acceptance checks

- Every panel opens in the middle of the screen.
- The garment panel shows the name as title, a round Log use button and an Edit garment button.
- The edit page photo shows only the 🖌 shortcut on cut-outs; the photo view has Remove background / Remove person and background.
- All Details fields have the same border and height; In storage shows a tick box.
- A new garment starts with the last unit saved; Quantity arrows change it by one, never below 1.
- Tabs read Closet, Collections, Outfits, More.
- The selection bar is visibly different from the tab bar.

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npm test` pass (281 tests).
- Not checked on a phone.

## Lessons

- Batch E contradicted an earlier owner decision because the reviewers worked from the code alone. Before changing an existing pattern, check the earlier feature plans for a decision about it.
