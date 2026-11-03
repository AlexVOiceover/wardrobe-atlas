import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import categoriesReducer, {
  addCategory,
  addTypeToCategory,
  CurrentCategories,
  delCategory,
  deleteType,
  renameCategory,
  renameType,
  restoreDefaultCategories,
} from "../redux/categoriesSlice";
import itemsReducer, {
  clearGarmentCategory,
  clearGarmentType,
  setGarmentsStored,
  setGarmentsWardrobe,
  updateItem,
} from "../redux/itemsSlice";
import { ItemBox, garmentSummary } from "../components/ItemBox";
import settingsReducer, { toggleSection } from "../redux/settingsSlice";
import {
  categoryTypes,
  closetSections,
  lastUseDates,
  nextCategoryIndex,
  visibleCategories,
} from "../utils/categories";
import { activeFilterCount, HomeFilter } from "../utils/filters";
import {
  createWardrobeBackup,
  readWardrobeBackup,
} from "../utils/wardrobeData";
import { QuickLogSheet, usageSummary } from "../components/QuickLogSheet";
import { ClosetSections } from "../components/ClosetSections";
import { EditCategory } from "../screens/stackNav/EditCategory";

const mockDispatch = jest.fn();
const mockState: any = {
  settings: { language: 0 },
  CategoryList: { ...CurrentCategories },
  itemsList: { items: [], logs: [] },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("nanoid", () => ({ nanoid: () => "log-1" }));
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button", Switch: "Switch" }));
jest.mock("react-native-modal-datetime-picker", () => "DateModal");
jest.mock("../components/BottomSheet", () => ({ BottomSheet: "BottomSheet" }));
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
jest.mock("../components/PageHeader", () => ({ PageHeader: "PageHeader" }));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => mockDispatch.mockClear());

const garment = (id: string, category: number, type: string, extra = {}) =>
  ({ id, name: id, category, type, logIds: [], ...extra } as any);
const custom = (
  categories: { index: number; name: string }[],
  types: Record<number, string[]> = {},
) => {
  const state: any = {
    ...CurrentCategories,
    Categories: categories.map(c => ({ index: c.index, name: [c.name] })),
    CategoryCustomTypes: [],
  };
  Object.entries(types).forEach(([index, names]) => {
    state.CategoryCustomTypes[Number(index)] = {
      customTypes: names.map(name => ({ label: name, value: name, icon: 0 })),
    };
  });
  return state;
};
const render = (element: React.ReactElement) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree;
};

