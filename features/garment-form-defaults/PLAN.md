# Garment form defaults, auto names and visible filters

Status: Owner asked for implementation on 2026-11-03, delivered as one PR at the end. Decisions below were made by Claude and can be overridden.

A batch of small changes from using the app: the add-garment form should start with sensible defaults instead of misleading ones, name garments automatically, and Closet should make active filters obvious (a filter left on looked like garments had disappeared).

## Goals

- New garments default to the last wardrobe used, automatic colors on and no purchase date.
- Garments get a name like "Navy Benetton Sweater" automatically, which the user can still edit.
- Active filters are visible above the Closet list, not only as a badge.
- The first row of photos no longer touches the header.

## Non-goals

- Changing filters, sorting or color matching logic beyond what's listed.
- Brand lists, suggestions or brand filtering.
- Filling in purchase dates or brands for existing garments.

## Closet: active filters and spacing

- Below the header, when any filter is active, a row of chips shows each one (category, type, season, colors) with an ✕. Tapping a chip removes that filter; **Clear all** removes all of them. The filter icon badge stays.
- Sort order isn't shown, since it doesn't hide garments.
- Closet and Outfits lists get 16px of space below the header.

## Add / edit garment form

New order:

```
Photo
Wardrobe
Type
Brand              (new, optional)
Automatic colors   [on]
  Primary color …  (when automatic is off)
Name               (filled automatically, editable)
Quantity · Unit · Size
Purchase date      [off]
Collections
Save
```

- **Wardrobe**: new garments default to the wardrobe of the last garment saved. If that wardrobe was deleted, it falls back to the Closet's selected wardrobe, as today.
- **Brand**: new optional text field, stored on the garment.
- **Automatic colors**: on by default for new garments. Colors are extracted when a photo is added or replaced, not only when the switch is turned on. Editing keeps the garment's saved setting.
- **Name**: generated as `Color Brand Type`, e.g. "Navy Benetton Sweater". The color is the primary color's filter name (Navy, Light blue…) in the app language; missing parts are skipped. The name updates while color, brand or type change, until the user types their own name. If the name is empty on Save, it is generated then. Editing keeps the existing name unless the user clears it.
- **Purchase date**: a switch, off by default for new garments, so no date is saved unless the user sets one. When on, it shows the date picker (today as the starting value). Editing a garment that has a date shows it on. Bulk add no longer stamps today's date.
- Sorting by purchase date puts garments without a date last in both directions.

## Implementation

- `redux/itemsSlice.ts`: `brand?: string` on items; `addItem` and `updateItem` store it.
- `redux/settingsSlice.ts`: `lastWardrobeId` (string or empty), set when a garment is saved; `importSettings` accepts it.
- `utils/wardrobeData.ts`: keep `brand` and `lastWardrobeId` through load, export and import.
- `utils/garmentName.ts`: name generation.
- `utils/filters.ts`: purchase-date sorting with missing dates last.
- `screens/stackNav/ItemForm.tsx`: field order, brand, auto name, purchase date switch, defaults, extraction on photo change.
- `screens/stackNav/BulkModeForm.tsx`: no purchase date.
- `screens/bottomNav/HomeBottom.tsx` and new `components/ActiveFilters.tsx`: filter chips; list spacing in Closet and Outfits.
- `utils/localization.ts`: Brand, Clear all, remove-filter labels (English and Spanish).

## Storage and compatibility

- Items gain optional `brand`; older items and backups have none and show an empty field.
- Settings gain `lastWardrobeId`; older settings load as empty, falling back to the Closet selection.
- `purchaseDate` may now be empty (`""`). Existing garments keep their dates; those created before this change already have the creation date stored and can't be told apart, so they are left as they are.
- No persist version bump: the new fields are optional and defaulted on load.

## Edge cases

- No type list for a custom category: name uses color and brand only.
- No photo and automatic colors on: no color, so the name starts from brand/type.
- Name typed, then cleared: generation resumes.
- Last wardrobe deleted, or no wardrobes at all.
- Filter chip labels for custom categories and types, in Spanish.

## Acceptance checks

- New garment: last saved wardrobe preselected, automatic colors on, purchase date off; saving without touching the date stores none.
- Name fills in as "Navy Benetton Sweater"-style from color, brand and type, stops following once edited, and is generated on Save when empty.
- Editing keeps name, colors setting, purchase date and brand.
- Brand and last wardrobe survive restart and backup round trip; old backups load.
- Purchase-date sort puts undated garments last.
- Active filter chips show and remove individual filters; Clear all clears them.
- The first grid row has space below the header.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass, with tests for each of the above.
- Phone check by the owner.

## Changes found during implementation

- Automatic colors were only extracted when the switch was turned on, so with the switch on by default a new photo would never be analysed. Extraction now also runs when a photo is added or replaced.
- "Clear all" clears the filters shown as chips and leaves the sort order alone (the filter sheet's Reset still resets everything).
- The last used wardrobe is dropped on load if that wardrobe no longer exists.
- The name uses the same "Color Brand Type" order in Spanish ("Azul marino Benetton Jersey").

## Validation

133 tests pass across 17 suites. New tests cover the name generator (English, Spanish, missing parts), new-garment defaults (last wardrobe, deleted-wardrobe fallback, automatic colors on, no purchase date saved), the name following color/brand/type until edited and resuming when cleared, generation on Save, saving a chosen purchase date, editing keeping name/brand/color setting/date, brand and last wardrobe through load/backup/import, undated garments sorted last, and the filter chips (labels, removing one, Clear all keeping the sort, nothing shown without filters). TypeScript and lint with zero warnings pass. The Android build is recorded by GitHub Actions.

Not tested on a phone: the new form order, filter chips layout, list spacing, and automatic color extraction on a newly added photo (native library).

## Known limitations

- Garments created before this change keep the purchase date that was stamped automatically; the app can't tell those apart from real dates.

