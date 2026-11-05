# Usability pass

Status: owner chose all batches (A–E) for implementation on 2026-11-05, one PR each in order A, B, C, D+E. Four UX reviews (Closet, garment form, Outfits & Collections, whole-app consistency) read the code; nothing was run on a phone. Findings were checked against the code by the reviewers and merged here. The owner chooses the batches and answers the open decisions before anything is built.

Prompted by: "the flow is confusing, pressing on the image shows some kind of preview, similar but different to edit."

## Goals

- One clear job per surface, so nothing looks like a second, different edit page.
- The same gesture does the same thing on every screen.
- No silent data loss: unsaved edits, imports and resets ask first; deletes can be undone.
- Less wasted space and fewer steps for the things done most (logging, adding garments).
- One word per idea in each language.

## Non-goals

- New features beyond usability (stats, packing lists, sync).
- Visual redesign (colours, fonts, icons set).

## Design rules for the whole app

1. **Surfaces:** a garment or outfit is edited on a full screen; a short choice or a name uses a sheet from the bottom; a confirmation uses a centred dialog.
2. **One way to close** each surface (no Close button next to Cancel; tap outside and Back also close).
3. **Confirmations** name the action ("Delete", "Import"), destructive buttons are red, Cancel on the left. No Yes/No.
4. **Save** lives in the same place on every edit screen (see decision D3).
5. **Destructive or bulk actions** ask first or offer Undo.
6. **Leaving a changed form** asks "Discard changes?".
7. **Glossary** (decision D2): garment / prenda, outfit / one Spanish word, "Log outfit" for every logging action, sentence case.
8. **Touch targets** at least 48dp; every control has a spoken name.

## Batch A: one garment model (the complaint)

- **Tap a garment** (Closet, Collection, everywhere): opens the garment sheet, whose only job is to *log a use* and *lead to Edit*.
  - Top row: small photo, name, "Used 4 times · last 02/11/2026", chevron ›. Tapping any of it opens the edit page.
  - Big **Log use** button with a small "Now · change" under it (replaces the full-width When field).
  - Removed from the sheet: the photo that grows, the In storage chip (it saved instantly with no undo), the separate Close text.
  - Several garments: a row of small photos of what will be logged.
- **Double-tap** a garment: logs a use now, with Undo (as today).
- **Long-press** a garment: starts selecting with that garment ticked (Android habit). Today long-press opens Edit, which the sheet already does.
- **Edit page photo:** tap opens the photo full screen with labelled buttons **Change photo**, **Remove background** / **Keep only the garment**, **Fix cut-out**, **Remove photo**. No hidden long-press. The corner ✂/↶/🖌 shortcuts stay.
- Cut-out success shows "Background removed · Undo"; cut-out errors show in red.

**Implemented** (branch `feature/usability-a`):

