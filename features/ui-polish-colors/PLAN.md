# UI polish: realistic color filter, styled bars, longer names

Status: Owner authorized implementation on 2026-11-03 and chose the decisions below.

Three small follow-ups to the [UI first pass](../ui-first-pass/PLAN.md): the color filter uses a 16-color art wheel (yellow green, red violet…) instead of colors clothes actually come in; the header and tab bar are plain white; and every name is capped at 20 characters.

## Goals

- Filter by the colors people use for clothes, and have garments land in the color you'd expect.
- Give the top header and bottom tab bar a background so the screen has a frame.
- Allow names of any reasonable length without breaking the grid.

## Non-goals

- Changing how garment colors are picked or stored (photo palette and hex input stay).
- Dark mode, new fonts or restyling the content area.
- Changing the bottom navigation structure.

## Color filter

### Palette

| Key | English | Spanish | Swatch |
|-----|---------|---------|--------|
| black | Black | Negro | #1C1C1C |
| gray | Grey | Gris | #8E8E8E |
| white | White | Blanco | #F7F7F2 |
| beige | Beige | Beige | #D9C7A7 |
| brown | Brown | Marrón | #6F4E37 |
| khaki | Khaki | Caqui | #7A7A45 |
| green | Green | Verde | #2E7D4F |
| navy | Navy | Azul marino | #1F2A44 |
| blue | Blue | Azul | #3E6DB5 |
| lightBlue | Light blue | Celeste | #A7C7E7 |
| purple | Purple | Morado | #6A4C93 |
| pink | Pink | Rosa | #E8A5B8 |
| red | Red | Rojo | #B22222 |
| burgundy | Burgundy | Granate | #6D1A2E |
| orange | Orange | Naranja | #E07B39 |
| yellow | Yellow | Amarillo | #E8C547 |
| none | No color | Sin color | (dashed, "?") |

### Matching

- Replace the hue buckets in `categorizeColor` with nearest-reference matching in OKLab. Each filter color has several reference shades (mostly standard named colors, e.g. navy, midnight blue, oxford blue for Navy); the first is the swatch shown. A garment color goes to the color of its closest reference shade. Accepts `#RGB` and `#RRGGBB`, with or without `#`.
- Empty or invalid colors map to `none`, so "No color" finds garments without any color (today they come out as "red").
- A garment matches if any of its three colors falls in a selected color, as today.

### UX

- Same swatch grid in the filter panel, in the order above (neutrals first).
- Selected colors are listed by name under the grid ("Navy, Beige"), since navy vs black or beige vs white is hard to tell from a swatch alone.

## Header and tab bar

Deep teal accent (decision 1):

- `utils/theme.ts` gets `colors.bar` and `colors.onBar` (plus a muted variant for inactive tabs).
- The Closet and Outfits headers, `PageHeader` on stack screens, the bottom tab bar and the status bar use them; the area behind the Android navigation buttons matches the tab bar.
- Header icons, the wardrobe selector, the filter badge and tab icons switch to `onBar` colors and keep 44px touch targets.

## Names

- Remove the 20-character limit from the garment, bulk-add prefix, outfit, collection and category type forms. Empty names are still rejected.
- Grid cards, list rows and section headings show long names on at most two lines with an ellipsis; detail and edit screens show the full name.
- Remove the unused `NameTooLong` string.

## Implementation

- `utils/colors.ts`: palette, hex → Lab, nearest match; drop unused legacy color constants if nothing references them.
- `components/ColorFilter.tsx`: new palette, selected-name caption.
- `utils/localization.ts`: new color names (en/es), remove `NameTooLong`.
- `utils/theme.ts`, `App.tsx`, `routers/BottomTabNav.tsx`, `components/PageHeader.tsx`, `screens/bottomNav/HomeHeader.tsx`, `screens/bottomNav/OutfitLog.tsx`: bar styling.
- `screens/stackNav/{ItemForm,BulkModeForm,EventLogForm,CollectionForm,EditCategory}.tsx`: drop the length check.
- `components/ItemSummary.tsx`, `components/ListRow.tsx`, `components/SectionHeading.tsx`, `components/LogComponent.tsx`, `components/EditItemList.tsx`: `numberOfLines`.
- `utils/filters.ts`: color matching ignores empty color slots.

## Storage and compatibility

No saved-data changes. Garments keep their hex colors; only the filter's interpretation changes. The color filter selection lives in screen state and is not persisted or backed up, so old keys (`yellow_Green`, …) can't linger. Longer names are plain strings and already round-trip through backups.

## Edge cases

- Very light or very dark garment colors (near-white cream, near-black navy) — covered by tests with sample hexes.
- 3-digit hex, lowercase hex, empty string, invalid input.
- Very long names without spaces in a two-column card.
- Bar colors with the update banner, bottom sheets and dialogs.

## Changes found during implementation

- The old `categorizeColor` mislabelled hues (orange-brown came out as "violet", cyan as "green") and filed garments without a color under "red".
- The old filter checked all three color slots, so empty second and third slots would have made "No color" match nearly every garment. Empty slots are now ignored.
- Plain CIELAB distance against one swatch per color pulled navy and pure blue into purple and orange into yellow; OKLab fixed the blues, and several reference shades per color fixed vivid and very light colors. On 49 garment colors not used as references, 44 land as expected; the misses are genuinely borderline (café au lait, near-black brown, hunter green, iris, pinkish red).
- `PageHeader` titles are limited to one line, so long names don't push header actions off screen.

## Acceptance checks

- Sample hexes land in the expected color: #000080 → navy, #F5F5DC → beige, #800020 → burgundy, #FFC0CB → pink, #FFFFF0 → white, "" → none.
- Filtering by "No color" shows garments without colors; filter Reset still clears colors.
- Header and tab bar backgrounds are styled on Closet, Outfits, More and stack screens, with readable icons and labels.
- A 60-character garment name saves and shows on two lines in the grid.
- Spanish shows no English labels in the filter.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass, with tests for color matching, the filter and the name limit.
- Phone check by the owner.

## Decisions

1. Bar style: a deep teal accent (#1F4E5A) for the header and tab bar with white icons and labels. The `+` button uses the same accent.
2. Palette: the 16 colors above plus "No color".
3. Name limit: removed from all five forms.

## Validation

106 tests pass across 15 suites. New tests cover 26 sample garment colors, short/lowercase/missing hex, English and Spanish names for every filter color, the filter matching any garment color and "No color" matching only uncolored garments, the filter swatches and selected-name caption, the accent color on the tab bar and page headers, and saving a 57-character garment name. TypeScript and lint with zero warnings pass. The Android build is recorded by GitHub Actions.

Not tested on a phone: bar colors with the status bar and navigation buttons, readability of white icons on teal, and long names in the grid.

## Known limitations

- Colors on the boundary between two filter colors (e.g. iris between blue and purple) go to whichever reference is closest, which may not match how the owner would describe them.
