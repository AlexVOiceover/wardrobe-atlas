# Quick use logging, Closet by category and editable categories

Status: Owner asked for implementation and shipping on 2026-11-03 ("ship all so I can test it on my phone"). Decisions marked *(Claude)* were not asked and can be overridden.

Logging when a garment is worn is the main thing the owner does in the Closet, so it should take two taps. The Closet should be organised by category and type, and every category and type should be editable and deletable, not only the ones the user added.

## Goals

- Tap a garment in the Closet → log a use in two taps. Long press → edit.
- Closet grouped by category, then type, with foldable sections.
- Rename and delete every category and type, built-in or custom, without losing garments.
- Remove the "You can add this Item under a collection" text under Collections in the garment form.

## Non-goals

- Changing the Outfits screen, the outfit log form or statistics, beyond showing the new entries.
- Reordering categories or types, icons, or merging categories.
- Grouping options other than category > type.

## 1. Quick use log (owner: "Small sheet first", "One entry per tap")

Tapping a garment in the Closet opens a small bottom sheet:

```
[photo] Navy Benetton Sweater
        Used 12 times · last 28 Oct
When    Now                      ▾
[ Edit ]                 [ Log use ]
```

- **When** starts as "Now". Tapping it opens a date and time picker, so a use can be logged for earlier in the day or a past date. Future times aren't allowed.
- **Log use** saves one Outfits entry for that garment: the name is the garment's name, the date is the chosen time, and its use count goes up by one. The sheet closes and a message shows "Logged: Navy Benetton Sweater" with **Undo** for a few seconds. Undo removes that entry.
- **Edit** opens the garment form, as a tap did before.
- **Long press** on a garment also opens the garment form.
- The sheet's second line shows the use count and the last use date, or "Not used yet".
- Only the Closet changes *(Claude)*. In statistics (Closet info) and in an outfit's details, a tap still opens the garment form.

## 2. Closet by category and type (owner: "Category > type, collapsible")

```
▾ Tops · 14
   Sweater · 5
   [■][■][■]
   [■][■]
   T-Shirt · 9
   ...
▸ Bottoms · 8
▾ Other · 2
   [■][■]
```

- One section per category, in the same order as the category list. Inside, one smaller heading per type, in the type list's order. Garments without a type, or whose type was deleted, go under **Other** at the end of their category.
- Garments without a category, or whose category was deleted, go in an **Other** section at the end.
- Headings show the number of garments. Tapping a category or type heading folds or unfolds it, and the folds are remembered after restart *(Claude)*.
- Search, filters and sort apply as before. Sections and types left empty after filtering are hidden, and the sort applies inside each type.
- The grid size setting applies to every section.
- **Collections no longer group the page.** They become a filter in the filter sheet (pick one or more collections) and show as removable chips with the other active filters. Managing collections and assigning them in the garment form stays the same.

## 3. Rename and delete categories and types (owner: "All, garments kept")

**Categories** (More → Categories): every row, including Tops, Bottoms, Shoes and Accessories, gets a rename (pencil) and delete (bin) action.

- **Rename:** inline field, like collections. The name can't be empty or match another category, ignoring case. A renamed built-in category shows the new name in both languages.
- **Delete:** a confirmation names the number of garments affected ("3 garments will move to Other"). Those garments are kept and lose their category and type, so they show under Other in the Closet. The category's custom types are deleted with it.

**Types** (tap a category): every type, built-in or custom, gets rename and delete.

- **Rename** changes only the label. Garments keep pointing at the type, so they follow the new name. Today renaming a custom type disconnects its garments; that's fixed here.
- **Delete:** confirmation with the number of garments affected. Those garments keep their category and lose their type, so they show under Other inside that category.

**Restore defaults** *(Claude)*: a button at the bottom of Categories brings back deleted or renamed built-in categories and types. It doesn't touch custom ones or garments.

**Garment form: category picker** *(Claude)*: without one, a garment moved to Other could never be put back in a category. The form gets a Category dropdown beside Type. Changing the category clears the type. Purchase date moves beside the photo under Brand, and the photo grows to match the three stacked fields (about 152px):

```
┌────────┐ Wardrobe ▾
│ photo  │ Brand [        ]
│        │ Purchase date  —
└────────┘
Category ▾        | Type ▾
Colors                       Auto ◉
...
```

The form still opens with the category chosen in "Choose category" when adding a garment.

## 4. Sort by last time used

The Closet filter sheet's sort options gain **Last used ↑** and **Last used ↓** (owner request, 2026-11-03). "Last used" is the latest date among the garment's Outfits entries. Garments never used go last in both directions, like undated garments in the purchase-date sort.

## 5. Garment form text

Remove the "You can add this Item under a collection" line under Collections, in both languages.

## Bugs fixed on the way

