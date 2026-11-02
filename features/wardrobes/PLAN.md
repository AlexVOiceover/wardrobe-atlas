# Locations / wardrobes

Status: Implementation authorized by the owner on 2026-11-02. Validation in progress.

## Goal

Know where clothes are stored and browse the clothes available at a chosen location, for example Home, Office or Holiday home. Keep the app minimal, local and usable in English and Spanish.

Confirmed by the owner: a wardrobe is a physical location, with one location per garment. Implementation uses the proposed v1 scope below, with defaults recorded at the end.

## Current project

- React Native / TypeScript Android app; Redux state persisted to the filesystem.
- One shared inventory, categories, many-to-many collection tags, garment photos and outfit logs.
- No location entity or garment location field currently exists.
- `utils/wardrobeData.ts` allowlists loaded/exported fields. Adding a field only to the form or reducer would lose it on reload or backup.
- Import replaces the current inventory; this feature must preserve that existing behavior.
- Follow `AGENTS.md`: discuss, record the agreed scope here, then wait for an explicit instruction to implement. Authorized implementation starts from current main on `feature/wardrobes`; validation, PR, merge and verified Release follow the standing delivery agreement.

## Proposed first version

- A wardrobe represents a physical storage location, independent of category and collection.
- Each garment record has zero or one wardrobe. All units represented by its quantity share that assignment.
- Unassigned clothes remain visible under All and Unassigned; creating a location is optional.
- Create, rename and delete wardrobes. Names are trimmed, required and unique ignoring case. Accept accents and Unicode without a short arbitrary character cap.
- Assign or change a wardrobe in the garment create/edit form and bulk photo creation form.
- Moving means changing the assignment while retaining the same garment ID, photo, collections and outfit history.
- Home offers All, Unassigned and each named wardrobe. Location filtering combines with existing search, category, type, season, color and collection views.
- Keep existing outfit logs global. Moving clothes does not rewrite historical logs; this version does not track location history.

## Proposed UX

1. Home has a plainly labelled wardrobe selector and a Manage wardrobes action.
2. Management uses a simple list with names, garment-record counts, Add, Rename and Delete. Counts represent records, not the sum of quantities; label this clearly.
3. Add/Edit wardrobe uses a text field and Save/Cancel. Validation appears beside the form; cancelling changes nothing.
4. Garment and bulk creation forms include a wardrobe selector with Unassigned. Default to the currently selected named wardrobe when opening from it; otherwise Unassigned. Editing preserves the current assignment.
5. Deleting a wardrobe asks for confirmation and explains that its clothes become Unassigned. Never delete garments, photos, collections or logs through this action. If the deleted wardrobe is being viewed, return to All.
6. Empty wardrobes show an empty-state message and an Add garment action. Clear filters remains available when other filters hide the contents.
7. Keep the shared app/version header and the current plain interface. Translate system labels into English and Spanish; keep user-entered names unchanged when switching language.

## Data and implementation proposal

- Add `wardrobes: { id: string; name: string }[]` to `itemsList`, and `wardrobeId?: string` to each garment. Use stable generated IDs, never names or array positions as references.
- Use one central location-filtering path before collection grouping so grouped and ungrouped views agree. Do not mutate the stored inventory while filtering.
- Resolve edit/move/delete operations by stable garment/wardrobe ID. Reject nonexistent assignment targets; handle a deleted selection safely before saving a form.
- Default the home view to All on startup. Keep the viewing selection transient for v1 rather than adding another persisted preference.
- Extend `redux/itemsSlice.ts`, garment/bulk forms, home navigation/filtering and `utils/localization.ts`. Add a small management screen through `routers/stack.tsx`.
- Extend `utils/wardrobeData.ts`, import/export and `utils/exportForLLM.ts`; include names and garment assignments in the LLM export when items are included.
- No new dependency or native Android change is expected.

## Storage and migration

- Increment the backup format and persisted schema version together (currently both 1). Keep language migration explicit: old Spanish index 2 maps to 1 only for legacy pre-v1 data; v1 and later Spanish index 1 remains Spanish.
- Existing installs and old backups load with an empty wardrobe list and every garment Unassigned. Do not invent a Home location or infer locations from collection names.
- Preserve garment IDs, quantities, photos, categories, collections, logs and current settings through migration and backup round trips.
- Normalize missing or unknown wardrobe references to Unassigned. Validate wardrobe records and duplicate IDs; exact repair/rejection rules must be agreed before implementation. Never silently discard garments to repair a location problem.
- Export the entire inventory regardless of the active home filter. Import restores wardrobes and assignments together, replacing them with the imported inventory rather than retaining stale locations.
- Older app versions cannot preserve this new schema. Document that new backups require a compatible version; avoid implying downgrade compatibility.

## Non-goals for v1

- Nested rooms/shelves, maps, addresses, GPS or location permissions.
- Separate user accounts, cloud sync or separate databases for each wardrobe.
- Transfer history, notifications, reminders or background location tracking.
- Splitting one garment record's quantity between locations.
- A new multi-select/mass-move interface, unless requested during scope discussion.
- Visual redesign or changes to categories, collections and outfit logging beyond necessary integration.

## Acceptance checks for implementation

- Create two locations, rename one, restart: names and stable assignments survive.
- Reject blank and case-equivalent duplicate names; support Spanish accents and long meaningful names.
- Assign a garment, edit other fields and move it: retain its ID, photos, quantity, collection membership and log links.
- Bulk creation assigns every created record to the chosen location; cancelling creates nothing beyond the existing bulk flow's behavior.
- All, Unassigned and named locations produce consistent results in grouped/ungrouped views and alongside search and existing filters.
- Delete populated and empty locations; cancellation changes nothing, confirmation preserves all clothes and history and removes dangling references.
- Cover a location deleted while its form/filter is active and invalid/missing assignment IDs.
- Migrate legacy data and v1 data, including both historical Spanish encodings; repeated normalization is stable.
- Round-trip a new backup with multiple wardrobes, assignments, photos and logs. Import an old backup over populated new data without stale locations remaining.
- LLM export includes usable location names; full backups contain all items even while one location is selected.
- Run meaningful reducer/normalization/filter/UI tests, TypeScript and relevant lint. Validate the Android PR build, then the published Release once implementation is authorized. Report phone checks separately from automated checks.

## Implementation decisions

- Wardrobes / Armarios is the user-facing term; Unassigned is allowed and used for existing clothes.
- One location covers the whole quantity. Management is available from Home; no mass-move interface in v1.
- Malformed wardrobe records are omitted, the first valid duplicate ID/name wins, and unknown assignments become Unassigned. No garments are removed. Names compare after trimming and ignoring case.
- Home selection stays in a transient navigation context so both garment creation paths inherit it. Invalidated home selections fall back to All; forms require a new selection if their chosen wardrobe disappears.

## Validation

- 46 tests pass across 8 suites, including wardrobe creation/renaming, Unicode names, stable-ID moves, safe deletion, filtering, legacy/v1 Spanish migration, backup round trips, malformed references, selector behavior and management cancellation/validation.
- TypeScript and production Android JavaScript bundling pass.
- Targeted ESLint passes with no errors; existing shadowing/equality warnings remain in the legacy garment form and data normalizer. New wardrobe files pass without warnings.
- Android PR build and published Release verification pending. No connected phone installation or visual check performed.
