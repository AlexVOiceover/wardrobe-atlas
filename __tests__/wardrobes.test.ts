import reducer, {
  addWardrobe,
  renameWardrobe,
  deleteWardrobe,
  addItem,
  updateItem,
  importItems,
} from "../redux/itemsSlice";
import {
  createWardrobeBackup,
  normalizeWardrobe,
  readWardrobeBackup,
} from "../utils/wardrobeData";
import {
  filterByWardrobe,
  normalizeWardrobes,
  wardrobeNameError,
} from "../utils/wardrobes";
import { HomeFilter, filterItemsBySearch } from "../utils/filters";

jest.mock("nanoid", () => ({ nanoid: jest.fn(() => "generated") }));
const shirt = {
  id: "shirt",
  name: "Shirt",
  image: "photo",
  quantity: 3,
  category: 0,
  type: "Top",
  fit: "Regular",
  size: 1,
  sizeUnit: "UK",
  collection: ["Travel"],
  logIds: ["dinner"],
  wardrobeId: "home",
};
const base = {
  wardrobes: [
    { id: "home", name: "Home" },
    { id: "office", name: "Office" },
  ],
  items: [shirt, { ...shirt, id: "coat", name: "Coat", wardrobeId: undefined }],
  logs: [
    {
      eventId: "dinner",
      eventName: "Dinner",
      eventDate: "2026-11-02",
      logTime: "now",
    },
  ],
  collectionTags: [],
  refreshItems: false,
};

test("create and rename enforce trimmed unique Unicode names without a short cap", () => {
  let state = reducer(
    base,
    addWardrobe({ name: "   Ático con ropa para las vacaciones de verano   " }),
  );
  expect(state.wardrobes[2].name).toBe(
    "Ático con ropa para las vacaciones de verano",
  );
  expect(
    reducer(state, addWardrobe({ name: " HOME " })).wardrobes,
  ).toHaveLength(3);
  expect(reducer(state, addWardrobe({ name: " " })).wardrobes).toHaveLength(3);
  state = reducer(state, renameWardrobe({ id: "home", name: " Casa " }));
  expect(state.wardrobes[0]).toEqual({ id: "home", name: "Casa" });
  expect(state.items[0]).toEqual(shirt);
  expect(wardrobeNameError(state.wardrobes, "casa", "home")).toBeUndefined();
});

test("moving by stable garment ID preserves photos, quantity, collections and history", () => {
  const moved = reducer(
    base,
    updateItem({ ...shirt, id: "shirt", itemIndex: 1, wardrobeId: "office" }),
  );
  expect(moved.items[0]).toMatchObject({ ...shirt, wardrobeId: "office" });
  expect(moved.items[1]).toEqual(base.items[1]);
  expect(moved.logs).toEqual(base.logs);
  expect(reducer(moved, updateItem({ ...shirt, id: "missing" }))).toEqual(
    moved,
  );
  expect(
    reducer(base, addItem({ ...shirt, wardrobeId: "deleted" })).items[2]
      .wardrobeId,
  ).toBeUndefined();
});

test("deleting populated and empty wardrobes never removes clothes or logs", () => {
  const deleted = reducer(base, deleteWardrobe({ id: "home" }));
  expect(deleted.items).toHaveLength(2);
  expect(deleted.items[0]).toEqual({ ...shirt, wardrobeId: undefined });
  expect(deleted.logs).toEqual(base.logs);
  expect(reducer(base, deleteWardrobe({ id: "office" })).items).toEqual(
    base.items,
  );
});

test("location filter combines with search and existing filters without changing source data", () => {
  expect(filterByWardrobe(base.items)).toEqual(base.items);
  expect(filterByWardrobe(base.items, "").map(i => i.id)).toEqual(["coat"]);
  const scoped = filterByWardrobe(base.items, "home");
  const filters = {
    categories: [0],
    types: ["Top"],
    season: "",
    colors: [],
    sortValue: "NA",
  };
  expect(
    filterItemsBySearch(HomeFilter(filters, scoped, false), "shirt"),
  ).toEqual([shirt]);
  expect(HomeFilter(filters, [scoped], true)).toEqual([[shirt]]);
  expect(base.items[0]).toEqual(shirt);
});

test("migration and new backups preserve assignments, photos and Spanish across restarts", () => {
  const old = {
    settings: { language: 1 },
    itemsList: base,
    CategoryList: {},
    formatVersion: 1,
  };
  const state = normalizeWardrobe(old);
  const backup = createWardrobeBackup(state);
  expect(backup.formatVersion).toBe(2);
  const restored = readWardrobeBackup(JSON.parse(JSON.stringify(backup)));
  expect(restored).toEqual(state);
  expect(restored.settings.language).toBe(1);
  expect(restored.itemsList.items[0]).toMatchObject(shirt);
  expect(
    normalizeWardrobe({ ...old, formatVersion: 0, settings: { language: 2 } })
      .settings.language,
  ).toBe(1);
  const legacy = normalizeWardrobe({
    ...old,
    itemsList: { ...base, wardrobes: undefined },
  });
  expect(legacy.itemsList.wardrobes).toEqual([]);
  expect(legacy.itemsList.items[0].wardrobeId).toBeUndefined();
  expect(reducer(base, importItems(legacy.itemsList)).wardrobes).toEqual([]);
});

test("malformed location data is repaired deterministically without dropping garments", () => {
  expect(
    normalizeWardrobes([
      null,
      { id: "", name: "Bad" },
      { id: "home", name: " Home " },
      { id: "home", name: "Duplicate" },
      { id: "other", name: "HOME" },
    ]),
  ).toEqual([{ id: "home", name: "Home" }]);
  const state = normalizeWardrobe({
    itemsList: { ...base, wardrobes: [{ id: "office", name: "Office" }] },
  });
  expect(state.itemsList.items).toHaveLength(2);
  expect(state.itemsList.items[0].wardrobeId).toBeUndefined();
});
