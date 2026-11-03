import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView } from "react-native";
import { ItemForm } from "../screens/stackNav/ItemForm";

const mockDispatch = jest.fn();
const mockState = {
  settings: {
    language: 0,
    collectionSortValue: "CUSTOM",
    lastWardrobeId: "" as string | undefined,
  },
  CategoryList: { CategoryCustomTypes: [] },
  itemsList: {
    wardrobes: [
      { id: "home", name: "Home" },
      { id: "work", name: "Work" },
    ],
    collectionTags: [],
    items: [] as any[],
  },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button", Switch: "Switch" }));
jest.mock("react-native-dropdown-picker", () => "Dropdown");
jest.mock("react-native-image-picker", () => ({}));
jest.mock("@somesoap/react-native-image-palette", () => ({}));
jest.mock("react-native-blob-util", () => ({}));
jest.mock("@bam.tech/react-native-image-resizer", () => ({}));
jest.mock("../components/WardrobeSelector", () => ({
  WardrobeSelector: "WardrobeSelector",
  useWardrobeView: () => ({ selected: "home" }),
}));
jest.mock("../components/PageHeader", () => ({ PageHeader: "PageHeader" }));
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
jest.mock("../components/ColorModal", () => "ColorModal");
jest.mock("../components/CustomModal", () => "CustomModal");
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
jest.mock("../components/DatePicker", () => ({ DatePicker: "DatePicker" }));
jest.mock("../components/ImageViewer", () => ({ ImageViewer: "ImageViewer" }));
jest.mock("../screens/stackNav/Category", () => ({
  defaultCategories: [{ index: 0 }],
}));

beforeEach(() => {
  mockDispatch.mockClear();
  navigation.popToTop.mockClear();
  navigation.dispatch.mockClear();
  mockState.itemsList.items = [];
  mockState.settings.lastWardrobeId = "";
});

const navigation = { popToTop: jest.fn(), dispatch: jest.fn() };
// Switch rows expose their Switch element as the ListRow's `right` prop.
const toggleRow = (tree: ReactTestRenderer, title: string, on: boolean) =>
  act(() =>
    tree.root
      .findAll(n => n.props.title === title && n.props.right)[0]
      .props.right.props.onValueChange(on),
  );
function render(editingIndex?: string) {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(
      <ItemForm
        navigation={navigation}
        route={{ params: { selectedCategory: 0, editingIndex } }}
      />,
    );
  });
  return tree!;
}

test("simplified form keeps colors and Save inside a bounded scroll area with usable dropdowns", () => {
  const tree = render();
  const scroll = tree.root.findByType(ScrollView);
  expect(scroll.props.style.flex).toBe(1);
  expect(scroll.props.keyboardShouldPersistTaps).toBe("handled");
  expect(scroll.props.contentContainerStyle.paddingBottom).toBeGreaterThan(0);
  expect(scroll.findAllByType("WardrobeSelector" as any)).toHaveLength(1);
  expect(
    scroll
      .findAllByType("Button" as any)
      .some(b => b.props.children === "Save"),
  ).toBe(true);
  const labels = scroll
    .findAllByType("Dropdown" as any)
    .map(d => d.props.placeholder);
  expect(labels).not.toContain("Fit");
  expect(labels).not.toContain("Season");
  scroll
    .findAllByType("Dropdown" as any)
    .forEach(d => expect(d.props.listMode).toBe("MODAL"));
  // New garments start with automatic colors, and ask for the primary color only
  toggleRow(tree, "Automatic color selection", false);
  expect(
    scroll.findAll(node => node.props.children === "Primary color").length,
  ).toBeGreaterThan(0);
  expect(
    scroll.findAll(node => node.props.children === "Secondary color"),
  ).toHaveLength(0);
});

test("new item saves typed name, chosen type and wardrobe without generated names or fit/season selection", () => {
  const tree = render();
  const name = tree.root
    .findAllByType("CustomInput" as any)
    .find(i => i.props.label === "Name")!;
  act(() => name.props.onChange({ nativeEvent: { text: "My blue shirt" } }));
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Type")!;
  act(() => type.props.setValue(type.props.items[0].value));
  act(() =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Save")!
      .props.onPress(),
  );
  expect(navigation.popToTop).toHaveBeenCalledTimes(1);
  expect(navigation.dispatch).not.toHaveBeenCalled();
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/addItem",
      payload: expect.objectContaining({
        name: "My blue shirt",
        wardrobeId: "home",
        fit: "",
        season: undefined,
      }),
    }),
  );
});