- Deleting a custom category also deleted the custom types of another category (Tops' extra types when deleting the first custom category), and shifted the other custom categories' types.
- A new category could reuse the number of a deleted one, silently pulling that category's leftover garments into it. New categories now get a number no garment or category has used.

## Implementation

- `utils/categories.ts` (new): one place that builds the visible category list and each category's types from the built-ins, the user's renames and deletions and the custom entries. Used by the Closet, filters, filter chips, the garment form, bulk add, "Choose category" and category management, replacing their direct use of `clothesList` and `defaultCategories`.
- `redux/categoriesSlice.ts`:
  - New: `hiddenCategories`, `categoryNames` (built-in renames), `hiddenTypes` and `typeNames` (keyed `category|type`).
  - Actions: rename and delete for categories and types, and restore defaults.
  - Fixes to `delCategory` and to new category numbers. Custom type renames keep the stored value.
- `redux/itemsSlice.ts`: clear category and type, or only type, for the garments of a deleted category or type. Quick log uses the existing `addEventLog` + `addLog`, and Undo uses `deleteEventLog` + `deleteLog`.
- `redux/settingsSlice.ts`: `collapsedSections` (list of folded category and type keys).
- `utils/wardrobeData.ts`: keep the new category fields and `collapsedSections` through load, export and import.
- `components/ItemBox.tsx`: optional `onPress` and `onLongPress`. Without them it behaves as today.
- `components/QuickLogSheet.tsx` (new): the sheet, the date and time picker, and Undo with a react-native-paper `Snackbar`.
- `screens/bottomNav/HomeBottom.tsx` and new `components/ClosetSections.tsx`: grouping, folding and the Other sections.
- `utils/filters.ts`, `HomeFilterPanel.tsx`, `ActiveFilters.tsx`: collection filter.
- `screens/stackNav/ManageCategories.tsx`, `EditCategory.tsx`, `components/EditItemList.tsx`: rename and delete, confirmations, restore.
- `screens/stackNav/ItemForm.tsx`: category picker, layout change, hint removed.
- `utils/localization.ts`: new English and Spanish texts.

## Storage and compatibility

- Persisted category data gains four optional fields. Older data and backups load with them empty, so everything looks as today.
- Settings gain `collapsedSections`, empty by default.
- Use logs keep the current format. Quick logs are ordinary Outfits entries, so they're backed up, exported and deleted like the others.
- Garment data is only changed when the user deletes a category or type.
- Garments already pointing at a missing category (from the old delete bug) show under Other and can be moved back with the new category picker.
- No persist version bump: all new fields are optional and defaulted on load.

## Edge cases

- Undo after the message has gone: the entry stays and can be deleted from Outfits as today.
- Long press while scrolling doesn't open anything.
- Logging a garment with no name uses "Garment" as the entry name.
- Deleting every category: the Closet shows only Other, and "Choose category" says no categories exist and offers to restore them.
- Renaming to a name equal to a deleted built-in category is allowed.
- Spanish: renamed built-ins show the user's text in both languages. Untouched built-ins keep their translations.
- A type with the same name in two categories is fine. Types are unique within a category.

## Acceptance checks

- Tap opens the sheet. Log use with "Now" adds one Outfits entry and one use. A picked past time is saved as the entry's date. Undo removes it. Edit and long press open the form.
- Closet groups by category > type in list order, with Other for missing types and categories. Folds work and survive restart. Filters, search and sort still work, and the collection filter and its chip work.
- Every category and type can be renamed and deleted. Renaming keeps the garments attached. Deleting moves the garments to Other and the count in the confirmation is correct. Restore defaults brings the built-ins back.
- Deleting a custom category no longer affects another category's types. A new category doesn't pick up old garments.
- The category picker in the form moves a garment and clears its type.
- The collection hint is gone.
- Old backups and stored data load unchanged. The new fields survive restart and the backup round trip.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass, with tests for each of the above.
- Phone check by the owner.

## Open decisions

- Delivered as one PR at the end, like the previous batch.

## Changes found during implementation

- Deleting a category, or a type, clears the garments' category and type (or only the type), rather than leaving them pointing at the deleted one. This way, a category or type added later with the same name doesn't silently pick them up again.
- Within the Closet, cards no longer repeat the type under the name, because the type heading above already shows it.
- The confirmation uses a singular sentence for one garment ("1 garment will move to Other.").
- The old "Choose category" built-in list (`defaultCategories`) is gone; every screen reads categories from `utils/categories.ts`.

## Validation

151 tests pass across 18 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- Deleting a custom category no longer touching other categories' types.
- Renaming, deleting and restoring built-in categories and types, including a rename showing in Spanish.
- Custom type renames keeping their value, and new types never reusing it.
- New category numbers skipping ones that garments still use.
- Garments moving to Other on delete, and the form's category picker moving them back and clearing the type.
- Grouping by category > type, with Other for missing types and categories.
- The last-used sort in both directions, with unused garments last.
- The collection filter and its chip.
- Folding headings and remembering folds.
- The new fields through backup and restore, with old data loading empty.
- The quick log: "Now" by default, a picked earlier time saved, the use count line, Edit.
- Tap opening the sheet and a long press opening the form.
- The delete confirmations showing the right garment counts.

The Android build is recorded by GitHub Actions.

Not tested on a phone:
- How the sheet, the Undo message and the date-and-time picker feel.
- Long press timing while scrolling.
- Heading sizes and folding with many garments.
- The garment form's new top block (photo at 152px beside three fields).
