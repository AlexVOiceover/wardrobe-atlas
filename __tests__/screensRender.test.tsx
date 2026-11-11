import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { HomeBottom } from "../screens/bottomNav/HomeBottom";
import { OutfitLog } from "../screens/bottomNav/OutfitLog";
import { BulkModeForm } from "../screens/stackNav/BulkModeForm";
import { ClosetInfo } from "../screens/stackNav/ClosetInfo";
import { ManageCategories } from "../screens/stackNav/ManageCategories";
import { SuggestOutfit } from "../screens/stackNav/SuggestOutfit";
import { Collections } from "../screens/bottomNav/Collections";
import { Collection } from "../screens/stackNav/Collection";
import { EventLogForm } from "../screens/stackNav/EventLogForm";
import { ItemForm } from "../screens/stackNav/ItemForm";
import { ItemSelector } from "../screens/stackNav/ItemSelector";
import { Settings } from "../screens/stackNav/Settings";
import { Wardrobes } from "../screens/stackNav/Wardrobes";
import { WardrobeProvider } from "../components/WardrobeSelector";
import { closetInfo, localization } from "../utils/localization";

const garment = {
  id: "shirt",
  name: "Linen shirt",
  type: "Shirt",
  image: "",
  category: 0,
  collection: ["summer"],
  logIds: ["dinner"],
  primaryColor: "#123456",
};
const mockState: any = {
  settings: { language: 1, name: "", enableHeatMap: true },
  CategoryList: { Categories: [], CategoryCustomTypes: [] },
  itemsList: {
    wardrobes: [{ id: "home", name: "Casa" }],
    // The coat's category was deleted, so it shows under "Otros".
    items: [
      garment,
      { ...garment, id: "coat", name: "Coat", category: 9, collection: [] },
    ],
    collectionTags: [{ label: "Verano", value: "summer", isOpen: true }],
    logs: [
      {
        eventId: "dinner",
        eventName: "Cena",
        eventDate: JSON.stringify(new Date()),
      },
    ],
  },
};
const mockDispatch = jest.fn();
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  popToTop: jest.fn(),
  popTo: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({}),
  usePreventRemove: jest.fn(),
  CommonActions: { goBack: jest.fn() },
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-vector-icons/MaterialCommunityIcons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  Dialog: Object.assign(() => null, {
    Title: "DialogTitle",
    Content: "DialogContent",
    Actions: "DialogActions",
  }),
  HelperText: "HelperText",
  Portal: "Portal",
  RadioButton: { Group: "RadioGroup", Item: "RadioItem" },
  Searchbar: "Searchbar",
  Snackbar: "Snackbar",
  Switch: "Switch",
  TextInput: Object.assign(() => null, { Icon: "InputIcon" }),
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-dropdown-picker", () => "Dropdown");
jest.mock("react-native-image-picker", () => ({}));
jest.mock("@somesoap/react-native-image-palette", () => ({}));
jest.mock("react-native-blob-util", () => ({}));
jest.mock("@bam.tech/react-native-image-resizer", () => ({}));
jest.mock("react-native-modal-datetime-picker", () => "DateModal");
jest.mock("react-native-wheel-color-picker", () => "ColorPicker");
jest.mock("../utils/backupArchive", () => ({
  exportBackup: jest.fn(),
  importBackup: jest.fn(),
}));
jest.mock("../components/UpdateControls", () => ({
  UpdateControls: "UpdateControls",
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Words that differ from their Spanish translation, so a match means a missing translation.
const english = [
  ...Object.values(localization)
    .filter(([en, es]) => en !== es)
    .map(([en]) => en),
  ...closetInfo[0],
];
const visibleText = (tree: ReactTestRenderer) => {
  const texts: string[] = [];
  const visit = (node: any) => {
    if (typeof node === "string") texts.push(node);
    else if (Array.isArray(node)) node.forEach(visit);
    else if (node?.children) node.children.forEach(visit);
  };
  visit(tree.toJSON());
  return texts;
};

const navProps = { navigation: mockNavigation };
test.each<[string, React.ReactElement]>([
  ["Closet", <HomeBottom />],
  ["Outfits", <OutfitLog />],
  ["Closet info", <ClosetInfo />],
  ["Categories", <ManageCategories />],
  ["Suggest outfit", <SuggestOutfit />],
  ["Select items", <ItemSelector />],
  ["Settings", <Settings />],
  ["Wardrobes", <Wardrobes />],
  ["Collections", <Collections {...navProps} />],
  [
    "Collection",
    <Collection {...navProps} route={{ params: { value: "summer" } }} />,
  ],
  [
    "Event form",
    <EventLogForm {...navProps} route={{ params: { eventId: "dinner" } }} />,
  ],
  [
    "Bulk form",
    <BulkModeForm {...navProps} route={{ params: { selectedCategory: 0 } }} />,
  ],
  [
    "Item form",
    <ItemForm {...navProps} route={{ params: { selectedCategory: 0 } }} />,
  ],
])("%s renders in Spanish without English labels", async (_name, screen) => {
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(<WardrobeProvider>{screen}</WardrobeProvider>);
  });
  const leaked = visibleText(tree!).filter(text => english.includes(text));
  expect(leaked).toEqual([]);
  await act(async () => tree!.unmount());
});

test("Closet groups garments by category and type, shows each once and keeps the add action", async () => {
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  const text = visibleText(tree!);
  // Category heading, then the type heading, then the deleted category's garments
  const order = ["Tops", "Camisa", "Linen shirt", "Otros", "Coat"].map(value =>
    text.indexOf(value),
  );
  expect(order).toEqual([...order].sort((a, b) => a - b));
  expect(order).not.toContain(-1);
  expect(text).not.toContain("Verano");
  expect(text.filter(value => value === "Linen shirt")).toHaveLength(1);
  expect(text.filter(value => value === "Coat")).toHaveLength(1);
  const add = tree!.root.find(
    x => x.props.accessibilityLabel === "Añadir prenda" && !!x.props.onPress,
  );
  await act(async () => add.props.onPress());
  expect(mockNavigation.navigate).toHaveBeenCalledWith("Category");
  await act(async () => tree!.unmount());
});

test("tapping a garment opens the use log; a long press starts selecting with it ticked", async () => {
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  const card = () =>
    tree!.root.find(
      x =>
        x.props.accessibilityLabel === "Linen shirt" && !!x.props.onLongPress,
    );
  const sheet = () =>
    tree!.root.findByType(require("../components/QuickLogSheet").QuickLogSheet);
  expect(sheet().props.garments).toEqual([]);
  // A single tap waits in case it's a double tap, then opens the log.
  jest.useFakeTimers();
  await act(async () => card().props.onPress());
  expect(sheet().props.garments).toEqual([]);
  await act(async () => jest.advanceTimersByTime(300));
  jest.useRealTimers();
  expect(sheet().props.garments.map((g: any) => g.id)).toEqual(["shirt"]);
  expect(mockNavigation.navigate).not.toHaveBeenCalledWith("ItemForm", {
    editingIndex: "shirt",
  });
  await act(async () => sheet().props.onClose());
  await act(async () => card().props.onLongPress());
  expect(mockNavigation.navigate).not.toHaveBeenCalledWith("ItemForm", {
    editingIndex: "shirt",
  });
  const bar = tree!.root.findByType(
    require("../components/SelectionBar").SelectionBar,
  );
  expect(bar.props.count).toBe(1);
  expect(card().props.accessibilityState).toEqual({ selected: true });
  // The sheet's garment row is the way to Edit.
  await act(async () => sheet().props.onEdit({ id: "shirt" }));
  expect(mockNavigation.navigate).toHaveBeenCalledWith("ItemForm", {
    editingIndex: "shirt",
  });
  await act(async () => tree!.unmount());
});

test("a double tap logs a use at once, with Undo", async () => {
  mockDispatch.mockClear();
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  const card = () =>
    tree!.root.find(
      x =>
        x.props.accessibilityLabel === "Linen shirt" && !!x.props.onLongPress,
    );
  jest.useFakeTimers();
  await act(async () => card().props.onPress());
  await act(async () => card().props.onPress());
  await act(async () => jest.advanceTimersByTime(1000));
  jest.useRealTimers();
  const sheet = tree!.root.findByType(
    require("../components/QuickLogSheet").QuickLogSheet,
  );
  expect(sheet.props.garments).toEqual([]);
  expect(mockDispatch.mock.calls.map(call => call[0].type)).toEqual([
    "itemsList/addEventLog",
    "itemsList/addLog",
  ]);
  expect(mockDispatch.mock.calls[1][0].payload.selectedId).toBe("shirt");
  expect(JSON.stringify(tree!.toJSON())).toContain("Registrado: Linen shirt");
  await act(async () => tree!.unmount());
});

test("select mode ticks garments and stores, moves or logs them together", async () => {
  mockDispatch.mockClear();
  mockNavigation.navigate.mockClear();
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  const press = (label: string, long = false) =>
    act(async () => {
      const node = tree!.root.find(
        x =>
          x.props.accessibilityLabel === label &&
          !!(long ? x.props.onLongPress : x.props.onPress),
      );
      long ? node.props.onLongPress() : node.props.onPress();
    });
  const bar = () =>
    tree!.root.findByType(require("../components/SelectionBar").SelectionBar);
  const sheet = () =>
    tree!.root.findByType(require("../components/QuickLogSheet").QuickLogSheet);
  await press("Seleccionar prendas");
  expect(
    tree!.root.findAll(x => x.props.accessibilityLabel === "Añadir prenda"),
  ).toHaveLength(0);
  // Taps and long presses tick instead of opening the sheet or the form
  await press("Linen shirt");
  expect(bar().props.count).toBe(1);
  expect(sheet().props.garments).toEqual([]);
  await press("Linen shirt", true);
  expect(bar().props.count).toBe(0);
  expect(mockNavigation.navigate).not.toHaveBeenCalledWith("ItemForm", {
    editingIndex: "shirt",
  });
  await press("Seleccionar todo");
  expect(bar().props.count).toBe(2);
  // One Store/Unstore button: Store while any ticked garment is in use.
  expect(bar().props.storing).toBe(true);
  expect(
    tree!.root.findAll(x => x.props.accessibilityLabel === "Sacar del almacén"),
  ).toHaveLength(0);
  // With everything visible ticked, the link deselects it.
  await press("Deseleccionar todo");
  expect(bar().props.count).toBe(0);
  await press("Seleccionar todo");
  await press("Almacenar");
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "itemsList/setGarmentsStored",
    payload: { ids: ["shirt", "coat"], stored: true },
  });
  // Storing ends select mode and offers Undo
  expect(
    tree!.root.findAll(x => x.props.accessibilityLabel === "Añadir prenda"),
  ).not.toHaveLength(0);
  const snackbar = tree!.root.findByType("Snackbar" as any);
  expect(snackbar.props.children).toBe("2 prendas almacenadas");
  await act(async () => snackbar.props.action.onPress());
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "itemsList/setGarmentsStored",
    payload: { ids: ["shirt", "coat"], stored: false },
  });
  // Move
  await press("Seleccionar prendas");
  await press("Coat");
  await press("Mover");
  await press("Casa");
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "itemsList/setGarmentsWardrobe",
    payload: { ids: ["coat"], wardrobeId: "home" },
  });
  // Log use opens one sheet for every ticked garment
  await press("Seleccionar prendas");
  await press("Seleccionar todo");
  await press("Registrar uso");
  expect(sheet().props.garments.map((g: any) => g.id)).toEqual([
    "shirt",
    "coat",
  ]);
  // ✕ ends the mode
  await press("Dejar de seleccionar");
  expect(
    tree!.root.findAll(x => x.props.accessibilityLabel === "Añadir prenda"),
  ).not.toHaveLength(0);
  await act(async () => tree!.unmount());
});