- Sheet title is "Log use" for one garment (its name is in the row, so it isn't shown twice) and stays "Outfit" for several. The row's spoken name is "Edit {name}". The sheet's Close text belongs to `BottomSheet` and is left for Batch E.
- "Now · change" is a small text button under Log use; after picking an earlier time it shows that time and a ✕ (Back to now). Future times still count as now.
- Several garments: 40dp photos (shirt icon without a photo) above the count.
- Closet: long-press starts select mode with that garment ticked; in select mode taps and long-presses still tick.
- Collection page: tap opens the sheet, double-tap logs with Undo. It has no select mode until Batch C, so **long-press still opens Edit there** (least surprising until then). "Add or remove garments" is unchanged.
- Closet info and the garments of a logged outfit still open Edit on tap (default `ItemBox`); Batch E covers Closet info.
- Edit page: an empty photo opens camera/gallery; a photo opens a full-screen view (`components/PhotoView.tsx`) with Change photo, Remove background / Keep only the garment (Undo after a cut-out), Fix the cut-out (cut-outs only), Remove photo (red; also drops the pre-cut-out original) and ✕. "Reset Image" left the camera/gallery dialog, so removing lives only in the view. The long-press preview and "hold to preview" are gone; the photo's spoken name is "Choose photo" or "View photo".
- If keeping only the garment needs the model download, the view closes so the question can show.
- After a cut-out, "Background removed · Undo" shows under the photo until Undo, a new photo or Remove photo. Errors show in red there and in the view.
- Removed strings: ShowLargerPhoto, ShowSmallerPhoto, Reset_Image. `hooks/useWidthScreen.ts` is no longer used but kept.

**Acceptance checks (Batch A):**

- [ ] Closet: tap a garment opens the sheet with photo, name, uses and ›; tapping the row opens Edit. No Edit button, no In storage chip, no growing photo.
- [ ] Sheet: Log use logs now with "Logged · Undo"; "Now · change" picks an earlier time, ✕ returns to now; future times can't be chosen.
- [ ] Select several, Log: the sheet shows their small photos and the count.
- [ ] Double-tap a garment logs at once with Undo (Closet and Collection page).
- [ ] Long-press in the Closet starts selecting with that garment ticked; Back ends it.
- [ ] Collection page: tap opens the sheet, long-press opens Edit; "Add or remove garments" still works.
- [ ] Edit page, no photo: tap offers camera/gallery. With a photo: tap opens it full screen with Change photo, Remove background or Keep only the garment, Fix the cut-out (cut-outs only), Remove photo, ✕.
- [ ] Remove photo empties the photo and Save stores none; Undo is not offered afterwards.
- [ ] The photo still matches the height of the fields beside it (no regression of #36/#37); ✂/↶/🖌 corners work.
- [ ] Cut-out errors are red; a cut-out shows "Background removed · Undo".
- [ ] Spanish: "Ahora · cambiar", "Registrar uso", "Cambiar foto", "Quitar foto".
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass (217 tests).

## Batch B: safety

- "Discard changes?" when leaving a changed garment form, outfit form, wardrobe form or the cut-out editor.
- Confirmation dialog: no extra Close button; buttons **Cancel** / **Delete** (red).
- Import asks first and offers "Export a backup first"; a bad file shows an error.
- "Restore default categories" asks first and moves lower on the screen.
- Outfit delete uses the red bin like the rest of the app, with Undo.

## Batch C: logging and outfits

- **Outfits +**: pick garments (same look as the Closet, stored garments hidden, button "Log outfit (3)"), the When row, then log with the same "Logged · Undo" message. No required "Event name".
- **Edit a logged outfit:** tap the card to change name, date and time, notes and garments, or delete. Today a logged outfit can only be deleted.
- **Compact outfit cards:** name and date with a row of small photos instead of a 2-column grid of full cards.
- Outfits sorted by date worn by default (today: by when it was entered).
- **Suggest → Wear this** shows "Logged · Undo".
- **Collection page:** "Log outfit" can log only some of its garments (select mode); after creating a collection it opens straight in "Add or remove garments".
- Reordering collections: the arrows show directly in Custom order; the sheet is called "Order".
- Empty Outfits screen explains how to log.

## Batch D: garment form

- Field order by use: next to the photo **Category, Subcategory, Brand**; then Colors, Name, Seasons, Styles; then a **Details** group (Wardrobe, In storage, Size, Collection, Purchase date, Quantity).
- New garments: **Save & add next** keeps category, wardrobe and collection and opens the camera/gallery choice again. After saving, "Saved to London".
- ✓ Save in the header too, so long forms don't need scrolling.
- Auto colours: + and × always available, Auto fills every colour, Auto only turns off when you confirm a colour by hand; caption "From the photo".
- Subcategory marked as required, with the error next to it.
- Size row: Size with its unit, Quantity last and narrow; Spanish "Talla".
- Name: helper "Automatic: colour + brand + subcategory" until edited.
- Colour dialog: one **Use color** button and **Cancel** in both modes.
- **Bulk add** (changes what new bulk garments save): optional prefix, generated names and colours per photo, pick up to 30 from the gallery without a count, optional "Remove backgrounds".

## Batch E: Closet and app polish

- Search also matches brand, subcategory and collection; Back closes search.
- Empty wardrobe shows "No clothes in London · Show all wardrobes" instead of "No clothes yet".
- "Select all" only ticks visible garments; becomes "Deselect all".
- Selection bar: one Store/Unstore button instead of two, so it fits on one row.
- View & filters: filters first, then Sort, then Grid size; a non-default sort shows as a removable chip.
- Settings: remove the unused "Your name"; order Language, Display, Backup, Photo tools, Updates; switches get spoken names and the whole row toggles.
- Closet info: "last 30 days" ranked by uses in that period, follows the selected wardrobe, garments open on tap.
- Wardrobes: rename and add with the same name sheet as categories and collections.
- One date format helper (localized month names, 24-hour time).
- Sort remembered on Closet and Outfits like Collections; one sort icon.
- Chip outlines darker (today ~1.3:1 contrast); touch size 44 → 48.

## Storage and migration

- Only Batch C (editing logged outfits) writes to existing records, using fields that already exist. Batch D bulk add changes what *new* bulk garments contain. No new fields, no migration, backups unchanged.

## Decisions (owner, 2026-11-05)

- **D1** Garment tap model: the sheet logs a use and leads to Edit; long-press starts selecting; double-tap still logs.
- **D2** Spanish: outfit = **conjunto** everywhere; the Closet tab stays **Armario** (wardrobes stay "Armarios" in More).
- **D3** Save: header ✓ on every edit screen; the garment form also keeps its bottom Save/Delete.
- **D4** Build all batches: A, B, C, then D+E, one PR each.

## Acceptance checks

Per batch, added when the owner picks it. Every batch: `npx tsc --noEmit`, `npm run lint`, `npm test` pass; new tests for changed flows; Spanish screens render; phone check by the owner.
