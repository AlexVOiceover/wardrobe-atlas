# Usability pass

Status: A–E implemented (pending phone check). Owner chose all batches (A–E) on 2026-11-05, one PR each in order A, B, C, D+E. Four UX reviews (Closet, garment form, Outfits & Collections, whole-app consistency) read the code; nothing was run on a phone before building.

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

**Implemented** (branch `feature/usability-b`):

- `hooks/useDiscardGuard.tsx` wraps React Navigation's `usePreventRemove` (v7). Back, the header arrow and the Android Back button on a changed form show "Discard changes?" with **Keep editing** and **Discard** (red). Save and Delete leave through the hook's `leave`, which switches the guard off before closing, so they never ask.
- "Changed" means different from what the form showed when it opened. Garment form: compares what Save would store; the automatic name counts only once typed over, and colours change only with the photo or by hand, so an untouched form (new or edited) leaves without asking. Changing a field and changing it back is not a change. Outfit form: a name, notes or a different date. Wardrobes: the open add/rename row with a name different from the saved one; its own Cancel still closes it without asking.
- Cut-out editor: ✕ and Back ask only after a stroke was applied. The dialog shows inside the full-screen editor (`Portal.Host`); ✓ with nothing painted still just closes.
- `ConfirmationDialog`: no Close button; **Cancel** (text) on the left and the named action on the right, contained and red unless `destructive={false}`. New props `confirmLabel`, `cancelLabel`, `destructive`; the generic "delete this log?" message, Yes and No are gone. Labels: garment, category, subcategory and collection delete "Delete"; garment model "Download" (not red); remove all backgrounds "Remove backgrounds" (red, can't be undone); restore categories "Restore" (red). Wardrobe delete moved from the system `Alert` to this dialog.
- Spanish uses one verb for deleting: **Eliminar** (was "Borrar"), also in the "¿Estás seguro…?" messages.
- Import asks "Replace everything with the backup?" with **Export first** (outlined, in the dialog), Cancel and **Import** (red). Export first runs the export and, once saved, asks again. `importStoreFromJson` now returns `"imported" | "cancelled" | "invalid"`; a wrong or broken file shows "Couldn't import: this file isn't a Wardrobe Atlas backup." in the snackbar; choosing no file says nothing.
- Categories: "Restore default categories" asks first and is a small grey text button well below "Add new category" at the end of the list.
- Outfits: the × is a red `trash-outline` bin named "Delete: {outfit}". It deletes at once and shows "Deleted: {name} · Undo" (5 s, above the add button). Undo dispatches the new `restoreEventLog`, which puts the same record (id, date, name, notes, log time) back at its old place in the list and the id back at its old place in each garment's `logIds`; a second Undo does nothing. No saved data format changes.
- Not done: export failures are still silent (export returns false for both cancel and error).

**Acceptance checks (Batch B):**

- [ ] New garment: open and press Back with nothing entered closes at once; enter a brand (or photo) and Back asks "Discard changes?"; Keep editing stays with the brand; Discard closes.
- [ ] Edit garment: Back without changes closes; change a field, Back asks; Save and Delete never ask.
- [ ] Log outfit form: Back with a name, notes or a new date asks; Save doesn't.
- [ ] Wardrobes: start Add or Rename, type, then Back asks; Cancel in the row closes it without asking. Delete shows the app's dialog (Cancel / red Delete), not the system alert.
- [ ] Fix the cut-out: ✕ or Back after painting asks; before painting it just closes. The dialog shows on top of the editor.
- [ ] Every confirmation: no Close button, Cancel on the left, the action named and red on the right (Download is not red).
- [ ] Settings › Import: asks first; Export first saves a backup and asks again; Import with a non-backup file shows the error; cancelling the file picker shows nothing.
- [ ] Categories: Restore default categories sits at the end, asks first, then restores.
- [ ] Outfits: the red bin deletes at once with "Deleted: … · Undo"; Undo brings the outfit back at the same place with the same garments, date and notes; garment use counts return.
- [ ] Spanish: "¿Descartar cambios?", "Seguir editando", "Descartar", "Eliminar", "Exportar antes".
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass (230 tests).

## Batch C: logging and outfits

- **Outfits +**: pick garments (same look as the Closet, stored garments hidden, button "Log outfit (3)"), the When row, then log with the same "Logged · Undo" message. No required "Event name".
- **Edit a logged outfit:** tap the card to change name, date and time, notes and garments, or delete. Today a logged outfit can only be deleted.
- **Compact outfit cards:** name and date with a row of small photos instead of a 2-column grid of full cards.
- Outfits sorted by date worn by default (today: by when it was entered).
- **Suggest → Wear this** shows "Logged · Undo".
- **Collection page:** "Log outfit" can log only some of its garments (select mode); after creating a collection it opens straight in "Add or remove garments".
- Reordering collections: the arrows show directly in Custom order; the sheet is called "Order".
- Empty Outfits screen explains how to log.

**Implemented** (branch `feature/usability-c`):

- **Outfits +** opens the garment picker (`components/GarmentPicker.tsx`, used by `ItemSelector`): the Closet's layout (`ClosetSections` + `ItemBox` with the ticked frame, the Closet's grid size), each garment once even when it is in two collections, only the wardrobe the Closet shows (as Suggest outfit), stored garments hidden behind a "Show stored (n)" chip, a search field. Folding headings is local to the picker; ticking and folding dispatch nothing (no `toggleCollection`/`isOpen` or settings writes). Ticked garments always show, even if stored or in another wardrobe.
- Its sticky footer has **Log outfit (n)** / **Registrar conjunto (n)** (disabled at 0) and the sheet's "Now · change" control, now the shared `WhenControl` in `QuickLogSheet.tsx`. It logs with `logGarments` (named "Outfit"/"Conjunto", or the garment's name for one), returns to Outfits and shows "Logged: {name} · Undo". No name step.
- Returning with Undo: screens go back with `returnToOutfits` (`components/LogComponent.tsx`), which `popTo`s the Outfits tab with a `notice` param (`logged` or `deleted` with the restore action); Outfits shows it in its snackbar and clears the param. Used by Outfits +, Suggest → Wear this and Delete in the edit page.
- **Edit a logged outfit**: tapping a card opens `EventLogForm`, now the edit page (it is no longer used for creating). Name, When (date and time, later picks become now), notes, the garments with a ✕ "Remove {name}" each, **Add garments** (the same picker full screen in a `Modal`, starting with the outfit's garments ticked, **Done**), header ✓ Save, the Discard guard (name, notes, date or garment set differ from when it opened), and a red **Delete outfit** text button at the bottom that deletes at once and returns with "Deleted: {name} · Undo". A blank name shows "Give the outfit a name".
- New reducer `updateEventLog({ eventId, eventName?, eventDate?, additionalNotes?, garmentIds? })` patches only the given fields. `deleteLog` removes an outfit from *every* garment, so it can't remove one garment; instead `garmentIds` sets exactly which garments link to the outfit, adding the id at the end for new ones and leaving kept ones where they were in their `logIds`. Save sends only fields that changed, so untouched dates keep their stored format. No new fields, no migration.
- **Cards** are compact: name, date and time (24-hour), notes on one line if any, and a wrapping row of 56dp photos (`components/GarmentPhoto.tsx`, shared with the log sheet). The card is one button, "Edit {name}". The bin and the read-only details modal are gone.
- **Sort**: Outfits opens by date worn, newest first; options are Date ↓, Date ↑, Name ↑, Name ↓, Last added.
- **Suggest → Wear this** logs with `logGarments` keeping the "{style} outfit" name, then returns to Outfits with "Logged · Undo".
- **Collection page**: long-press starts select mode with that garment ticked (header shows the count and ✕; Back ends it); taps tick; the bottom bar shows only **Log outfit (n)**, which opens the log sheet with the ticked garments; logging ends select mode. Outside select mode the bar is as before. The Batch A long-press-to-Edit is gone (Edit stays in the sheet's row).
- **New collection** opens straight in "Add or remove garments". The id is computed with `newCollectionValue`, the same helper the `addCollection` reducer now uses (so a reused name gets "Name (2)"), rather than reading the store after dispatch.
- **Collections order**: the sheet and its header icon are "Order" / "Orden". With Custom chosen (the default), the arrows show at once under the caption "Custom is the order you set here with the arrows."
- **Empty Outfits**: "No outfits yet. Tap a garment in your Closet, or tap + to log an outfit." with the Log outfit button.
- Spanish: strings added or touched use "conjunto" (tab "Conjuntos", "Registrar conjunto", "Sugerir conjunto", "Conjunto {style}"); the rest of the glossary is Batch E. Removed unused strings: SelectItems, Next, SelectAtLeastOneItem, EventInfo, EventDate, EventName, ClosetHistoryEmpty. `SelectionItemBox` was only used by the old picker and is deleted. `PageHeader` takes `onBack`; `DatePicker` takes `maximumDate` and has a spoken name.
- Not done: the outfit date still shows as DD/MM/YYYY (Batch E's date helper); the picker has no filters besides search and stored.

**Acceptance checks (Batch C):**

- [ ] Outfits +: the picker looks like the Closet with a ticked frame; a garment in two collections shows once; stored garments are hidden until "Show stored (n)"; with a wardrobe chosen in the Closet only its garments show.
- [ ] Ticking updates "Log outfit (n)"; "Now · change" picks an earlier time; Log outfit returns to Outfits with "Logged: Outfit · Undo"; Undo removes it and the use counts.
- [ ] Outfits is sorted newest worn first; Last added is the last sort option.
- [ ] Cards: name, date, notes, a row of small photos; no bin. Tapping opens the edit page.
- [ ] Edit page: change name, date/time (no future), notes; remove a garment; Add garments ticks more; ✓ saves and the card and garment use counts update. Back after a change asks "Discard changes?"; Save doesn't.
- [ ] Delete outfit (red, at the bottom) returns to Outfits with "Deleted: … · Undo"; Undo restores it.
- [ ] Suggest → Wear this returns to Outfits with "Logged: Casual outfit · Undo".
- [ ] Collection page: long-press ticks a garment and starts selecting; Log outfit (n) logs only the ticked ones; Back or ✕ ends selecting; tap still opens the sheet and double-tap logs.
- [ ] New collection opens in "Add or remove garments"; saving ticks puts those garments in it (also for a name reused after a rename).
- [ ] Collections › Order: titled "Order"; Custom shows the caption and arrows.
- [ ] Empty Outfits shows the new hint; Spanish says "Aún no hay conjuntos…".
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass (244 tests).

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

**Implemented** (branch `feature/usability-de`):

- **Order**: beside the photo **Category**, **Subcategory \***, **Brand** (the photo still stretches to their height with the absolutely positioned image; ✂/↶/🖌 unchanged). Then Colors, Name, Seasons, Styles, a **Details** / **Detalles** heading, Wardrobe + In storage, Size + Unit, Collection, Purchase date + Quantity. All pickers keep `listMode="MODAL"`, so the ones beside the photo need no zIndex (the old `zIndex` wrappers are gone).
- **Header ✓** runs the same save as the bottom Save; the bottom Save/Delete stay (D3). Titles: "New garment" / "Nueva prenda", "Edit garment" / "Editar prenda".
- **Save & add next** / **Guardar y añadir otra** (new garments only, an outlined button under Save): saves, then empties photo (and its cut-out/Undo), name, brand, subcategory, colours (back to Auto, one slot), size and quantity (1); keeps category, wardrobe, collection, In storage, seasons, hand-picked styles (automatic styles keep following the next subcategory), size unit and purchase date. The emptied form becomes the new "unchanged" point, so it never asks "Discard changes?" and a later change asks again. It scrolls to the top, shows "Saved to {wardrobe}" in a snackbar on the form and opens the camera/gallery choice.
- **Saved to**: a normal Save of a *new* garment returns to the Closet with `popTo("StackNavHome", { screen: "Closet", params: { saved } })` (new garments only come from the Closet); the Closet shows it in its snackbar without Undo and clears the param. Without a wardrobe it says "Saved" / "Guardado". Editing still returns with `popToTop` and no message (an edit can come from Collections or Outfits).
- **Auto colours**: + and × always show. Auto fills every colour read from the photo (up to 3) and sets the slots to match; reading moved to `utils/extractColors.ts` (shared with bulk add). It no longer invents grey fallbacks (#777777/#999999/#555555) and drops repeats. Tapping a swatch opens the dialog with Auto still on; Auto turns off only when a colour is confirmed (Use color), added (+) or removed (×). A late read can't overwrite a newer photo or a hand-picked colour. Caption "From the photo" / "De la foto" under the swatches while Auto is on.
- **Subcategory required**: placeholder "Subcategory \*" / "Subcategoría \*". Save without it: red 2dp border, "Please choose a subcategory" right under the picker, scrolls to the top; it clears once one is chosen. Categories without subcategories still don't require one.
- **Size row**: Size then a 104dp Unit dropdown; Quantity is the last field, 72dp, beside Purchase date. Spanish "Talla". Quantity is typed as text: it can be emptied (shows empty) and saves as **1**; digits only. An old garment's quantity, untouched, saves exactly as stored (also when it had none).
- **Name**: "Automatic: color + brand + subcategory" / "Automático: color + marca + subcategoría" under it until typed over. English says "color" like the rest of the app.
- **Colour dialog**: no Close; **Cancel** (text, left) and one contained **Use color** (right) in both modes. Use color is enabled for any valid colour (confirming the current one is how to keep it and turn Auto off). The HEX field applies on the keyboard's Done (and on blur); the ✓ icon is gone.
- **Remove colour ×**: 24dp, hitSlop 12.
- **Bulk add**: wardrobe starts at the last used one and is saved as last used; name prefix optional ("Name prefix (optional)", caption "Without a prefix, names are color + subcategory."); without a prefix each name is `garmentName` of the photo's colour and the subcategory (falls back to "Garment n" when both are missing), with a prefix "Prefix n". Colours are read per photo and saved with `automaticColor: true`. Gallery picks up to 30, no count field (removed "Number of items" and "Please enter item prefix"). Camera: opens again after each shot until it is closed (max 30), no extra question. Optional **Remove backgrounds** switch runs the plain on-device removal per photo (not the garment model, which needs a 176 MB download); a photo it can't cut out keeps its background. Progress "Adding garments: n / total" replaces the buttons while working; it ends in the Closet with "Saved to {wardrobe}". Buttons "Choose photos" / "Elegir fotos", "Take photos" / "Hacer fotos". Collection picker now opens as a modal too.
- Not done: bulk add still doesn't ask for brand, seasons or styles (reducer defaults as before); "Saved to" isn't shown after editing.

**Acceptance checks (Batch D):**

- [ ] New garment at 360dp: Category, Subcategory \*, Brand beside the photo; the photo is as tall as those three; each picker opens its list; ✂/↶/🖌 still sit on the photo.
- [ ] Below: Colors, Name (with the "Automatic: …" line until typed), Seasons, Styles, Details: Wardrobe + In storage, Size + Unit, Collection, Purchase date + Quantity.
- [ ] Save without a subcategory: red border and message under the picker, view scrolls up; picking one clears it.
- [ ] Header ✓ saves like the bottom Save; a new garment returns to the Closet with "Saved to London".
- [ ] Save & add next: saved garment appears in the Closet later; the form keeps category, wardrobe, collection, In storage, seasons; photo, brand, name, subcategory, colours are empty; the camera/gallery choice opens; "Saved to London" shows; Back right after doesn't ask.
- [ ] Auto colours: a photo fills up to three colours; tapping a swatch and cancelling keeps Auto on; Use color, + or × turns it off; "From the photo" shows only while Auto is on.
- [ ] Colour dialog: Cancel and Use color in both Photo and Wheel; typing a HEX and pressing Done moves the wheel.
- [ ] Quantity: clearing it shows empty and saves 1.
- [ ] Bulk add: choose 3 photos without a prefix → names like "Navy Sweater" with colours; with a prefix → "Holiday 1…3"; Remove backgrounds on → cut-outs; camera takes photos until closed.
- [ ] Spanish: "Nueva prenda", "Editar prenda", "Talla", "Subcategoría \*", "Detalles", "De la foto", "Guardar y añadir otra", "Guardado en …", "Elegir fotos", "Hacer fotos".
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass (265 tests).

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

**Implemented** (branch `feature/usability-de`):

- **Search** (`filterItemsBySearch` in `utils/filters.ts`, used by the Closet and the outfit garment picker) matches the name, brand, the subcategory as shown in English *and* Spanish (`typeNamesOf`, so renames count) and the names of the garment's collections. Android Back closes the search field and clears it (like select mode).
- **Empty wardrobe**: with a wardrobe (or Unassigned) chosen, no filters or search, nothing in it but garments elsewhere: "No clothes in {wardrobe}" / "No hay ropa en {wardrobe}" with **Show all wardrobes** / **Ver todos los armarios**. Otherwise the old empty states.
- **Select all** ticks only garments visible under open headings (`visibleGarments` in `ClosetSections.tsx`, same rules as the folding: a folded category or subcategory heading hides its garments; uncategorized garments have no subcategory heading). When every visible garment is ticked it reads **Deselect all** / **Deseleccionar todo** and unticks them (ticks under folded headings stay).
- **Selection bar**: one button, **Store** while any ticked garment is in use, else **Unstore** (icon changes too); Spanish "Almacenar" / "Sacar del almacén". Three actions (Store/Unstore, Log use, Move) share the row; labels may wrap to two centred lines so long Spanish never truncates at 360dp. Disabled with nothing ticked.
- **View & filters** order: Category, Subcategory, Season, Storage, Color, Collections, then Sort, then Grid size, then Reset. A sort other than Last added shows first in the chip row (e.g. "Last used ↓"), spoken "Reset sort: …"; removing it goes back to Last added. Decision: **Clear all** now also resets the sort, since it is one of the chips.
- **Sort remembered**: new settings `closetSortValue` (default "LA") and `outfitSortValue` (default "DD"), set with `setClosetSortValue` / `setOutfitSortValue`. `utils/sorts.ts` holds the values, labels and defaults. Backward compatible: `normalizeWardrobe` (run on every rehydrate as the persist `migrate`, and on import/export) and `importSettings` turn a missing or unknown value into the default; backups now include both. No version bump. Sort icon is `swap-vertical-outline` (`SORT_ICON`) on Outfits and Collections; the Closet keeps its `options-outline` View & filters icon because that panel is filters plus sort.
- **Settings**: "Your name" is gone (and its `userNameSetter`); the stored `name` stays in the store and backups, unused. Order: Language, Display, Backup, Photo tools (Remove all backgrounds), Updates. `ListRow` takes `switchValue` + `onSwitch`: the whole row toggles, role "switch", checked state, the switch itself only shows the state. Its spoken name is "title, subtitle" for every row. Used in Settings, Choose a category (Add several at once), Suggest outfit (Prefer least worn, Include an accessory) and bulk add (Remove backgrounds).
- **Closet info**: follows the wardrobe chosen in the Closet, with a caption "All wardrobes" or "Wardrobe: London". Counts: garments in it, outfits that include one of them, collections holding one of them, and categories. "Top 5, last 30 days" ranks by uses whose outfit date is within the last 30 days (`topUsed` in `utils/closetStats.ts`); "Top 5 overall" by all uses. "Events" is now "Outfits". Decision: a garment opens its **edit page** (no log context here).
- **Wardrobes**: Add and the pencil (now "Rename: {name}") open a name sheet (`components/TextNameSheet.tsx`, the single-name sheet `CollectionNameSheet` now wraps) titled "Add wardrobe" / "Rename", with the same `wardrobeNameError` checks shown in the sheet. Cancel, a tap outside or Back just close it; the page's "Discard changes?" guard from Batch B is gone (the sheet is on top, so Back closes it first). Rows say "3 garments" instead of "3 garment records".
- **Dates** (`utils/dates.ts`): `formatDate` "5 Nov 2026" / "5 nov 2026", `formatDateTime` "Thu 5 Nov 2026 · 14:05" / "jue 5 nov 2026 · 14:05", `formatTime` "14:05"; dayjs `es` locale imported there and applied per call (no global locale). Used on outfit cards, the log sheet (usage line and When), the outfit edit page (`DatePicker`: date and 24-hour time, spoken "When: …"), `OptionalDateField` (purchase date) and Suggest outfit. The pickers ask for 24-hour time (`is24Hour`). Outfits has no section headers, so nothing to change there.
- **Glossary** (wording only): sentence case ("Last added", "Purchase date", "Use camera", "Add new category", "Select date", "Camera error"); "Please enter a garment name"; Spanish "Último añadido", "Añadir nueva categoría", "Elige un color", Settings "Ajustes" (matches "ajustes" elsewhere), clearing uses "Quitar" ("Quitar todo", "Quitar filtros", "Quitar fecha") so "Borrar"/"Eliminar" never mean clear; wardrobe delete message talks of garments and outfits. Removed unused Profile, Your_Name, Photos, GarmentRecords. Built-in subcategory names ("Tank Top") were left as they are, since they also make automatic garment names.
- **Bottom sheet**: `BottomSheet` is now anchored to the bottom, full width, 16dp rounded top corners, max 85% high with scrolling, padded by the bottom safe-area inset (at least 8dp), with a ✕ (`HeaderIcon name="close"`, new `color` prop) in its header instead of the Close text. Tap outside and Back still close. Keyboard: the sheet sits in a `KeyboardAvoidingView` (padding). If Android resizes the modal for the keyboard (adjustResize), the overlap is 0 and nothing changes; if the modal draws under the keyboard (Android 15+ edge-to-edge), it lifts the sheet by the covered part. Not verified on a phone.
- **Visuals**: unselected `FilterChip` border uses new `theme.colors.outline` #8a8a8a (3.4:1 on white); `theme.touch` 48; header badge 18dp with 12sp text.
- Not done: dense grid-size chips stay 40dp high; the Closet's View & filters icon is not the sort icon (see above).

**Acceptance checks (Batch E):**

- [ ] Closet search: a brand, a subcategory in either language ("camisa"/"shirt") and a collection name find the garment; Back closes the search and shows everything.
- [ ] Choose an empty wardrobe: "No clothes in London · Show all wardrobes"; the button shows all.
- [ ] Select mode: fold a section, Select all ticks only open ones and reads Deselect all; Deselect all unticks them.
- [ ] Selection bar fits one row at 360dp in Spanish; Store becomes Unstore ("Sacar del almacén") when all ticked are stored.
- [ ] View & filters: filters, then Sort, then Grid size. Choose Last used ↓: a chip shows; ✕ on it goes back to Last added.
- [ ] Restart the app: the Closet and Outfits sorts are kept; Outfits and Collections use the same sort icon.
- [ ] Settings: no Your name; Language, Display, Backup, Photo tools, Updates; tapping anywhere on Show recent usage toggles it; TalkBack says "switch", the title and on/off.
- [ ] Closet info with London chosen: caption "Wardrobe: London", counts for London, "Top 5, last 30 days"; tapping a garment opens Edit.
- [ ] Wardrobes: Add and Rename open a sheet; empty or duplicate names show the error in it; Cancel closes without asking.
- [ ] Dates: outfit card "Thu 5 Nov 2026 · 14:05", Spanish "jue 5 nov 2026 · 14:05"; log sheet, outfit edit, purchase date use the same style; time pickers are 24-hour.
- [ ] Every sheet (filters, garment sheet, name sheets, wardrobe selector, sort/order, move) comes up from the bottom with a ✕, above the navigation bar; name sheets stay above the keyboard (Android 15+ and older).
- [ ] Chip outlines are clearly visible; Spanish screens read "conjunto", "prenda", "Eliminar", "Ajustes".
- [x] `npx tsc --noEmit`, `npm run lint`, `npm test` pass (278 tests).

## Storage and migration

- Only Batch C (editing logged outfits) writes to existing records, using fields that already exist. Batch D bulk add changes what *new* bulk garments contain. No new fields, no migration, backups unchanged.

## Decisions (owner, 2026-11-05)

- **D1** Garment tap model: the sheet logs a use and leads to Edit; long-press starts selecting; double-tap still logs.
- **D2** Spanish: outfit = **conjunto** everywhere; the Closet tab stays **Armario** (wardrobes stay "Armarios" in More).
- **D3** Save: header ✓ on every edit screen; the garment form also keeps its bottom Save/Delete.
- **D4** Build all batches: A, B, C, then D+E, one PR each.

## Acceptance checks

Per batch, added when the owner picks it. Every batch: `npx tsc --noEmit`, `npm run lint`, `npm test` pass; new tests for changed flows; Spanish screens render; phone check by the owner.
