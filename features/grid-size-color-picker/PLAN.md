# Grid size and picking colors from the photo

Status: Owner authorized implementation on 2026-11-03 and chose the decisions below.

Two garment-browsing and editing improvements: choose how many columns the Closet grid shows, and set a garment's colors by tapping on its photo. Secondary and tertiary colors become optional instead of always being shown and auto-filled.

## Goals

- Change the Closet grid size from the header, and keep the choice.
- Pick primary, secondary and tertiary colors directly from the garment photo.
- Only ask for one color by default; add a second and third only when wanted.

## Non-goals

- Pinch-to-zoom on the grid or on the photo.
- Changing the color filter, color matching or how colors are stored.
- New native dependencies.
- Colors in bulk add (bulk-added garments still have no colors).

## Grid size

### UX

- A third header icon on Closet (`grid-outline`), before search and filter, opens a small sheet with grid sizes 1, 2, 3, 4 and 5 columns (decision 1). The current size is selected; choosing one closes the sheet.
- 1 and 2 columns: photo, name, type, swatches and uses (2 is today's layout).
- 3 and 4 columns: photo and name on one line with an ellipsis; type, swatches and uses are hidden to fit.
- 5 columns: photo only. The name stays as the photo's accessibility label.
- The choice is remembered across app restarts.

```
┌──────────────────────────────┐
│ All wardrobes ▾    ▦  ⌕  ≡   │
├──────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐   │
│ │photo │ │photo │ │photo │   │
│ └──────┘ └──────┘ └──────┘   │
│ Linen sh Chinos   Blazer     │
└──────────────────────────────┘
```

### Implementation

- `redux/settingsSlice.ts`: `gridColumns` (1–5), default 2, `setGridColumns` action; `importSettings` accepts it and falls back to 2.
- `components/GarmentGrid.tsx`: `columns` prop; cell width from the column count with even gaps.
- `components/ItemSummary.tsx`: `density` for name-only (3–4 columns) and photo-only (5 columns) cards.
- `screens/bottomNav/HomeHeader.tsx`, `HomeBottom.tsx`: the grid size icon and sheet, and passing `columns`.
- `utils/localization.ts`: "Grid size" and "N columns" (English and Spanish).

## Picking colors from the photo

### UX

- Tapping a color row opens the color sheet as today. When the garment has a photo, the sheet opens on a **From photo** view: the photo, with a crosshair where you tap. Each tap samples that spot and previews the color and its hex. **Use color** saves it to that slot.
- A **Wheel** toggle switches to the existing wheel and hex input, which stays for garments without a photo and for fine-tuning.
- The sample is the average of a small square (3% of the photo's width and height) around the tap, so fabric texture and single noisy pixels don't skew it.

```
┌──────────────────────────────┐
│ Primary color        Close   │
│ [From photo]  Wheel          │
│ ┌──────────────────────────┐ │
│ │                          │ │
│ │        ┼                 │ │
│ │                          │ │
│ └──────────────────────────┘ │
│ ■ #1F2A44                    │
│            [ Use color ]     │
└──────────────────────────────┘
```

### Implementation

- New `components/PhotoColorPicker.tsx`: shows the photo at its aspect ratio, maps the tap position to percentages of the image, and calls `getSegmentsAverageColor` from `@somesoap/react-native-image-palette` (already installed) on a cached copy of the photo. Shows a loading state while sampling and an error message if sampling fails.
- `components/ColorModal.tsx`: tabs for From photo and Wheel; receives the photo.
- `screens/stackNav/ItemForm.tsx`: passes the photo to the color sheet. The picker writes it to a cache file on the first tap and removes it when the photo changes or the sheet closes; automatic extraction keeps its own temporary file.
- `utils/photoColor.ts`: tap position → sampled square, and hex normalization.

## Optional secondary and tertiary colors

### UX

- The form shows **Primary color** only. Below it, **Add secondary color** reveals the secondary row; once secondary is set, **Add tertiary color** reveals the tertiary row.
- Secondary and tertiary rows have a remove button that clears the color and hides the row (removing secondary also moves tertiary up).
- Editing a garment that already has secondary or tertiary colors shows those rows.
- Automatic color selection fills the primary color, plus secondary and tertiary only if those rows are shown (decision 3).

## Storage and compatibility

- `settings.gridColumns` is new. Stored settings from older versions don't have it, so readers default to 2; old backups import with 2. No persist version bump needed.
- Garment colors are stored exactly as today (`primaryColor`, `secondaryColor`, `tertiaryColor`, empty string when unset). Existing garments keep all their colors.

## Edge cases

- Garment without a photo: the sheet opens on the wheel, with no From photo tab.
- Taps near the photo edges: the sample square is clamped inside the image.
- Very small or very large photos, portrait and landscape.
- Photo replaced after picking: the picker uses the current photo.
- Sampling fails (unreadable file): message shown, wheel still available.
- Long names in 3–4 columns: one line with ellipsis.
- Grid size with collections as section headings and with empty results.

## Changes found during implementation

- Settings are rebuilt from a fixed list of fields on every load and export (`utils/wardrobeData.ts`), so `gridColumns` had to be added there; otherwise the grid size would have reset on every restart and been left out of backups.
- The photo box is sized to the image's exact aspect ratio (up to 280 high) instead of letterboxing, so a tap position maps directly onto the photo.
- "Add secondary color" is disabled until the primary color is set, and "Add tertiary color" until secondary is set.
- Jest now mocks `react-native-blob-util` and the palette library where the color sheet is rendered.

## Acceptance checks

- The grid size sheet offers 1–5 columns, and the choice survives an app restart and a backup round trip.
- Old stored settings and old backups load with 2 columns.
- From photo: tapping two different areas of a two-colored garment gives two different colors, and Use color saves to the chosen slot.
- New garments show only Primary color; Add secondary / Add tertiary reveal rows; remove clears and hides them; saved garments without them store empty strings.
- Editing a garment with three colors shows all three.
- Spanish shows no English labels on the changed screens.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass, with tests for the grid setting and import, column layout and card density, tap-to-percentage mapping and clamping, and optional color rows.
- Phone check by the owner: sampling accuracy on real photos and the 3–5 column layouts.

## Decisions

1. Grid sizes: 1 to 5 columns; names shown when they fit (one line at 3–4 columns, hidden at 5).
2. Picker default: open on From photo when there's a photo; wheel otherwise.
3. Automatic color selection fills only the rows that are shown (primary by default).

## Validation

123 tests pass across 16 suites. New tests cover grid settings (default, 1–5 range, old stored settings and backups loading as 2, import), card density and cell widths for 1–5 columns, tap-to-area mapping including the edges, hex normalization, the color sheet opening on the photo and saving a tapped color (and removing its cache file), Primary-only new garments, adding secondary and tertiary in order, editing a three-color garment, and removing secondary moving tertiary up. TypeScript and lint with zero warnings pass. The Android build is recorded by GitHub Actions.

Not tested on a phone: sampling accuracy on real photos, the 3–5 column layouts and the grid size sheet. Automatic color filling only the shown rows is not covered by an automated test because it runs through the native palette library.

## Known limitations

- The sampled color is the average of a small area, so a tap on a seam or shadow returns that darker color; tap again on a flat area.
- Grid size applies to Closet only; outfit item selection and Closet info keep 2 columns.
