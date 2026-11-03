import type { item } from "../redux/itemsSlice";

// Built-in categories an outfit is made of: top, bottom, shoes, accessory.
export const OUTFIT_PIECES = [0, 1, 2, 3];
export const ACCESSORY = 3;

/** Season by date: Mar–May, Jun–Aug, Sep–Nov, Dec–Feb. */
export function currentSeason(date = new Date()) {
  const month = date.getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
}

/**
 * Garments that can fill one piece of the outfit, in the order they are
 * offered: least recently worn first (never worn before anything), or random.
 */
export function outfitCandidates(
  garments: item[],
  options: {
    category: number;
    style: string;
    season: string;
    lastUsed: Record<string, string>;
    preferLeastWorn: boolean;
    random?: () => number;
  },
) {
  const candidates = garments.filter(
    garment =>
      garment.category === options.category &&
      garment.stored !== true &&
      !!garment.seasons?.includes(options.season) &&
      !!garment.styles?.includes(options.style),
  );
  if (options.preferLeastWorn) {
    const used = (garment: item) => options.lastUsed[garment.id] ?? "";
    return candidates.sort((a, b) =>
      used(a) === used(b) ? 0 : used(a) < used(b) ? -1 : 1,
    );
  }
  const random = options.random ?? Math.random;
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  return candidates;
}
