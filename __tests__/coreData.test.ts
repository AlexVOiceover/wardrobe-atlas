import {
  normalizeWardrobe,
  createWardrobeBackup,
  readWardrobeBackup,
} from "../utils/wardrobeData";
import {
  localization,
  clothesList,
  colorNames,
  closetInfo,
} from "../utils/localization";
import { languagesList, seasonList } from "../utils/data";
import settingsReducer, {
  importSettings,
  setGridColumns,
  userNameSetter,
} from "../redux/settingsSlice";
import itemsReducer, { addItem, addLog, deleteLog } from "../redux/itemsSlice";

jest.mock("nanoid", () => ({ nanoid: () => "new-item" }));

const previous = {
  settings: {
    name: "Alexandria Long Username",
    language: 2,
    enableHeatMap: true,
    collectionSortValue: "CUSTOM",
    obsolete: true,
  },
  itemsList: {
    items: [
      {
        id: "shirt",
        name: "My shirt",
        type: "T-Shirt",
        fit: "Regular Fit",
        quantity: 1,
        size: 10,
        sizeUnit: "UK",
        category: 0,
        collection: ["Travel"],
        image: "photo-data",
        logIds: ["event"],
        primaryColor: "#112233",
        obsolete: 9,
      },
    ],
    logs: [
      {
        eventId: "event",
        eventName: "Dinner",
        eventDate: '"2026-11-01T12:00:00.000Z"',
        logTime: "2026-11-01",
        additionalNotes: "Keep this",
        obsolete: 1,
      },
    ],
    collectionTags: [
      {
        label: "Travel",
        value: "Travel",
        isOpen: true,
        arrangement: 0,
        obsolete: "unused",
      },
    ],
    refreshItems: false,
    obsolete: true,
  },
  CategoryList: {
    Categories: [
      { name: ["Custom"], index: 4, screen: "ItemForm", spriteSheet: null },
    ],
    CategoryCustomTypes: [
      { customTypes: [{ label: "My type", value: "My type", icon: 0 }] },
    ],
  },
  _persist: { version: -1, rehydrated: true },
  obsolete: true,
};
const mockWardrobe = normalizeWardrobe(previous);

test("normalization keeps wardrobe content and only the current schema", () => {
  expect(mockWardrobe.settings.language).toBe(1);
  expect(mockWardrobe.settings.name).toBe(previous.settings.name);
  expect(mockWardrobe.itemsList.items[0].image).toBe("photo-data");
  expect(mockWardrobe.itemsList.items[0].logIds).toEqual(["event"]);
  expect(mockWardrobe.itemsList.logs[0].additionalNotes).toBe("Keep this");
  expect(mockWardrobe.CategoryList.Categories[0].name).toEqual(["Custom"]);
  expect(JSON.stringify(mockWardrobe)).not.toContain('"obsolete"');
  expect(Object.keys(mockWardrobe.settings).sort()).toEqual([
    "appVer",
    "collectionSortValue",
    "enableHeatMap",
    "gridColumns",
    "language",
    "name",
  ]);
  // Older stored settings and backups have no grid size
  expect(mockWardrobe.settings.gridColumns).toBe(2);
});

test.each([
  [4, 4],
  [5, 5],
  [0, 2],
  [6, 2],
  ["3", 2],
])("stored grid size %p loads as %p", (stored, expected) => {
  const state = normalizeWardrobe({
    ...previous,
    settings: { ...previous.settings, gridColumns: stored },
  });
  expect(state.settings.gridColumns).toBe(expected);
  expect(
    settingsReducer(undefined, importSettings(state.settings)).gridColumns,
  ).toBe(expected);
});

test("grid size changes are kept within 1 to 5 columns", () => {
  let state = settingsReducer(undefined, { type: "init" });
  expect(state.gridColumns).toBe(2);
  state = settingsReducer(state, setGridColumns({ gridColumns: 5 }));
  expect(state.gridColumns).toBe(5);
  state = settingsReducer(state, setGridColumns({ gridColumns: 9 }));
  expect(state.gridColumns).toBe(2);
});

test.each([0, 1, 3, 99])(
  "unsupported previous preference %s falls back to English",
  language => {
    expect(
      normalizeWardrobe({
        ...previous,
        settings: { ...previous.settings, language },
      }).settings.language,
    ).toBe(0);
  },
);

test("current Spanish persists across saved state and repeated backup round trips", () => {
  const saved = { ...mockWardrobe, _persist: { version: 1, rehydrated: true } };
  expect(normalizeWardrobe(saved).settings.language).toBe(1);
  const backup = createWardrobeBackup(mockWardrobe);
  expect(backup.formatVersion).toBe(2);
  const restored = readWardrobeBackup(JSON.parse(JSON.stringify(backup)));
  expect(restored).toEqual(mockWardrobe);
  expect(readWardrobeBackup(createWardrobeBackup(restored))).toEqual(
    mockWardrobe,
  );
  expect(
    settingsReducer(undefined, importSettings(restored.settings)).language,
  ).toBe(1);
});

test("invalid backups are rejected before any import can replace data", () => {
  expect(() => readWardrobeBackup({})).toThrow("Invalid wardrobe backup");
  expect(() => readWardrobeBackup({ ...previous, itemsList: {} })).toThrow();
});

test("all shipped language choices, strings and clothing lists have exactly two languages", () => {
  expect(languagesList.map(language => language.value)).toEqual([0, 1]);
  Object.values(localization).forEach(strings => {
    expect(strings).toHaveLength(2);
    strings.forEach(text => expect(text.length).toBeGreaterThan(0));
  });
  [clothesList, colorNames, closetInfo, seasonList].forEach(packs =>
    expect(packs).toHaveLength(2),
  );
  expect(clothesList[0].map(types => types.map(type => type.value))).toEqual(
    clothesList[1].map(types => types.map(type => type.value)),
  );
  expect(seasonList[0].map(season => season.value)).toEqual(
    seasonList[1].map(season => season.value),
  );
});

test("long usernames are stored without truncation", () => {
  const name = "Alexandria de la Cruz, a much longer display name";
  const changed = settingsReducer(undefined, userNameSetter({ name }));
  expect(changed.name).toBe(name);
  expect(
    readWardrobeBackup(
      createWardrobeBackup({ ...mockWardrobe, settings: changed }),
    ).settings.name,
  ).toBe(name);
});

test("core garment creation and outfit logging remain intact", () => {
  let state = itemsReducer(
    undefined,
    addItem({ ...mockWardrobe.itemsList.items[0], collection: [] }),
  );
  expect(state.items).toHaveLength(1);
  expect(state.items[0].name).toBe("My shirt");
  state = itemsReducer(
    state,
    addLog({ selectedId: "new-item", logId: "new-event" }),
  );
  state = itemsReducer(
    state,
    addLog({ selectedId: "new-item", logId: "new-event" }),
  );
  expect(state.items[0].logIds).toEqual(["new-event"]);
  state = itemsReducer(state, deleteLog({ selectedLogId: "new-event" }));
  expect(state.items[0].logIds).toEqual([]);
});