test("Select all skips folded sections, and Unstore shows when all ticked are stored", async () => {
  const before = mockState.settings.collapsedSections;
  const items = mockState.itemsList.items;
  mockState.settings.collapsedSections = ["c:other"];
  mockState.itemsList.items = items.map((g: any) => ({ ...g, stored: true }));
  mockDispatch.mockClear();
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  const press = (label: string) =>
    act(async () =>
      tree!.root
        .find(x => x.props.accessibilityLabel === label && !!x.props.onPress)
        .props.onPress(),
    );
  const bar = () =>
    tree!.root.findByType(require("../components/SelectionBar").SelectionBar);
  await press("Seleccionar prendas");
  await press("Seleccionar todo");
  // The coat is in the folded "Otros" section, so only the shirt is ticked.
  expect(bar().props.count).toBe(1);
  expect(bar().props.allSelected).toBe(true);
  expect(bar().props.storing).toBe(false);
  await press("Sacar del almacén");
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "itemsList/setGarmentsStored",
    payload: { ids: ["shirt"], stored: false },
  });
  await act(async () => tree!.unmount());
  mockState.settings.collapsedSections = before;
  mockState.itemsList.items = items;
});

test("an empty wardrobe offers all wardrobes, and the sort is remembered", async () => {
  mockDispatch.mockClear();
  let view: any;
  const Probe = () => {
    view = require("../components/WardrobeSelector").useWardrobeView();
    return null;
  };
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <Probe />
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  await act(async () => view.select("home"));
  const text = JSON.stringify(tree!.toJSON());
  expect(text).toContain("No hay ropa en Casa");
  await act(async () =>
    tree!.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Ver todos los armarios")!
      .props.onPress(),
  );
  expect(view.selected).toBeUndefined();
  expect(JSON.stringify(tree!.toJSON())).toContain("Linen shirt");
  // Choosing a sort is stored in settings.
  await act(async () =>
    tree!.root
      .find(
        x =>
          x.props.accessibilityLabel === "Vista y filtros" && !!x.props.onPress,
      )
      .props.onPress(),
  );
  await act(async () =>
    tree!.root
      .findAll(
        x => x.props.accessibilityLabel === "Último uso ↓" && !!x.props.onPress,
      )[0]
      .props.onPress(),
  );
  expect(mockDispatch).toHaveBeenLastCalledWith({
    type: "settings/setClosetSortValue",
    payload: { sortValue: "LUD" },
  });
  await act(async () => tree!.unmount());
});

