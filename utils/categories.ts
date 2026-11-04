import {
  BUILT_IN_CATEGORY_COUNT,
  typeKey,
  type CategoryList,
} from "../redux/categoriesSlice";
import type { item } from "../redux/itemsSlice";
import { clothesList, localization } from "./localization";

const builtInNames = [
  localization.Tops,
  localization.Bottoms,
  localization.Shoes,
  localization.Accessories,
];
export type CategoryOption = { index: number; label: string };
/** A stored name in the given language; older data has one text for both. */
const inLanguage = (name: unknown, language: number): string | undefined =>
  Array.isArray(name)
    ? name[language] || name[0]
    : typeof name === "string"
    ? name
    : undefined;
export type TypeOption = { value: string; label: string };

/** Built-in and custom categories the user hasn't deleted, with their names. */
export function visibleCategories(
  state: CategoryList,
  language: number,
): CategoryOption[] {
  const hidden = state.hiddenCategories ?? [];
  const builtIn = builtInNames
    .map((names, index) => ({
      index,
      label:
        inLanguage(state.categoryNames?.[String(index)], language) ||
        names[language] ||
        names[0],
    }))
    .filter(category => !hidden.includes(category.index));
  const custom = (state.Categories ?? []).map(category => ({
    index: category.index,
    label: category.name[language] || category.name[0],
  }));
  return [...builtIn, ...custom];
}

export function categoryLabel(
  state: CategoryList,
  index: number,
  language: number,
) {
  return visibleCategories(state, language).find(
    category => category.index === index,
  )?.label;
}

/** A category's types: built-in ones not deleted (renamed if so), then custom. */
export function categoryTypes(
  state: CategoryList,
  category: number,
  language: number,
): TypeOption[] {
  if (!visibleCategories(state, language).some(c => c.index === category))
    return [];
  const builtIn =
    category < BUILT_IN_CATEGORY_COUNT
      ? ((clothesList as TypeOption[][][])[language]?.[category] ?? [])
          .filter(
            type => !state.hiddenTypes?.includes(typeKey(category, type.value)),
          )
          .map(type => ({
            value: type.value,
            label:
              inLanguage(
                state.typeNames?.[typeKey(category, type.value)],
                language,
              ) || type.label,
          }))
      : [];
  const custom = (state.CategoryCustomTypes?.[category]?.customTypes ?? [])
    .filter(type => !builtIn.some(b => b.value === type.value))
    .map(type => ({
      value: type.value,
      label: inLanguage(type.labels, language) || type.label,
    }));
  return [...builtIn, ...custom];
}

/** Both names of a category, [English, Spanish], as shown in each language. */
export const categoryNamesOf = (state: CategoryList, index: number) =>
  [0, 1].map(
    language =>
      visibleCategories(state, language).find(c => c.index === index)?.label ??
      "",
  );

/** Both names of a subcategory, [English, Spanish]. */
export const typeNamesOf = (
  state: CategoryList,
  category: number,
  value: string,
) =>
  [0, 1].map(
    language =>
      categoryTypes(state, category, language).find(t => t.value === value)
        ?.label ?? "",
  );

/** Lowest category number no category or garment uses. */
export function nextCategoryIndex(state: CategoryList, garments: item[]) {
  return Math.max(
    BUILT_IN_CATEGORY_COUNT,
    ...(state.Categories ?? []).map(category => category.index + 1),
    ...garments.map(garment => (garment.category ?? 0) + 1),
  );
}

export const OTHER = "other";
export type ClosetTypeGroup = {
  key: string;
  label: string;
  garments: item[];
};
export type ClosetSection = {
  key: string;
  label: string;
  count: number;
  types: ClosetTypeGroup[];
};
/**
 * Groups garments, already filtered and sorted, by category and then type in
 * list order. Garments without a known type go to "Other" in their category,
 * and garments without a known category to an "Other" section at the end.
 */
export function closetSections(
  garments: item[],
  state: CategoryList,
  language: number,
): ClosetSection[] {
  const other = localization.Other[language];
  const categories = visibleCategories(state, language);
  const sections: ClosetSection[] = categories.map(category => {
    const inCategory = garments.filter(g => g.category === category.index);
    const types = categoryTypes(state, category.index, language);
    const groups = types.map(type => ({
      key: `c:${category.index}|t:${type.value}`,
      label: type.label,
      garments: inCategory.filter(g => g.type === type.value),
    }));
    groups.push({
      key: `c:${category.index}|t:${OTHER}`,
      label: other,
      garments: inCategory.filter(
        g => !types.some(type => type.value === g.type),
      ),
    });
    return {
      key: `c:${category.index}`,
      label: category.label,
      count: inCategory.length,
      types: groups.filter(group => group.garments.length > 0),
    };
  });
  const uncategorized = garments.filter(
    g => !categories.some(category => category.index === g.category),
  );
  sections.push({
    key: `c:${OTHER}`,
    label: other,
    count: uncategorized.length,
    types: [
      { key: `c:${OTHER}|t:${OTHER}`, label: "", garments: uncategorized },
    ],
  });
  return sections.filter(section => section.count > 0);
}

/** Latest Outfits date per garment id, as ISO strings. */
export function lastUseDates(
  garments: item[],
  logs: { eventId: string; eventDate: string }[],
) {
  const eventDates = new Map<string, string>();
  for (const log of logs) {
    try {
      const date = JSON.parse(log.eventDate);
      if (typeof date === "string") eventDates.set(log.eventId, date);
    } catch {}
  }
  const result: Record<string, string> = {};
  for (const garment of garments) {
    for (const id of garment.logIds ?? []) {
      const date = eventDates.get(id);
      if (date && (!result[garment.id] || date > result[garment.id]))
        result[garment.id] = date;
    }
  }
  return result;
}
