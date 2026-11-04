# Collections tab

Status: Owner asked for implementation and shipping on 2026-11-04 ("do it", after the proposal below). Decisions marked *(Claude)* were not asked and can be overridden.

## Goals

- Collections can be reached from the tab bar: **Closet · Outfits · Collections · More**.
- Opening a collection shows its garments and lets you log them together or change which garments it holds.
- Collections are created, renamed, reordered and deleted in the tab, so the More row goes.

## Non-goals

- Packing checklists, trip dates and collection colours (possible later steps).
- Changing how collections filter the Closet or group garments when logging an outfit.

## UX

### Collections tab

- A list of collections in the saved order, each with its garment count. Tap one to open it.
- **+** (bottom right, like the Closet) asks for a name and creates the collection.
- With two or more collections, a **sort** icon in the header opens a panel with Custom, A–Z and Z–A. In Custom, the panel lists the collections with up and down arrows to reorder them *(Claude: keeps the reordering the old screen had)*.
- No collections yet: a short explanation and a "New collection" button.

### A collection's page

- Header: the name, **Rename** and **Delete**. Delete asks first; garments stay in the closet.
- The garments as a grid at the Closet's grid size. Tapping a garment edits it *(Claude)*.
- Bottom bar:
  - **Add or remove garments:** the whole closet, grouped by category and type like the Closet, with this collection's garments ticked. Tick or untick, then ✓ saves or ✕ (or Back) cancels.
  - **Log as outfit:** the usual log dialog for all its garments (one Outfits entry, time adjustable), then "Logged" with Undo.
- An empty collection shows "Add garments" instead of the bar.

### More

- The Collections row is removed. More keeps Wardrobes, Categories, Closet info and Settings.

## Changes from the proposal

- Rename and delete are header buttons on the collection page rather than a long press on the list, so they're easy to find *(Claude)*.

## Implementation

- New tab screen `screens/bottomNav/Collections.tsx`; new stack screen `Collection` (`screens/stackNav/Collection.tsx`, param `value`).
- New `components/CollectionNameSheet.tsx` with `collectionNameError` (required, unique ignoring case; renaming may keep its own name).
- New reducer `setCollectionGarments({ value, ids })` sets membership for every garment in one step.
- `addCollection` gives a new collection a unique id even if an old renamed collection still uses that name as its id (previously the two would merge).
- Removed: `CollectionForm`, `CollectionList`, `EditItemList` and the `There_is_no_collection` string.

## Storage and migration

- No new fields and no migration. Collections and garment `collection` lists are stored as before; backups are unchanged.

## Edge cases

- Deleting a collection removes it from its garments and returns to the tab.
- Renaming keeps the id, so filters and garments still match.
- Opening a collection that no longer exists shows an empty page.

## Acceptance checks

- The tab bar shows Collections between Outfits and More, and More has no Collections row.
- Creating rejects an empty or duplicate name.
- Add or remove garments saves the ticked set, and Cancel keeps the old one.
- Log as outfit logs every garment in one entry.
- Delete asks for confirmation, then removes the collection and goes back.

## Validation

- `npx tsc --noEmit`, `npm run lint` and `npm test` (203 tests, 10 new in `__tests__/collectionsTab.test.tsx`) pass.
- Both new screens are in the Spanish-only render check.
- Not yet checked on a phone.
