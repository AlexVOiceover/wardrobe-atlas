# Suggest an outfit

Status: Owner asked for implementation and shipping on 2026-11-03. Decisions marked *(Claude)* were not asked and can be overridden.

The app suggests a complete outfit in a chosen style. Optionally it prefers garments that haven't been worn for the longest time, so forgotten clothes get used.

## Goals

- Garments have styles: Casual, Sporty, Elegant, Formal (owner).
- From Outfits, get an outfit suggestion for a style, reshuffle it piece by piece, and log it.
- Option to prefer the least recently worn garments.

## Non-goals

- Color matching between pieces (possible later).
- Weather, calendar or AI-based suggestions.
- Custom categories in outfits. Only the four built-in ones are used.
- Saving suggested outfits without wearing them.

## Styles on garments (owner: chips, pre-filled by subcategory)

- The garment form gets a **Styles** row of four chips, under Seasons.
- A new garment's styles follow its subcategory until the user taps a chip. Editing keeps the saved styles. Bulk add uses the subcategory defaults.
- Existing garments get their subcategory's defaults when loaded (and from older backups). After that, their styles are saved like any other field.
- Defaults *(Claude)*:

| Styles | Subcategories |
|---|---|
| Casual | T-Shirt, Tank Top, Short Sleeve Shirt, Peplum Top, Shorts, Bermuda, Culottes, Sandals, Flip-Flops, Slippers, Rain Boots, Backpack, Hat, Socks, Headband, Hairpin, Hair Accessories, Sunglasses |
| Casual, Sporty | Hoodie, Joggers, Leggings, Sneakers, Hiking Boots, Winter Boots, Watch |
| Sporty | Running Shoes |
| Casual, Elegant | Shirt, Blouse, Jacket, Polo Shirt, Sweater, Turtleneck, Jeans, Skirt, Leather Pants, Boots, Casual Shoes, Necklace, Bracelet, Ring, Earrings, Handbag, Belt, Scarf, Gloves |
| Elegant, Formal | Blazer, Trousers, Loafers, Dress Shoes, High Heels, Clutch, Tie |
| none | Upper Underwear, Underwear (never suggested) |
| Casual | Custom subcategories, or none |

## Suggest outfit (owner: Outfits tab)

- A **Suggest outfit** button at the top of Outfits opens the suggestion screen:

```
Style      [Casual] [Sporty] [Elegant] [Formal]
Season     [Spring] [Summer] [Fall] [Winter]
Prefer least worn                         ◉
Include an accessory                      ○
┌────┐ Top        Navy shirt   · last 2 Sep   ⟳
┌────┐ Bottom     Grey jeans   · never worn   ⟳
┌────┐ Shoes      White sneakers · last 1 Oct  ⟳
[ Shuffle all ]                 [ Wear this ]
```

- **Season** starts at the current one by date (Mar–May spring, Jun–Aug summer, Sep–Nov fall, Dec–Feb winter) *(Claude)*. **Style** starts at Casual. Both are remembered while the screen is open.
- **Candidates for each piece:**
  - Garments in that built-in category (Tops, Bottoms, Shoes, Accessories).
  - In use, not stored.
  - Having the chosen season and style.
  - In the Closet's selected wardrobe, or any wardrobe when "All wardrobes" is selected.
- **Prefer least worn** (on by default *(Claude)*): candidates are ordered never-worn first, then by oldest last use. ⟳ goes to the next one in that order and wraps around. Off: the order is random, and ⟳ walks through it.
- **Shuffle all** moves every piece to its next candidate. Changing style, season or the switches starts again from the first candidate.
- A piece with no candidates shows "No sporty bottoms for summer" in place of the garment. **Wear this** is enabled once at least one piece is shown.
- **Wear this** logs one Outfits entry now, named "Casual outfit", with every shown piece. Each piece's use count goes up. The app then returns to Outfits.
- Tapping a piece's photo opens that garment's form *(Claude)*.

## Storage and compatibility

- Items gain `styles: string[]`. Missing styles are filled from the subcategory on load and import, and unknown values are dropped.
- No persist version bump.

## Implementation

- `utils/styles.ts`: `STYLES` and the default styles for a subcategory.
- `redux/itemsSlice.ts`, `utils/wardrobeData.ts`: `styles` on items.
- `screens/stackNav/ItemForm.tsx`, `BulkModeForm.tsx`: Styles chips and defaults.
- `utils/outfits.ts`: current season, candidates and ordering (tested on its own).
- New `screens/stackNav/SuggestOutfit.tsx`, a route in `routers/stack.tsx`, and the button in `screens/bottomNav/OutfitLog.tsx`.
- `utils/localization.ts`: English and Spanish texts.

## Acceptance checks

- Styles chips: defaults follow the subcategory until touched, editing keeps them, and old data gets defaults.
- Candidates respect category, storage, season, style and wardrobe. Underwear is never suggested.
- With Prefer least worn, never-worn garments come first, then the oldest last use. ⟳ and Shuffle all cycle through the candidates.
- Missing pieces show a message. Wear this logs one entry with every shown piece.
- `npx tsc --noEmit`, `npm run lint` and `npm test` pass.
- Phone check by the owner.

## Validation

180 tests pass across 20 suites. TypeScript and lint pass with zero warnings.

New tests cover:
- Default styles per subcategory, including underwear never being suggested and custom subcategories getting Casual.
- Existing garments getting defaults on load while saved styles are kept and unknown ones dropped.
- The season by date.
- Candidates filtered by category, storage, season and style, with least-worn ordering and random ordering.
- The suggestion screen:
  - Least-worn picks with "never worn" and last-use lines.
  - ⟳ moving to the next option.
  - The accessory switch, and choices restarting from the first candidate.
  - Wear this logging one "Casual outfit" entry with every piece, then going back.
  - Missing-piece messages, logging only the pieces found.
  - Wear this disabled with no matches.
- The form's style chips following the subcategory until tapped, and editing keeping saved styles.
- The screen rendering in Spanish without English labels.

Not tested on a phone: how the screen feels with a real wardrobe, and whether the default styles suit the owner's clothes.