test("long garment names save without a length limit", () => {
  const longName = "Navy wool overcoat with horn buttons from the winter sale";
  const tree = render();
  const name = tree.root
    .findAllByType("CustomInput" as any)
    .find(i => i.props.label === "Name")!;
  act(() => name.props.onChange({ nativeEvent: { text: longName } }));
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Type")!;
  act(() => type.props.setValue(type.props.items[0].value));
  act(() =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Save")!
      .props.onPress(),
  );
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/addItem",
      payload: expect.objectContaining({ name: longName }),
    }),
  );
});

test("editing preserves existing fit and season while keeping Delete reachable in the scroll area", () => {
  mockState.itemsList.items = [
    {
      id: "shirt",
      name: "Shirt",
      type: "T-Shirt",
      fit: "Slim Fit",
      season: "Winter",
      quantity: 1,
      size: 10,
      sizeUnit: "UK",
      image: "photo",
      collection: [],
      wardrobeId: "home",
    },
  ];
  const tree = render("shirt");
  const scroll = tree.root.findByType(ScrollView);
  expect(
    scroll
      .findAllByType("Button" as any)
      .some(b => b.props.children === "Delete"),
  ).toBe(true);
  act(() =>
    scroll
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Save")!
      .props.onPress(),
  );
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/updateItem",
      payload: expect.objectContaining({
        id: "shirt",
        fit: "Slim Fit",
        season: "Winter",
        image: "photo",
      }),
    }),
  );
});

test("garment delete only happens after confirming the dialog", () => {
  mockState.itemsList.items = [
    { id: "a", name: "Coat", collection: [], category: 0 },
  ];
  const tree = render("a");
  const dialog = () => tree.root.findByType("ConfirmationDialog" as any);
  const pressDelete = () =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Delete")!
      .props.onPress();
  expect(dialog().props.visible).toBe(false);
  act(() => pressDelete());
  expect(dialog().props.visible).toBe(true);
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => dialog().props.setVisible(false));
  expect(dialog().props.visible).toBe(false);
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => pressDelete());
  act(() => dialog().props.onConfirm());
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/deleteItem",
      payload: { selectedId: "a" },
    }),
  );
});

const colorRows = (tree: ReactTestRenderer) =>
  ["Primary color", "Secondary color", "Tertiary color"].filter(
    label => tree.root.findAll(n => n.props.children === label).length > 0,
  );
const button = (tree: ReactTestRenderer, label: string) =>
  tree.root
    .findAllByType("Button" as any)
    .find(b => b.props.children === label);

test("secondary and tertiary colors are optional and only added on request", () => {
  const tree = render();
  toggleRow(tree, "Automatic color selection", false);
  expect(colorRows(tree)).toEqual(["Primary color"]);
  // Secondary can only be added once primary is set
  expect(button(tree, "Add secondary color")!.props.disabled).toBe(true);
  const modal = () => tree.root.findByType("ColorModal" as any);
  act(() => modal().props.setColors(["#1F2A44", "", ""]));
  act(() => button(tree, "Add secondary color")!.props.onPress());
  expect(colorRows(tree)).toEqual(["Primary color", "Secondary color"]);
  expect(button(tree, "Add tertiary color")!.props.disabled).toBe(true);
  act(() => modal().props.setColors(["#1F2A44", "#D9C7A7", ""]));
  act(() => button(tree, "Add tertiary color")!.props.onPress());
  expect(colorRows(tree)).toHaveLength(3);
  expect(button(tree, "Add tertiary color")).toBeUndefined();
});

test("editing shows existing colors, and removing secondary moves tertiary up", () => {
  mockState.itemsList.items = [
    {
      id: "coat",
      name: "Coat",
      type: "T-Shirt",
      image: "photo",
      collection: [],
      wardrobeId: "home",
      primaryColor: "#1F2A44",
      secondaryColor: "#D9C7A7",
      tertiaryColor: "#B22222",
    },
  ];
  const tree = render("coat");
  expect(colorRows(tree)).toHaveLength(3);
  expect(tree.root.findByType("ColorModal" as any).props.image).toBe("photo");
  act(() =>
    tree.root
      .findAll(
        n =>
          n.props.accessibilityLabel === "Remove color: Secondary color" &&
          n.props.onPress,
      )[0]
      .props.onPress(),
  );
  expect(colorRows(tree)).toEqual(["Primary color", "Secondary color"]);
  act(() => button(tree, "Save")!.props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/updateItem",
      payload: expect.objectContaining({
        primaryColor: "#1F2A44",
        secondaryColor: "#B22222",
        tertiaryColor: "",
      }),
    }),
  );
});