describe("categories", () => {
  test("deleting a custom category keeps other categories' types", () => {
    const state = custom(
      [
        { index: 4, name: "Hats" },
        { index: 5, name: "Bags" },
      ],
      { 0: ["Crop top"], 5: ["Tote"] },
    );
    const next = categoriesReducer(state, delCategory({ index: 4 }));
    expect(categoryTypes(next, 0, 0).map(t => t.label)).toContain("Crop top");
    expect(categoryTypes(next, 5, 0).map(t => t.label)).toEqual(["Tote"]);
    expect(visibleCategories(next, 0).map(c => c.label)).toEqual([
      "Tops",
      "Bottoms",
      "Shoes",
      "Accessories",
      "Bags",
    ]);
  });

  test("built-in categories and types can be renamed, deleted and restored", () => {
    let state = categoriesReducer(
      CurrentCategories,
      renameCategory({ index: 0, name: "Upper" }),
    );
    state = categoriesReducer(state, delCategory({ index: 3 }));
    state = categoriesReducer(
      state,
      renameType({ category: 0, value: "Shirt", name: "Button-up" }),
    );
    state = categoriesReducer(
      state,
      deleteType({ category: 0, value: "Blouse" }),
    );
    // A rename is the user's own text, so it shows in both languages.
    expect(visibleCategories(state, 1).map(c => c.label)).toEqual([
      "Upper",
      "Parte inferior",
      "Zapatos",
    ]);
    const tops = categoryTypes(state, 0, 0);
    expect(tops.find(t => t.value === "Shirt")?.label).toBe("Button-up");
    expect(tops.some(t => t.value === "Blouse")).toBe(false);
    expect(categoryTypes(state, 3, 0)).toEqual([]);
    state = categoriesReducer(state, restoreDefaultCategories());
    expect(visibleCategories(state, 0)).toHaveLength(4);
    expect(
      categoryTypes(state, 0, 0).find(t => t.value === "Shirt")?.label,
    ).toBe("Shirt");
  });

  test("custom types keep their value when renamed, and new types never reuse it", () => {
    let state = custom([{ index: 4, name: "Hats" }], { 4: ["Cap"] });
    state = categoriesReducer(
      state,
      renameType({ category: 4, value: "Cap", name: "Baseball cap" }),
    );
    state = categoriesReducer(
      state,
      addTypeToCategory({ index: 4, typeName: "Cap" }),
    );
    expect(categoryTypes(state, 4, 0)).toEqual([
      { value: "Cap", label: "Baseball cap" },
      { value: "Cap (2)", label: "Cap" },
    ]);
    state = categoriesReducer(state, deleteType({ category: 4, value: "Cap" }));
    expect(categoryTypes(state, 4, 0)).toEqual([
      { value: "Cap (2)", label: "Cap" },
    ]);
  });

  test("new categories take a number no category or garment uses", () => {
    const state = custom([{ index: 4, name: "Hats" }]);
    const garments = [garment("old", 7, "")];
    expect(nextCategoryIndex(state, garments)).toBe(8);
    const next = categoriesReducer(
      state,
      addCategory({ name: "Bags", index: nextCategoryIndex(state, garments) }),
    );
    expect(next.Categories.map(c => c.index)).toEqual([4, 8]);
  });

  test("deleting moves garments to Other without deleting them", () => {
    const items: any = {
      wardrobes: [],
      collectionTags: [],
      logs: [],
      items: [
        garment("a", 4, "Cap"),
        garment("b", 0, "Shirt"),
        garment("c", 0, "Blouse"),
      ],
    };
    let state = itemsReducer(items, clearGarmentCategory({ category: 4 }));
    state = itemsReducer(
      state,
      clearGarmentType({ category: 0, value: "Shirt" }),
    );
    expect(state.items.map(g => [g.id, g.category, g.type])).toEqual([
      ["a", -1, ""],
      ["b", 0, ""],
      ["c", 0, "Blouse"],
    ]);
    state = itemsReducer(
      state,
      updateItem({ id: "a", category: 2, type: "Sneakers", collection: [] }),
    );
    expect(state.items[0]).toMatchObject({ category: 2, type: "Sneakers" });
  });

  test("category changes, renames and folds survive a backup round trip", () => {
    const backup = createWardrobeBackup({
      settings: { collapsedSections: ["c:0", 3] },
      itemsList: { items: [], logs: [] },
      CategoryList: {
        Categories: [],
        CategoryCustomTypes: [],
        hiddenCategories: [3, "x"],
        categoryNames: { 0: "Upper", 1: "" },
        hiddenTypes: ["0|Blouse"],
        typeNames: { "0|Shirt": "Button-up" },
      },
    });
    const restored = readWardrobeBackup(JSON.parse(JSON.stringify(backup)));
    expect(restored.settings.collapsedSections).toEqual(["c:0"]);
    expect(restored.CategoryList).toMatchObject({
      hiddenCategories: [3],
      categoryNames: { 0: "Upper" },
      hiddenTypes: ["0|Blouse"],
      typeNames: { "0|Shirt": "Button-up" },
    });
  });
});

