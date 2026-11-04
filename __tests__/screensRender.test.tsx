import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { HomeBottom } from "../screens/bottomNav/HomeBottom";
import { OutfitLog } from "../screens/bottomNav/OutfitLog";
import { BulkModeForm } from "../screens/stackNav/BulkModeForm";
import { ClosetInfo } from "../screens/stackNav/ClosetInfo";
import { ManageCategories } from "../screens/stackNav/ManageCategories";
import { SuggestOutfit } from "../screens/stackNav/SuggestOutfit";
import { CollectionForm } from "../screens/stackNav/CollectionForm";
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
  dispatch: jest.fn(),
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
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
jest.mock("../utils/exportStoreToJson", () => ({
  exportStoreToJson: jest.fn(),
}));
jest.mock("../utils/importStoreFromJson", () => ({
  importStoreFromJson: jest.fn(),
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
  ["Collections", <CollectionForm />],
  [
    "Event form",
    <EventLogForm {...navProps} route={{ params: { selectedIDs: [] } }} />,
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

test("tapping a garment opens the use log; a long press edits it", async () => {
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
  await act(async () => card().props.onLongPress());
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
  expect(bar().props.canStore).toBe(true);
  expect(bar().props.canUnstore).toBe(false);
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