test("Closet search matches brand, subcategory in either language and collection; Back closes it", async () => {
  const { BackHandler } = require("react-native");
  const listen = jest.spyOn(BackHandler, "addEventListener");
  const items = mockState.itemsList.items;
  mockState.itemsList.items = [
    { ...garment, brand: "Zara" },
    { ...garment, id: "coat", name: "Coat", category: 9, collection: [] },
  ];
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom />
      </WardrobeProvider>,
    );
  });
  await act(async () =>
    tree!.root
      .find(x => x.props.accessibilityLabel === "Buscar" && !!x.props.onPress)
      .props.onPress(),
  );
  const search = (value: string) =>
    act(async () =>
      tree!.root
        .findByType(require("../components/SearchField").SearchField)
        .props.onChangeText(value),
    );
  const shown = () => {
    const text = JSON.stringify(tree!.toJSON());
    return ["Linen shirt", "Coat"].filter(name => text.includes(name));
  };
  for (const query of ["zara", "camisa", "shirt", "verano"]) {
    await search(query);
    expect(shown()).toEqual(["Linen shirt"]);
  }
  await search("coat");
  expect(shown()).toEqual(["Coat"]);
  // Android Back closes the search and shows everything again.
  const back = listen.mock.calls[listen.mock.calls.length - 1][1] as any;
  let handled = false;
  await act(async () => {
    handled = back();
  });
  expect(handled).toBe(true);
  expect(
    tree!.root.findAllByType(require("../components/SearchField").SearchField),
  ).toHaveLength(0);
  expect(shown()).toEqual(["Linen shirt", "Coat"]);
  listen.mockRestore();
  await act(async () => tree!.unmount());
  mockState.itemsList.items = items;
});

test("Closet shows where a new garment was saved, without Undo, and clears the param", async () => {
  mockNavigation.setParams.mockClear();
  let tree: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <WardrobeProvider>
        <HomeBottom route={{ params: { saved: "Guardado en Casa" } }} />
      </WardrobeProvider>,
    );
  });
  const snackbar = tree!.root.findByType("Snackbar" as any);
  expect(snackbar.props.visible).toBe(true);
  expect(snackbar.props.children).toBe("Guardado en Casa");
  expect(snackbar.props.action).toBeUndefined();
  expect(mockNavigation.setParams).toHaveBeenCalledWith({ saved: undefined });
  await act(async () => tree!.unmount());
});