describe("Closet structure and sorting", () => {
  test("garments group by category then type in list order, with Other last", () => {
    const state = custom([{ index: 4, name: "Hats" }], { 4: ["Cap"] });
    const sections = closetSections(
      [
        garment("tee", 0, "T-Shirt"),
        garment("sweater", 0, "Sweater"),
        garment("mystery", 0, "Gone"),
        garment("cap", 4, "Cap"),
        garment("lost", 9, "Cap"),
      ],
      state,
      0,
    );
    expect(
      sections.map(s => [
        s.label,
        s.count,
        s.types.map(t => [t.label, t.garments.map(g => g.id)]),
      ]),
    ).toEqual([
      [
        "Tops",
        3,
        [
          ["T-Shirt", ["tee"]],
          ["Sweater", ["sweater"]],
          ["Other", ["mystery"]],
        ],
      ],
      ["Hats", 1, [["Cap", ["cap"]]]],
      ["Other", 1, [["", ["lost"]]]],
    ]);
  });

  test("last used sorts both ways with never-used garments last", () => {
    const garments = [
      garment("never", 0, "", { logIds: [] }),
      garment("old", 0, "", { logIds: ["e1"] }),
      garment("recent", 0, "", { logIds: ["e1", "e2"] }),
    ];
    const lastUsed = lastUseDates(garments, [
      { eventId: "e1", eventDate: JSON.stringify(new Date("2026-01-01")) },
      { eventId: "e2", eventDate: JSON.stringify(new Date("2026-10-01")) },
    ]);
    expect(lastUsed).toEqual({
      old: "2026-01-01T00:00:00.000Z",
      recent: "2026-10-01T00:00:00.000Z",
    });
    const sorted = (sortValue: string) =>
      HomeFilter(
        {
          sortValue,
          categories: [],
          types: [],
          seasons: [],
          colors: [],
          lastUsed,
        },
        [...garments],
        false,
      ).map(g => g.id);
    expect(sorted("LUA")).toEqual(["old", "recent", "never"]);
    expect(sorted("LUD")).toEqual(["recent", "old", "never"]);
  });

  test("the collection filter keeps garments in any chosen collection", () => {
    const garments = [
      garment("a", 0, "", { collection: ["work"] }),
      garment("b", 0, "", { collection: ["gym"] }),
      garment("c", 0, "", { collection: [] }),
    ];
    const filters = {
      sortValue: "LA",
      categories: [],
      types: [],
      seasons: [],
      colors: [],
    };
    expect(
      HomeFilter(
        { ...filters, collections: ["work", "gym"] },
        [...garments],
        false,
      ).map(g => g.id),
    ).toEqual(["a", "b"]);
    expect(HomeFilter(filters, [...garments], false)).toHaveLength(3);
  });

  test("folded headings hide their garments and are toggled in settings", () => {
    const sections = closetSections(
      [garment("tee", 0, "T-Shirt"), garment("cap", 1, "Jeans")],
      CurrentCategories,
      0,
    );
    const onToggle = jest.fn();
    const tree = render(
      <ClosetSections
        sections={sections}
        collapsed={["c:1", "c:0|t:T-Shirt"]}
        onToggle={onToggle}
        columns={2}
        renderGarment={g => g.id}
      />,
    );
    const text = JSON.stringify(tree.toJSON());
    expect(text).toContain("T-Shirt");
    expect(text).not.toContain('"tee"');
    expect(text).not.toContain("Jeans");
    act(() =>
      tree.root
        .find(
          n => n.props.accessibilityLabel === "Bottoms, 1" && n.props.onPress,
        )
        .props.onPress(),
    );
    expect(onToggle).toHaveBeenCalledWith("c:1");
    let settings = settingsReducer(undefined, toggleSection({ key: "c:1" }));
    expect(settings.collapsedSections).toEqual(["c:1"]);
    settings = settingsReducer(settings, toggleSection({ key: "c:1" }));
    expect(settings.collapsedSections).toEqual([]);
  });
});

describe("quick use log", () => {
  const shirt = garment("shirt", 0, "Shirt", {
    name: "Navy shirt",
    logIds: ["a", "b"],
  });
  const sheet = (onLogged = jest.fn(), onEdit = jest.fn()) =>
    render(
      <QuickLogSheet
        garments={[shirt]}
        lastUsed="2026-10-28T10:00:00.000Z"
        language={0}
        onClose={jest.fn()}
        onEdit={onEdit}
        onLogged={onLogged}
      />,
    );
  const button = (tree: ReactTestRenderer, label: string) =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === label)!;

  test("shows uses and last use", () => {
    expect(usageSummary(0, undefined, 0)).toBe("Not used yet");
    expect(usageSummary(1, "2026-10-28T10:00:00.000Z", 1)).toBe(
      "Usada una vez · última 28/10/2026",
    );
    expect(JSON.stringify(sheet().toJSON())).toContain(
      "Used 2 times · last 28/10/2026",
    );
  });

  test("Log use saves one Outfits entry for the garment, now", () => {
    const onLogged = jest.fn();
    const tree = sheet(onLogged);
    const before = Date.now();
    act(() => button(tree, "Log use").props.onPress());
    const [event, link] = mockDispatch.mock.calls.map(call => call[0]);
    expect(event.type).toBe("itemsList/addEventLog");
    expect(event.payload).toMatchObject({
      eventId: "log-1",
      eventName: "Navy shirt",
    });
    const when = new Date(JSON.parse(event.payload.eventDate)).getTime();
    expect(when).toBeGreaterThanOrEqual(before - 1000);
    expect(link).toEqual({
      type: "itemsList/addLog",
      payload: { selectedId: "shirt", logId: "log-1" },
    });
    expect(onLogged).toHaveBeenCalledWith({
      eventId: "log-1",
      name: "Navy shirt",
    });
  });

  test("a picked earlier time is saved, and Edit opens the form", () => {
    const onEdit = jest.fn();
    const tree = sheet(jest.fn(), onEdit);
    const earlier = new Date("2026-11-01T08:30:00.000Z");
    act(() =>
      tree.root.findByType("DateModal" as any).props.onConfirm(earlier),
    );
    expect(
      tree.root.find(
        n =>
          typeof n.props.accessibilityLabel === "string" &&
          n.props.accessibilityLabel.startsWith("When: 01/11/2026"),
      ),
    ).toBeTruthy();
    act(() => button(tree, "Log use").props.onPress());
    expect(JSON.parse(mockDispatch.mock.calls[0][0].payload.eventDate)).toBe(
      earlier.toISOString(),
    );
    act(() => button(tree, "Edit").props.onPress());
    expect(onEdit).toHaveBeenCalledWith(shirt);
  });
});

