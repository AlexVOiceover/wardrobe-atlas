import type { RootState } from "../redux/store";
import type { item, logsType, CollectionTag } from "../redux/itemsSlice";
import type { Category, CategoryCustomType } from "../redux/categoriesSlice";
import {
  COLLECTION_SORT_VALUES,
  normalizeCollectionTags,
} from "./collectionOrder";

import { normalizeWardrobes, validWardrobeId } from "./wardrobes";
export const DATA_FORMAT_VERSION = 2;
const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
function pick<T>(value: unknown, keys: readonly (keyof T)[]): T {
  const source = record(value);
  return Object.fromEntries(
    keys
      .filter(key => String(key) in source)
      .map(key => [key, source[String(key)]]),
  ) as T;
}

/** Every load/export uses the current model, so unsupported fields cannot persist. */
export function normalizeWardrobe(value: unknown, version?: number): RootState {
  const raw = record(value);
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
        ...pick<item>(value, [
          "id",
          "name",
          "type",
          "fit",
          "season",
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
        customTypes: list(record(value).customTypes).map(type =>
          pick<CategoryCustomType["customTypes"][number]>(type, [
            "label",
            "value",
            "icon",
          ]),
        ),
      })),
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
