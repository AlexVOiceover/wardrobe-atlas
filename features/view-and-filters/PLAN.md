# View & filters, and a 6-column grid

Status: Owner asked for implementation and shipping on 2026-11-04 ("do it", after the proposal below). Decisions marked *(Claude)* were not asked and can be overridden.

## Goals

- Grid size lives in the same panel as sort and filters, so the Closet header has one icon fewer.
- The panel and its button are called **View & filters** ("Vista y filtros").
- A sixth grid level: 6 columns.

## Non-goals

- Changing what filters do, or how the grid looks at 1–5 columns.
- Collections (see [Collections tab](../collections-tab/PLAN.md)).

## UX

- Closet header: wardrobe picker, Select, Search, View & filters. The separate grid icon and its panel are gone.
- The View & filters panel opens with **Grid size**: chips 1 to 6 *(Claude: numbers, read as "n columns" by screen readers)*. Tapping one changes the grid at once and leaves the panel open.
- Then Sort, Category, Type, Season, Storage, Color, Collections and Reset, as before.
- The badge on the button still counts filters only; grid size and sort don't count. Reset doesn't change the grid size.
- 6 columns shows photos only, like 5.

## Implementation

- `GRID_COLUMN_OPTIONS` gains 6.
- `HomeFilterPanel` takes `columns` and `onColumnsChange`; `HomeBottom` drops its grid size sheet; `HomeHeader` drops the grid icon.
- `FilterChip` takes an optional `accessibilityLabel` for short labels.
- Strings: `Filters` is replaced by `ViewAndFilters`.

## Storage and migration

- None. Saved values 1–5 stay as they are; 6 is now kept instead of falling back to 2.

## Acceptance checks

- Grid size chips 1–6 in the panel, the current one selected; choosing one saves it.
- A saved 6 loads as 6; 7 or unknown values fall back to 2.
- 6 columns renders photo-only cards that fill the row.

## Validation

- `npx tsc --noEmit`, `npm run lint` and `npm test` (192 tests) pass.
- Not yet checked on a phone.
