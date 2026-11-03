# Compact garment form

Status: Owner asked for implementation on 2026-11-03.

The add/edit garment form stacks every field full width, so it takes several screens of scrolling. Reorganise it so related short fields sit side by side.

## Goals

- Show the whole form, or nearly, on one phone screen.
- Keep every field and behaviour from [garment form defaults](../garment-form-defaults/PLAN.md).

## Non-goals

- New fields or changes to defaults, naming, colors or saved data.
- Bulk add, outfit and other forms.

## Layout

```
┌────────┐ Wardrobe ▾
│ photo  │ Brand [        ]
└────────┘
Type ▾            | Purchase date  —
Colors                       Auto ◉
■  ■✕  +
Name [Navy Benetton Sweater         ]
Qty | Unit ▾ | Size
Collections ▾
[Delete]                     [ Save ]
```

- Photo 112×112 with Wardrobe and Brand stacked beside it.
- Type and purchase date share a row. Purchase date is one field: empty ("—") until tapped, then the picked date with ✕ to clear. It replaces the switch; nothing is saved unless a date is picked.
- Colors: a heading with the Auto switch on the right, then swatches for the shown colors, ✕ on secondary/tertiary and + to add the next one. Swatches show the extracted colors when Auto is on; tapping one turns Auto off and opens the color sheet. + and ✕ appear only when Auto is off.
- Name, then Quantity · Unit · Size, then Collections.
- Delete (editing only) and Save side by side at the bottom.
- Fields use dense 48px inputs and pickers; touch targets stay at least 44px.

## Implementation

- `screens/stackNav/ItemForm.tsx`: layout and styles.
- `components/ImageViewer.tsx`: `size` prop (default 160).
- New `components/OptionalDateField.tsx`: label, value or "—", ✕ to clear, opens the date picker.
- `utils/localization.ts`: "Colors", "Auto", "Not set", "Clear date".

## Storage and compatibility

No changes.

## Acceptance checks

- All fields, defaults and behaviours from the previous plan still work (existing tests updated to the new controls).
- Purchase date: empty by default, picking sets it, ✕ clears it and saves none.
- Tapping a swatch with Auto on turns Auto off and opens the color sheet.
- Spanish labels fit side by side on a 360dp-wide screen.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass.
- Phone check by the owner.

## Validation

135 tests pass across 17 suites. Item form tests now use the new controls (Auto switch, color swatches, add/remove, date field); new tests cover picking and clearing the purchase date, tapping a swatch with Auto on switching to manual and opening the color sheet, and the date field showing "—", the picked date and Clear date. TypeScript and lint with zero warnings pass. The Android build is recorded by GitHub Actions.

Not tested on a phone: how much of the form fits on screen, Spanish labels in the half-width fields, and the ✕ badges on color swatches.

