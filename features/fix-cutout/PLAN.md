# Fix the cut-out by hand

Status: Owner asked for implementation of option 1 (erase and restore brush) on 2026-11-04. Decisions marked *(Claude)* were not asked and can be overridden.

## Goals

- Remove leftovers the garment model kept, such as fabric touching the waistband, and bring back parts it cut away.
- Automatic colors describe the garment, not the old background.
- The photo's corner buttons sit on the photo.

## Non-goals

- Crop box or tap-to-remove (options 2 and 3).
- Keeping the original photo after saving (storage unchanged).
- Zooming in the editor.

## UX

- A cut-out photo on the garment form shows a 🖌 button on its bottom-left corner (✂/↶ stays bottom-right). It opens a full-screen editor:
  - Header: ✕ (cancel), "Fix the cut-out", ↶ (undo a stroke, once there is one), ✓ (done).
  - The cut-out on grey, so removed parts are easy to see.
  - **Erase** and **Restore** modes; brush **Fine**, **Medium** (default) and **Wide**.
  - While painting, the stroke shows in red (erase) or green (restore). When the finger lifts, it's applied and the image updates.
  - Up to 20 strokes can be undone *(Claude)*.
- **Restore** needs the original photo, which the form has only between "Keep only the garment" (or Remove background) and Save. For a garment saved earlier, the editor offers Erase only *(Claude: no extra storage)*.
- ✓ puts the edited photo on the form; nothing is saved until the form's Save. ↶ on the photo still goes back to the original photo.

## Automatic colors (bug)

- Colors were read once, from the photo as picked, and not again after the cut-out. A garment photographed on a white or patterned background got the background's color (beige trousers became "White Trousers").
- Now, with Auto on, colors are read again after a cut-out, after hand fixes and after ↶. For cut-outs they come from the garment only: transparent pixels are ignored, and the most common colors are kept (second and third only if they cover at least 5% of the garment).

## Photo buttons

- The photo's wrapper no longer stretches to the height of the fields beside it, so the corner buttons sit on the photo instead of below it.

## Implementation

- Native (`WardrobeBackgroundModule`):
  - `editCutout(cutout, original, strokes)`: draws each stroke as a round-capped path; erase clears pixels, restore paints the original photo through a bitmap shader. Returns a WebP.
  - `cutoutColors(base64)`: downsizes to 96 px, ignores pixels under alpha 200, buckets 16 levels per channel, returns up to three distinct hex colors.
- JS: `editCutout` and `cutoutColors` in `utils/backgroundRemoval.ts`; `components/CutoutEditor.tsx` (PanResponder canvas, `fitImage`, `toStroke`).
- `ItemForm`: 🖌 button, the editor, `changePhoto` (sets the photo and refreshes automatic colors), cut-out color reading.

## Storage and migration

- None. The edited photo replaces the garment photo on Save, as a cut-out does today.

## Acceptance checks

- The 🖌 button appears only on cut-outs. Erase removes painted areas; Restore brings back the original (only before saving).
- Undo steps back one stroke; ✕ discards all changes.
- After a cut-out with Auto on, the color is the garment's.
- Corner buttons sit on the photo.

## Validation

- `tsc`, lint and `npm test` (210 tests; 7 new across `cutoutEditor.test.tsx` and `itemForm.test.tsx`) pass.
- The Kotlin is validated by the CI build (Java 17 isn't available locally).
- Not yet checked on a phone: stroke accuracy, speed of applying a stroke, and color results.
