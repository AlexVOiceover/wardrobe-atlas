import type { RootState } from "../redux/store";
import {
  normalizeCollapsedSections,
  normalizeGridColumns,
} from "../redux/settingsSlice";
import type { item, logsType, CollectionTag } from "../redux/itemsSlice";
import type { Category, CategoryCustomType } from "../redux/categoriesSlice";
import {
  COLLECTION_SORT_VALUES,
  normalizeCollectionTags,
} from "./collectionOrder";

import { normalizeWardrobes, validWardrobeId } from "./wardrobes";
import { SEASONS } from "./data";
import { STYLES, defaultStyles } from "./styles";
export const DATA_FORMAT_VERSION = 2;
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
// Names are [English, Spanish]; an older single text is used for both.
const bothNames = (value: unknown): string[] | undefined => {
  const names = (Array.isArray(value) ? value : [value]).filter(
    (name): name is string => typeof name === "string" && !!name.trim(),
  );
  return names.length > 0 ? [names[0], names[1] ?? names[0]] : undefined;
};
// Renames of built-in categories and types.
const renames = (value: unknown) =>
  Object.fromEntries(
    Object.entries(record(value))
      .map(([key, names]) => [key, bothNames(names)])
      .filter((entry): entry is [string, string[]] => !!entry[1]),
  );
// Garments used to hold at most one season; without one they get all four.
const garmentSeasons = (garment: Record<string, unknown>) =>
  Array.isArray(garment.seasons)
    ? SEASONS.filter(season => (garment.seasons as unknown[]).includes(season))
    : SEASONS.includes(garment.season as string)
    ? [garment.season as string]
    : [...SEASONS];
function pick<T>(value: unknown, keys: readonly (keyof T)[]): T {
  const source = record(value);
  return Object.fromEntries(
    keys
      .filter(key => String(key) in source)
      .map(key => [key, source[String(key)]]),
  ) as T;
}

/** Every load/export uses the current model, so unsupported fields cannot persist. */
export function normalizeWardrobe(state: unknown, version?: number): RootState {
  const raw = record(state);
  const settings = record(raw.settings);
  const items = record(raw.itemsList);
  const categories = record(raw.CategoryList);
  const current =
    (version ??
      Number(raw.formatVersion ?? record(raw._persist).version ?? 0)) >= 1;
  const wardrobes = normalizeWardrobes(items.wardrobes);
  const language = settings.language === (current ? 1 : 2) ? 1 : 0;
  return {
    settings: {
      language,
      name: typeof settings.name === "string" ? settings.name : "User",
      enableHeatMap: settings.enableHeatMap === true,
      appVer: typeof settings.appVer === "string" ? settings.appVer : "1.0.1",
      collectionSortValue:
        settings.collectionSortValue === COLLECTION_SORT_VALUES.NAME_ASC ||
        settings.collectionSortValue === COLLECTION_SORT_VALUES.NAME_DESC
          ? settings.collectionSortValue
          : COLLECTION_SORT_VALUES.CUSTOM,
      gridColumns: normalizeGridColumns(settings.gridColumns),
      collapsedSections: normalizeCollapsedSections(settings.collapsedSections),
      lastWardrobeId:
        validWardrobeId(
          wardrobes,
          typeof settings.lastWardrobeId === "string"
            ? settings.lastWardrobeId
            : undefined,
        ) ?? "",
    },
    itemsList: {
      wardrobes,
      items: list(items.items).map(value => ({
        wardrobeId: validWardrobeId(
          wardrobes,
          typeof record(value).wardrobeId === "string"
            ? (record(value).wardrobeId as string)
            : undefined,
        ),
        seasons: garmentSeasons(record(value)),
        stored: record(value).stored === true,
        styles: Array.isArray(record(value).styles)
          ? STYLES.filter(style =>
              (record(value).styles as unknown[]).includes(style),
            )
          : defaultStyles(record(value).type as string),
        ...pick<item>(value, [
          "id",
          "name",
          "type",
          "brand",
          "fit",
          "quantity",
          "size",
          "sizeUnit",
          "category",
          "collection",
          "purchaseDate",
          "image",
          "automaticColor",
          "primaryColor",
          "secondaryColor",
          "tertiaryColor",
          "logIds",
        ]),
      })),
      logs: list(items.logs).map(value =>
        pick<logsType>(value, [
          "eventId",
          "eventDate",
          "eventName",
          "additionalNotes",
          "logTime",
        ]),
      ),
      collectionTags: normalizeCollectionTags(
        list(items.collectionTags).map(value =>
          pick<CollectionTag>(value, [
            "label",
            "value",
            "color",
            "isOpen",
            "arrangement",
          ]),
        ),
      ),
      refreshItems: items.refreshItems === true,
    },
    CategoryList: {
      Categories: list(categories.Categories).map(value => {
        const category = pick<Category>(value, [
          "name",
          "spriteSheet",
          "screen",
          "index",
        ]);
        const names = list(category.name).filter(
          (name): name is string => typeof name === "string",
        );
        return {
          ...category,
          name: names.length > 2 ? [names[0], names[2] || names[0]] : names,
        };
      }),
      CategoryCustomTypes: list(categories.CategoryCustomTypes).map(value => ({
        customTypes: list(record(value).customTypes).map(type => {
          const labels = bothNames(record(type).labels);
          return {
            ...pick<CategoryCustomType["customTypes"][number]>(type, [
              "label",
              "value",
              "icon",
            ]),
            ...(labels ? { labels } : {}),
          };
        }),
      })),
      hiddenCategories: list(categories.hiddenCategories).filter(
        (index): index is number => Number.isInteger(index),
      ),
      categoryNames: renames(categories.categoryNames),
      hiddenTypes: list(categories.hiddenTypes).filter(
        (key): key is string => typeof key === "string",
      ),
      typeNames: renames(categories.typeNames),
    },
  };
}

export function createWardrobeBackup(value: unknown) {
  return {
    formatVersion: DATA_FORMAT_VERSION,
    ...normalizeWardrobe(value, DATA_FORMAT_VERSION),
  };
}

export function readWardrobeBackup(value: unknown): RootState {
  const root = record(value);
  const items = record(root.itemsList);
  if (
    !root.settings ||
    !root.CategoryList ||
    !Array.isArray(items.items) ||
    !Array.isArray(items.logs)
  )
    throw new Error("Invalid wardrobe backup");
  return normalizeWardrobe(value);
}
