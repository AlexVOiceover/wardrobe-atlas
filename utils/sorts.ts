import { localization } from "./localization";

// Sort orders of the Closet and Outfits, remembered in settings. A missing or
// unknown stored value means the default.
export const CLOSET_SORT_VALUES = [
  "LA",
  "NA",
  "ND",
  "PDA",
  "PDD",
  "LUA",
  "LUD",
] as const;
export const DEFAULT_CLOSET_SORT = "LA";
export const OUTFIT_SORT_VALUES = ["DD", "DA", "NA", "ND", "LA"] as const;
// Newest worn first.
export const DEFAULT_OUTFIT_SORT = "DD";
// The header icon that opens a sort or order choice, on every tab.
export const SORT_ICON = "swap-vertical-outline";

export const normalizeClosetSort = (value: unknown): string =>
  (CLOSET_SORT_VALUES as readonly unknown[]).includes(value)
    ? (value as string)
    : DEFAULT_CLOSET_SORT;
export const normalizeOutfitSort = (value: unknown): string =>
  (OUTFIT_SORT_VALUES as readonly unknown[]).includes(value)
    ? (value as string)
    : DEFAULT_OUTFIT_SORT;

const sortLabels: Record<string, readonly string[]> = {
  LA: localization.Last_Added,
  NA: localization.Name_Asc,
  ND: localization.Name_Desc,
  PDA: localization.PurchaseDateAsc,
  PDD: localization.PurchaseDateDesc,
  LUA: localization.LastUsedAsc,
  LUD: localization.LastUsedDesc,
  DA: localization.Date_Asc,
  DD: localization.Date_Desc,
};
export const sortLabel = (value: string, language: number) =>
  sortLabels[value]?.[language] ?? value;
export const closetSortOptions = (language: number) =>
  CLOSET_SORT_VALUES.map(value => ({ value, label: sortLabel(value, language) }));
export const outfitSortOptions = (language: number) =>
  OUTFIT_SORT_VALUES.map(value => ({ value, label: sortLabel(value, language) }));
