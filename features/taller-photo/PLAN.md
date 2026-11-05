# Taller photo on the garment form

Status: Owner asked on 2026-11-04 to remove the empty space under the photo ("make the image bigger or use that space for something else"). Implemented and shipped. Decisions marked *(Claude)* were not asked and can be overridden.

## Goal

- No empty space under the photo at the top of the garment form.

## Non-goals

- Moving other fields next to the photo, or changing the rest of the form.

## UX

- The photo keeps its width (112) and is now as tall as the fields beside it (wardrobe, In storage, Brand, Purchase date), so it is a portrait frame that suits most garments *(Claude: a wider photo would squeeze the wardrobe picker and In storage)*.
- Photos still fill the frame (cropped at the edges). Cut-outs are shown whole, so sleeves and legs are not cut off *(Claude)*.
- The ✂/↶ and 🖌 buttons stay at the photo's bottom corners. Tap and long press work as before.

## Implementation

- `components/ImageViewer.tsx`: `size` becomes `width`; the frame grows to its parent's height with a square as the minimum; new `fit` prop (`cover` or `contain`).
- `screens/stackNav/ItemForm.tsx`: the photo stretches to the row's height and passes `fit="contain"` for cut-outs.

## Follow-up (2026-11-05)

- On the phone the first version made the photo as tall as the image itself, pushing Brand and Purchase date far apart. The image is now laid over the frame instead of sizing it, so the frame follows the fields.
- Owner asked that tapping the photo in the garment sheet (opened from the Closet or a collection) do something: it now shows the photo larger across the sheet, and a second tap shrinks it *(Claude: an in-place enlargement rather than a second full-screen modal on top of the sheet)*. Closing the sheet resets it.

## Storage and migration

- None.

## Acceptance checks

- On the edit page, the photo's bottom lines up with the Purchase date field.
- A cut-out shows the whole garment; a normal photo fills the frame.

## Validation

- `npx tsc --noEmit`, `npm run lint` and `npm test` (211 tests) pass; the garment form test checks `fit` for a photo and a cut-out, and the sheet test checks the larger and smaller photo.
- Unit tests can't measure layout, which is how the first version's bug slipped through; the photo height needs a phone check.
- Not yet checked on a phone.
