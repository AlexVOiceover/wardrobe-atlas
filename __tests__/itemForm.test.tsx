import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView } from "react-native";
import { ItemForm } from "../screens/stackNav/ItemForm";

const mockDispatch = jest.fn();
const mockState = {
  settings: { language: 0, collectionSortValue: "CUSTOM" },
  CategoryList: { CategoryCustomTypes: [] },
  itemsList: {
    wardrobes: [{ id: "home", name: "Home" }],
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
});

const navigation = { popToTop: jest.fn(), dispatch: jest.fn() };
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
  // New garments ask for the primary color only
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
