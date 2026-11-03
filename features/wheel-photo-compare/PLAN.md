# Compare the photo on the color wheel

Status: Owner asked for implementation and shipping on 2026-11-03.

In **Pick a color**, the Wheel tab hid the garment photo, so there was nothing to compare the chosen color with.

## Goals

- The Wheel tab keeps the photo in view next to a live swatch of the chosen color.

## Non-goals

- Any change to the From photo tab or how colors are saved.

## UX (owner: photo beside the swatch)

```
[From photo] [Wheel]
┌──────┐ ┌──────────────┐
│photo │ │   swatch     │
│ 96px │ │ #3A5F2B      │
└──────┘ └──────────────┘
      ( color wheel )
HEX [#3A5F2B          ✓]
[ Save ]
```

- The photo is 96 × 96, shown whole. The swatch fills the rest of the row and updates while dragging. Its hex label sits on a light tag, so it stays readable on any color.
- Garments without a photo show the wheel as before.

## Implementation

- `components/ColorModal.tsx`: the photo and swatch row above the wheel.

## Acceptance checks

- With a photo, the Wheel tab shows the photo and a swatch that follows the wheel. Without a photo, nothing changes.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass.
- Phone check by the owner: the popup still fits on screen.

## Validation

- 188 tests pass across 21 suites. TypeScript and lint pass with zero warnings.
- New tests cover the photo and live swatch on the wheel, and no comparison row without a photo.
- Not tested on a phone: whether the taller popup needs scrolling on small screens.