test("types are renamed in place and deleted after confirmation, counting garments", () => {
  mockState.itemsList.items = [
    garment("a", 0, "Shirt"),
    garment("b", 0, "Shirt"),
    garment("c", 1, "Shirt"),
  ];
  const tree = render(
    <EditCategory navigation={{}} route={{ params: { categoryIndex: 0 } }} />,
  );
  const press = (label: string) =>
    act(() =>
      tree.root
        .find(n => n.props.accessibilityLabel === label && n.props.onPress)
        .props.onPress(),
    );
  press("Rename: Shirt");
  const input = tree.root.find(
    n => n.props.accessibilityLabel === "Rename: Shirt" && n.props.onChangeText,
  );
  act(() => input.props.onChangeText("T-Shirt"));
  press("Save");
  // Already used by another type
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(JSON.stringify(tree.toJSON())).toContain(
    "Please enter a different name",
  );
  act(() => input.props.onChangeText("Button-up"));
  press("Save");
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "CategoryList/renameType",
    payload: { category: 0, value: "Shirt", name: "Button-up" },
  });
  mockDispatch.mockClear();
  press("Delete: Shirt");
  const dialog = tree.root.findByType("ConfirmationDialog" as any);
  expect(dialog.props.message).toContain("2 garments will move to Other.");
  act(() => dialog.props.onConfirm());
  expect(mockDispatch.mock.calls.map(call => call[0])).toEqual([
    {
      type: "CategoryList/deleteType",
      payload: { category: 0, value: "Shirt" },
    },
    {
      type: "itemsList/clearGarmentType",
      payload: { category: 0, value: "Shirt" },
    },
  ]);
  act(() => tree.unmount());
});

test("old garments keep their one season, or get all four, after load and import", () => {
  const state = {
    settings: {},
    CategoryList: {},
    itemsList: {
      items: [
        { id: "a", season: "Winter" },
        { id: "b", season: "" },
        { id: "c" },
        { id: "d", seasons: ["Summer", "Monsoon", "Spring"] },
      ],
      logs: [],
    },
  };
  const restored = readWardrobeBackup(
    JSON.parse(JSON.stringify(createWardrobeBackup(state))),
  );
  expect(restored.itemsList.items.map(g => g.seasons)).toEqual([
    ["Winter"],
    ["Spring", "Summer", "Fall", "Winter"],
    ["Spring", "Summer", "Fall", "Winter"],
    ["Spring", "Summer"],
  ]);
  expect(JSON.stringify(restored)).not.toContain('"season"');
});

test("the season filter keeps garments in any chosen season", () => {
  const garments = [
    garment("summer", 0, "", { seasons: ["Summer"] }),
    garment("winter", 0, "", { seasons: ["Winter"] }),
    garment("none", 0, "", { seasons: [] }),
  ];
  const filters = {
    sortValue: "LA",
    categories: [],
    types: [],
    colors: [],
  };
  expect(
    HomeFilter(
      { ...filters, seasons: ["Summer", "Winter"] },
      [...garments],
      false,
    ).map(g => g.id),
  ).toEqual(["summer", "winter"]);
  expect(
    HomeFilter({ ...filters, seasons: [] }, [...garments], false),
  ).toHaveLength(3);
});

