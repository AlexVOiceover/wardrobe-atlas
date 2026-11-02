# UI first pass: menus and minimal styling

Status: Owner authorized implementation on 2026-11-02 and accepted all proposed decisions. Delivery tracked by the PR and main Android workflows.

This pass replaces the "no redesign" limit in the minimal functional base and item form plans. Their removals stay: no custom fonts, sprites, carousels or animation.

## Problems today

- Home shows a wardrobe selector plus seven same-weight buttons above the list. Settings, management screens, filters and search are mixed together.
- "Filter by color" and "Filters" open the same drawer in different states. Reset does not clear colors.
- "Collection" on Home opens collection management, not a view of collections.
- The Add tab is a screen with two buttons and a Back arrow. Logging an outfit lives there instead of under Outfit Log.
- Adding a garment takes Add, category, single/multiple, form. The category screen also mixes choosing with editing and deleting, and category delete has no confirmation.
- Every screen stacks the app header on its own header, and some pages have no title.
- Home is a single column of boxed cards with small photos and raw hex codes as text.
- Spacing and colors are hard-coded per screen. Outfit Log, Settings and Home each build their headers differently.

## Goals

- A clear structure: browse, log and manage each have one obvious home.
- One calm visual language across all screens.
- Fewer taps to add a garment.

## Non-goals

- Dark mode, custom fonts, animation or a new styling library.
- New product features or changes to what filters, stats and forms can do.
- Rewriting ItemForm, BulkModeForm or CollectionForm fields. They get the shared header and styling only.
- iOS validation.

## Structure

Bottom tabs with icon and label: **Closet**, **Outfits**, **More**. The Add tab goes away.

```
Closet                        Outfits                 More
  + Add garment                 + Log outfit            Wardrobes
    Choose category               Choose garments       Collections
      Garment form                  Log form            Categories
      Add several (bulk)                                Closet info
  Garment detail/edit           Log detail              Settings
```

- Closet header: wardrobe selector on the left, search and filter icons on the right, with a count on the filter icon when filters are active.
- Filter sheet: one panel with sort, category, type, season and color. Reset clears all of them.
- Closet list: two-column photo grid with name and type. Collections remain section headings. Colors show as small swatches instead of hex text. Use count and recency show as one quiet line.
- Empty states: one short message and one action.
- Add flow: `+` opens the category list, and choosing a category opens the form. "Add several" replaces the single/multiple screen and ModeScreen is removed. That is one step fewer.
- Category management moves to More, with delete confirmation.
- Outfits matches Closet: same header pattern, search and sort, with `+` to log.
- Settings: grouped plain rows (Profile, Language, Backup, Display, Updates) with no duplicated labels.

```
┌──────────────────────────┐
│ All wardrobes ▾     ⌕  ≡ │
├──────────────────────────┤
│ Summer                   │
│ ┌─────────┐ ┌─────────┐  │
│ │  photo  │ │  photo  │  │
│ └─────────┘ └─────────┘  │
│ Linen shirt  Chinos      │
│ Tops         Bottoms     │
│ ● ●  3 uses  ●  1 use    │
│                       ┌─┐│
│                       │+││
├──────────────────────────┤
│ Closet   Outfits   More  │
└──────────────────────────┘
```

## Visual language

- White background, near-black text, one gray for secondary text, one hairline divider color.
- Color comes from garment photos and swatches. Red is used only for destructive actions.
- System font with three text sizes: title, body, caption.
- Spacing on a 4/8/16/24 scale, 16px screen margins.
- Dividers and whitespace instead of boxes around everything. Small corner radius on photos and the sheet (currently 0).
- Outlined buttons only where needed, one filled primary action per screen, 44px minimum touch targets.

## Implementation

- `utils/theme.ts`: tokens for color, spacing, type and radius. Paper theme in `App.tsx` reads from it.
- `components/PageHeader.tsx`: back, title and optional actions, replacing `BackButton` titles and Outfit Log's custom header.
- New shared `ListRow` and `SectionHeading`; `ItemBox`/`ItemSummary` become the grid card.
- `routers/BottomTabNav.tsx`: three tabs, icons from the existing Ionicons font, stable English route names instead of translated ones.
- New `screens/bottomNav/More.tsx`, and a `ManageCategories` screen split out of `Category`.
- `HomeHeader` and `HomeFilterPanel` restructured around the single filter sheet.
- Remaining screens swap hard-coded values for tokens and adopt `PageHeader`.
- New labels in English and Spanish, including the hard-coded ones found in Home, Settings, EditCategory and DatePicker.
- Update status banner stays global so update prompts remain visible on every screen.

## Storage and compatibility

No Redux, persist, backup or native changes. No new dependencies. Saved data, including hidden season and fit values, is untouched.

## Edge cases

- Long names and translated labels in two columns, including small screens.
- Garments without photos need a placeholder cell of the same size.
- Large closets: the grid must not regress scrolling, since photos are base64 in state. Measure before and after; move to a virtualized list if needed.
- Selected wardrobe that was deleted, and filters that return nothing.
- Keyboard over the search field and the filter sheet.
- Android Back closes the filter sheet, as it does today.

## Acceptance checks

- Every current action is still reachable: garment add/edit/delete, bulk add, wardrobes, collections, categories and types, logs, stats, backup, updates, language and name.
- Closet has at most one selector and two header icons above the list.
- Add garment is reachable in one tap from Closet, and log outfit in one tap from Outfits.
- Filter Reset clears sort, category, type, season and color.
- No hard-coded colors outside `utils/theme.ts` and the garment color data.
- Spanish shows no English labels on changed screens.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass, with tests updated for new labels and added for the tabs, filter reset and add flow.
- Phone check by the owner through `npm run android`: all screens, small screen, keyboard.

## Decisions

1. The app-wide header is removed. The update banner stays on every screen, and the version is shown in Settings.
2. Closet uses a two-column grid.
3. Corners are square, with a small radius on photos, dialogs and bottom sheets.

## Changes found during implementation

- Saving a garment or outfit relied on going back one tab from the old Add tab. Forms now return to the tab they came from.
- Filter, sort and language dropdowns became chips, which removes their layering workarounds.
- The delete dialog said "this log" for every item, so garments and categories now have their own message.
- `package.json` and `jest.config.js` both configured Jest, which broke plain `npm test`. The `package.json` entry is removed.

## Validation

73 tests pass across 13 suites, including a render of 12 screens in Spanish that fails on English labels, the add flow, More navigation, filter reset and category delete confirmation. TypeScript, lint with zero warnings and the production JS bundle pass. The Android build is recorded by GitHub Actions.

Not tested on a phone. Layout, keyboard behaviour, small screens and scrolling with a large closet still need the owner's check. Photos render at a larger size than before, so large-closet scrolling is the main thing to watch.

## Known limitations

- Deleting a collection or a category type still has no confirmation.
- Dropdown built-in messages such as "Nothing to show" remain in English.