const input = (tree: ReactTestRenderer, label: string) =>
  tree.root
    .findAllByType("CustomInput" as any)
    .find(i => i.props.label === label)!;
const chooseFirstType = (tree: ReactTestRenderer) => {
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Type")!;
  act(() => type.props.setValue(type.props.items[0].value));
  return type.props.items[0].label as string;
};
const save = (tree: ReactTestRenderer) =>
  act(() => button(tree, "Save")!.props.onPress());
const savedPayload = () =>
  mockDispatch.mock.calls
    .map(([action]) => action)
    .find(action => /itemsList\/(add|update)Item/.test(action.type)).payload;

test("new garments start in the last used wardrobe, with automatic colors and no purchase date", () => {
  mockState.settings.lastWardrobeId = "work";
  const tree = render();
  expect(tree.root.findByType("WardrobeSelector" as any).props.value).toBe(
    "work",
  );
  const rowSwitch = (title: string) =>
    tree.root.findAll(n => n.props.title === title && n.props.right)[0].props
      .right.props.value;
  expect(rowSwitch("Automatic color selection")).toBe(true);
  expect(rowSwitch("Purchase Date")).toBe(false);
  expect(tree.root.findAllByType("DatePicker" as any)).toHaveLength(0);
  chooseFirstType(tree);
  save(tree);
  expect(savedPayload()).toEqual(
    expect.objectContaining({
      wardrobeId: "work",
      purchaseDate: "",
      automaticColor: true,
    }),
  );
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "settings/setLastWardrobe",
      payload: { wardrobeId: "work" },
    }),
  );
});

test("a deleted last wardrobe falls back to the Closet selection", () => {
  mockState.settings.lastWardrobeId = "gone";
  const tree = render();
  expect(tree.root.findByType("WardrobeSelector" as any).props.value).toBe(
    "home",
  );
});

test("the name follows color, brand and type until edited, and is generated on Save when empty", () => {
  const tree = render();
  const typeLabel = chooseFirstType(tree);
  act(() =>
    tree.root
      .findByType("ColorModal" as any)
      .props.setColors(["#1F2A44", "", ""]),
  );
  act(() =>
    input(tree, "Brand").props.onChange({ nativeEvent: { text: "Benetton" } }),
  );
  expect(input(tree, "Name").props.value).toBe(`Navy Benetton ${typeLabel}`);
  act(() =>
    input(tree, "Name").props.onChange({ nativeEvent: { text: "Work coat" } }),
  );
  act(() =>
    input(tree, "Brand").props.onChange({ nativeEvent: { text: "Zara" } }),
  );
  expect(input(tree, "Name").props.value).toBe("Work coat");
  // Clearing the name lets it follow the fields again
  act(() => input(tree, "Name").props.onChange({ nativeEvent: { text: "" } }));
  expect(input(tree, "Name").props.value).toBe(`Navy Zara ${typeLabel}`);
  save(tree);
  expect(savedPayload()).toEqual(
    expect.objectContaining({ name: `Navy Zara ${typeLabel}`, brand: "Zara" }),
  );
});

test("turning the purchase date on saves the chosen date", () => {
  const tree = render();
  chooseFirstType(tree);
  toggleRow(tree, "Purchase Date", true);
  const picker = tree.root.findByType("DatePicker" as any);
  act(() => picker.props.setDate(new Date("2026-10-01T00:00:00.000Z")));
  save(tree);
  expect(savedPayload().purchaseDate).toBe(
    JSON.stringify(new Date("2026-10-01T00:00:00.000Z")),
  );
});

test("editing keeps the name, brand, color setting and purchase date", () => {
  mockState.itemsList.items = [
    {
      id: "coat",
      name: "Old coat",
      brand: "Benetton",
      type: "T-Shirt",
      image: "",
      collection: [],
      wardrobeId: "home",
      automaticColor: false,
      primaryColor: "#B22222",
      purchaseDate: JSON.stringify(new Date("2025-01-02T00:00:00.000Z")),
    },
  ];
  const tree = render("coat");
  expect(input(tree, "Name").props.value).toBe("Old coat");
  expect(input(tree, "Brand").props.value).toBe("Benetton");
  expect(colorRows(tree)).toEqual(["Primary color"]);
  save(tree);
  expect(savedPayload()).toEqual(
    expect.objectContaining({
      name: "Old coat",
      brand: "Benetton",
      automaticColor: false,
      purchaseDate: JSON.stringify(new Date("2025-01-02T00:00:00.000Z")),
    }),
  );
});
