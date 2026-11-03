# Seasons on garments, multi-select season filter, sort arrows

Status: Owner asked for implementation and shipping on 2026-11-03.

Seasons exist in the filters but garments can't be given one: the form doesn't set it and bulk add saves none, so the season filter only matches old data. Garments get seasons, all four by default, and the filter takes several. Sort labels use arrows instead of "Asc"/"Desc".

## Goals

- Every garment has a set of seasons, chosen in the garment form, with all four selected by default.
- The Closet season filter is multi-select.
- Sort options show arrows: "Name ↑", "Name ↓", "Purchase date ↑", "Date ↓" and so on.

## Non-goals

- Seasons in bulk add's form (bulk-added garments get all four), outfit logs or statistics.
- Automatic season by date.

## Behaviour

**Garment form:** under Category/Type, a "Seasons" row of four chips (Spring, Summer, Fall, Winter), each toggled on and off.
- New garments start with all four on.
- Editing shows the garment's seasons.
- All four may be turned off; the garment then has no season and only shows when no season filter is set.

**Filter:**
- Season chips can be combined. A garment shows when it has any of the selected seasons.
- Each selected season is its own removable chip above the Closet and counts as one in the filter badge.

**Sort labels:** ↑ is ascending (A→Z, oldest first) and ↓ is descending.
- English: "Name ↑/↓", "Date ↑/↓", "Purchase date ↑/↓".
- Spanish: "Nombre ↑/↓", "Fecha ↑/↓", "Fecha de compra ↑/↓". This also fixes the "Fecha Asce" typo.
- The same labels appear wherever they are used: Closet filters, Outfits sort and collection order.

## Storage and compatibility

- Garments store `seasons: string[]` instead of `season?: string`.
- On every load and backup import:
  - A garment with an old single season keeps just that one.
  - A garment without one gets all four (owner decision).
  - Unknown values are dropped.
- No persist version bump: the normalizer that runs on every load does the conversion.

## Implementation

- `utils/data.ts`: `SEASONS` (the four values).
- `redux/itemsSlice.ts`: `seasons` on items; `addItem` defaults to all four; `updateItem` stores it.
- `utils/wardrobeData.ts`: convert and validate seasons on load and import.
- `utils/filters.ts`: `seasons` filter (any match); badge count.
- `screens/bottomNav/HomeFilterPanel.tsx`, `HomeBottom.tsx`, `components/ActiveFilters.tsx`: multi-select season filter and chips.
- `screens/stackNav/ItemForm.tsx`: season chips. `BulkModeForm.tsx`: all four.
- `utils/localization.ts`: arrow labels and "Seasons".

## Acceptance checks

- New garment saves all four seasons; toggling chips saves the chosen ones; editing keeps them.
- Old data: single season kept, missing → all four, after load and backup import.
- Season filter with two seasons shows garments having either; chips remove each; Reset and Clear all clear them.
- No "Asc"/"Desc" left in sort labels.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass.
- Phone check by the owner.

## Validation

156 tests pass across 18 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- Season chips: all on for a new garment, and only the chosen seasons saved.
- Editing keeping a garment's seasons.
- Old data: a single season kept, a missing or empty season becoming all four, unknown values dropped, and the old `season` field gone after load and import.
- The multi-select filter matching any chosen season.
- Season chips above the Closet.
- Reset and Clear all emptying the season filter.

The Android build is recorded by GitHub Actions.

Not tested on a phone: how the season chip row fits in the garment form, in Spanish.
