# Storage and selecting several garments

Status: Owner asked for implementation and shipping on 2026-11-03. Decisions marked *(Claude)* were not asked and can be overridden.

Many people keep next season's clothes in a box under the bed. Garments get an "In storage" toggle, separate from which wardrobe they belong to, and the Closet can filter by it. A select mode in the Closet stores, unstores, logs or moves several garments at once.

## Goals

- Mark a garment as stored or in use, one at a time or many at once.
- See only stored garments, only in-use ones, or all.
- Select several garments to store or unstore, log them as one outfit, or move them to a wardrobe.

## Non-goals

- Named storage places (box, attic…) or several storage boxes.
- Storing automatically by season.
- Selecting garments outside the Closet.

## Storage

- **Garment form:** an "In storage" switch under Seasons. New garments start in use.
- **Quick log sheet:** an "In storage" switch above the buttons, so a garment can be stored right after it's tapped.
- **Closet (owner: show all, with a badge):** stored garments stay listed. Their photo is faded and carries a box icon, at every grid size.
- **Filter:** a "Storage" section with **In use** and **Stored** (pick one; none shows all). The active choice shows as a removable chip and counts in the badge. Reset and Clear all remove it.
- Logging a use of a stored garment is allowed and doesn't change its storage *(Claude)*.

## Select mode (owner: Select button in header)

- A checkbox icon in the Closet header starts select mode. Tapping a garment then ticks or unticks it, shown by a check mark and a frame. A long press also ticks.
- A selection bar replaces the add button at the bottom:

```
✕   3 selected                Select all
[Store] [Unstore] [Log use] [Move]
```

- **✕**, the Android back button or finishing an action ends select mode.
- **Select all** ticks every garment currently shown, after filters, search and folded sections *(Claude: folded sections count as shown, since filters chose them)*. For example: filter Summer → Select all → Store.
- Actions are disabled while nothing is selected. Store is disabled when every selected garment is already stored, and Unstore when none is.
- **Store / Unstore:** applies to all selected garments, then shows "3 garments stored" with **Undo**.
- **Log use:** opens the same sheet as a single tap, with When (now or earlier). It saves **one** Outfits entry containing all selected garments, named "Outfit". Each garment's use count goes up by one. Undo is offered.
- **Move:** a sheet listing Unassigned and every wardrobe. Choosing one moves all selected garments, then shows "Moved to Home" with **Undo**.
- The selection survives filter and search changes until the mode ends. Garments deleted meanwhile are ignored.

## Implementation

- `redux/itemsSlice.ts`: `stored?: boolean` on items. Actions `setGarmentsStored({ ids, stored })` and `setGarmentsWardrobe({ ids, wardrobeId })`. Undo restores each garment's previous value. `addItem`/`updateItem` handle `stored`.
- `utils/wardrobeData.ts`: keep `stored` (true only) through load, export and import.
- `utils/filters.ts`: storage filter; badge count.
- `HomeFilterPanel.tsx`, `ActiveFilters.tsx`, `HomeBottom.tsx`: storage filter and chip; select mode state, selection bar, Back handling, Undo messages.
- `HomeHeader.tsx`: Select icon.
- New `components/SelectionBar.tsx`, and `components/MoveSheet.tsx` for wardrobes.
- `components/QuickLogSheet.tsx`: several garments → one entry; In storage switch for a single garment.
- `components/ItemBox.tsx`/`ItemSummary.tsx`: stored badge and fading; selected state.
- `screens/stackNav/ItemForm.tsx`: In storage switch.
- `utils/localization.ts`: new English and Spanish texts.

## Storage and compatibility

- Garments gain optional `stored`. Missing means in use, so older data and backups load unchanged.
- No persist version bump.

## Edge cases

- Moving to a wardrobe that's deleted while the sheet is open: the move is ignored for an unknown wardrobe, and the garments become Unassigned as with any deleted wardrobe.
- Select all with nothing shown does nothing.
- Undo after a later change: it restores only the values it changed, for garments that still exist.

## Acceptance checks

- Switch in form and sheet stores and unstores. The badge and fading show for stored garments.
- The storage filter shows only stored or only in-use garments. Its chip and Reset work. Old data loads as in use.
- Select mode:
  - Ticking works, and the count is right.
  - Select all ticks the shown garments.
  - Store and Unstore apply to all ticked garments and can be undone.
  - Log use makes one entry for all ticked garments.
  - Move changes the wardrobe of all ticked garments and can be undone.
  - ✕ and Back exit the mode.
- `stored` survives restart and the backup round trip.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass.
- Phone check by the owner.

## Changes found during implementation

- With one garment, the log sheet's storage switch acts immediately, like the rest of the sheet. Several garments show only their count, When and Log use.
- Store and Unstore only change, and Undo only restores, the garments whose state actually changes.

## Validation

163 tests pass across 18 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- Storing, unstoring and moving several garments, including to Unassigned and to an unknown wardrobe.
- `stored` surviving a backup round trip, with old and invalid values loading as in use.
- The storage filter, its chip and the badge count.
- The stored badge and the selection tick on cards.
- Logging several garments as one "Outfit" entry, and the storage switch in the single-garment sheet.
- The form's In storage switch.
- Closet select mode: ticking by tap and long press without opening the sheet or form; Select all; Store with its message and Undo; Move to a wardrobe; Log use for all ticked garments; ✕ ending the mode.

The Android build is recorded by GitHub Actions.

Not tested on a phone:
- The Android Back button ending select mode.
- How the selection bar and the faded, badged cards look.
- Fit of the Spanish labels in the bar.
