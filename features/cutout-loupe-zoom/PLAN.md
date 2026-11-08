# Close-up and zoom in the cut-out editor

Status: owner asked on 2026-11-08 ("editing the picture on the phone is difficult, the tool is right under the finger") and chose the suggested fixes 1, 2 and 4 ("do as you suggest"). Implemented on `feature/cutout-loupe-zoom`. Decisions marked *(Claude)* were not asked and can be overridden.

## Goals

- See what you're painting even though the finger covers it.
- Paint small leftovers precisely.

## Non-goals

- The offset brush (brush drawn above the finger); kept as a later option if the close-up isn't enough.
- Showing the original photo behind the cut-out in Restore mode.

## UX

- **Close-up:** while one finger paints, a round close-up (128dp, 2× magnified, teal border) in the top-left corner shows the area under the finger, the painted path and the brush ring. When the finger is under it, it moves to the top-right. It disappears when the finger lifts.
- **Zoom:** two fingers pinch to zoom (up to 6×) and move the photo; the spot between the fingers stays between them. A second finger cancels the stroke in progress, so pinching never paints. The photo can't be pushed off the middle of the screen. A "Show the whole photo" button (⛶) in the header appears while zoomed.
- **Brush:** keeps its size on screen at every zoom, so it paints finer on the photo when zoomed in *(Claude)*.
- **Ring:** a ring at the brush size shows where the finger is; the painted path is shown faintly (red for Erase, green for Restore) instead of solid dots.
- A second hint line: "Pinch with two fingers to zoom and move the photo."
- Erase/Restore, brush sizes, Undo, Done and Cancel are unchanged.

## Implementation

- `components/CutoutEditor.tsx`: zoom state `{ scale, x, y }`; pure helpers `zoomedFrame`, `clampZoom`, `pinchZoom`, `loupeSide` (exported and tested). The responder reads two-finger moves from `nativeEvent.touches` (page coordinates minus the canvas origin taken at touch start). Strokes map through the zoomed frame with brush size `BRUSH_SIZES[i] / scale`.
- Strings `ZoomHint`, `ShowWholePhoto`.

## Storage and migration

- None.

## Acceptance checks

- Painting shows the close-up away from the finger, flipping sides near the top-left.
- Pinching zooms and moves without painting; "Show the whole photo" resets it.
- A stroke while zoomed lands where the finger was on the photo and is finer.

## Validation

- `npx tsc --noEmit`, `npm run lint`, `npm test` pass (284 tests; 3 new in `__tests__/cutoutEditor.test.tsx`).
- Not checked on a phone: pinch feel, close-up speed with large photos.