describe("storage", () => {
  const items = (): any => ({
    wardrobes: [{ id: "home", name: "Home" }],
    collectionTags: [],
    logs: [],
    items: [
      garment("a", 0, "", { wardrobeId: "home" }),
      garment("b", 0, "", { stored: true }),
      garment("c", 0, ""),
    ],
  });
  test("several garments are stored, unstored and moved at once", () => {
    let state = itemsReducer(
      items(),
      setGarmentsStored({ ids: ["a", "c"], stored: true }),
    );
    expect(state.items.map(g => g.stored)).toEqual([true, true, true]);
    state = itemsReducer(
      state,
      setGarmentsStored({ ids: ["b"], stored: false }),
    );
    expect(state.items.map(g => g.stored)).toEqual([true, false, true]);
    state = itemsReducer(
      state,
      setGarmentsWardrobe({ ids: ["b", "c"], wardrobeId: "home" }),
    );
    expect(state.items.map(g => g.wardrobeId)).toEqual([
      "home",
      "home",
      "home",
    ]);
    // Unassigned, or a wardrobe that no longer exists
    state = itemsReducer(
      state,
      setGarmentsWardrobe({ ids: ["a"], wardrobeId: "" }),
    );
    state = itemsReducer(
      state,
      setGarmentsWardrobe({ ids: ["b"], wardrobeId: "gone" }),
    );
    expect(state.items.map(g => g.wardrobeId)).toEqual([
      undefined,
      undefined,
      "home",
    ]);
  });

  test("stored survives a backup round trip and old garments load as in use", () => {
    const restored = readWardrobeBackup(
      JSON.parse(
        JSON.stringify(
          createWardrobeBackup({
            settings: {},
            CategoryList: {},
            itemsList: {
              items: [
                { id: "a", stored: true },
                { id: "b" },
                { id: "c", stored: "yes" },
              ],
              logs: [],
            },
          }),
        ),
      ),
    );
    expect(restored.itemsList.items.map(g => g.stored)).toEqual([
      true,
      false,
      false,
    ]);
  });

  test("the storage filter shows stored or in-use garments and counts once", () => {
    const garments = items().items;
    const filters = {
      sortValue: "LA",
      categories: [],
      types: [],
      seasons: [],
      colors: [],
    };
    const ids = (storage: string) =>
      HomeFilter({ ...filters, storage }, [...garments], false).map(g => g.id);
    expect(ids("stored")).toEqual(["b"]);
    expect(ids("inUse")).toEqual(["a", "c"]);
    expect(ids("")).toEqual(["a", "b", "c"]);
    expect(
      activeFilterCount({
        seasonFilter: [],
        categoriesFilter: [],
        TypeFilter: [],
        colorFilter: [],
        storageFilter: "stored",
      }),
    ).toBe(1);
  });

  test("stored garments are faded with a box icon; selection shows a tick", () => {
    const tree = render(
      <ItemBox {...garmentSummary(garment("b", 0, "", { stored: true }))} />,
    );
    expect(
      tree.root.findAll(n => n.props.accessibilityLabel === "In storage"),
    ).not.toHaveLength(0);
    const picked = render(
      <ItemBox
        {...garmentSummary(garment("c", 0, ""))}
        selected
        onPress={jest.fn()}
      />,
    );
    expect(
      picked.root.findAll(n => n.props.accessibilityLabel === "In storage"),
    ).toHaveLength(0);
    expect(
      picked.root.find(n => n.props.accessibilityState?.selected === true),
    ).toBeTruthy();
  });

  test("logging several garments makes one Outfit entry; one garment can be stored from the sheet", () => {
    const shirt = garment("shirt", 0, "", { name: "Shirt" });
    const jeans = garment("jeans", 1, "", { name: "Jeans" });
    const onLogged = jest.fn();
    const tree = render(
      <QuickLogSheet
        garments={[shirt, jeans]}
        language={0}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onLogged={onLogged}
      />,
    );
    expect(JSON.stringify(tree.toJSON())).toContain("2 garments");
    expect(tree.root.findAllByType("Switch" as any)).toHaveLength(0);
    act(() =>
      tree.root
        .findAllByType("Button" as any)
        .find(b => b.props.children === "Log use")!
        .props.onPress(),
    );
    const actions = mockDispatch.mock.calls.map(call => call[0]);
    expect(actions.map(a => a.type)).toEqual([
      "itemsList/addEventLog",
      "itemsList/addLog",
      "itemsList/addLog",
    ]);
    expect(actions[0].payload.eventName).toBe("Outfit");
    expect(actions.slice(1).map(a => a.payload.selectedId)).toEqual([
      "shirt",
      "jeans",
    ]);
    mockDispatch.mockClear();
    const single = render(
      <QuickLogSheet
        garments={[shirt]}
        language={0}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onLogged={jest.fn()}
      />,
    );
    act(() =>
      single.root.findByType("Switch" as any).props.onValueChange(true),
    );
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "itemsList/setGarmentsStored",
      payload: { ids: ["shirt"], stored: true },
    });
  });
});
