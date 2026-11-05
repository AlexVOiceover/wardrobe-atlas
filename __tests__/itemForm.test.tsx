import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ScrollView, StyleSheet } from "react-native";
import { ItemForm } from "../screens/stackNav/ItemForm";
import { PhotoView } from "../components/PhotoView";

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
// The latest arguments of usePreventRemove: whether leaving asks first.
const mockGuard = { prevent: false, onPrevented: (_: any) => {} };
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  usePreventRemove: (prevent: boolean, onPrevented: any) => {
    mockGuard.prevent = prevent;
    mockGuard.onPrevented = onPrevented;
  },
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  Switch: "Switch",
  Snackbar: "Snackbar",
}));
jest.mock("react-native-dropdown-picker", () => "Dropdown");
jest.mock("react-native-image-picker", () => ({}));
jest.mock("@somesoap/react-native-image-palette", () => ({}));
jest.mock("react-native-blob-util", () => ({}));
jest.mock("@bam.tech/react-native-image-resizer", () => ({}));
jest.mock("../components/WardrobeSelector", () => ({
  WardrobeSelector: "WardrobeSelector",
  useWardrobeView: () => ({ selected: "home" }),
}));
jest.mock("../components/PageHeader", () => ({
  PageHeader: "PageHeader",
  HeaderIcon: "HeaderIcon",
}));
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
jest.mock("../components/ColorModal", () => "ColorModal");
jest.mock("../components/CustomModal", () => "CustomModal");
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
jest.mock("../components/OptionalDateField", () => ({
  OptionalDateField: "OptionalDateField",
}));
jest.mock("../components/ImageViewer", () => ({ ImageViewer: "ImageViewer" }));
const mockRemoveBackground = jest.fn();
const mockCutoutColors = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  ...jest.requireActual("../utils/backgroundRemoval"),
  removeBackground: (image: string) => mockRemoveBackground(image),
  cutoutColors: (image: string) => mockCutoutColors(image),
}));
jest.mock("../components/CutoutEditor", () => ({
  CutoutEditor: "CutoutEditor",
}));
const mockGarmentModel = { present: true, download: jest.fn() };
const mockIsolateGarment = jest.fn();
jest.mock("../utils/garmentIsolation", () => ({
  ...jest.requireActual("../utils/garmentIsolation"),
  hasGarmentModel: async () => mockGarmentModel.present,
  downloadGarmentModel: (onProgress: (percent: number) => void) =>
    mockGarmentModel.download(onProgress),
  isolateGarment: (image: string, part: string) =>
    mockIsolateGarment(image, part),
}));

beforeEach(() => {
  mockDispatch.mockClear();
  navigation.popToTop.mockClear();
  navigation.popTo.mockClear();
  navigation.dispatch.mockClear();
  mockState.itemsList.items = [];
  mockState.settings.lastWardrobeId = "";
});

const mockNavigation = {
  popToTop: jest.fn(),
  popTo: jest.fn(),
  dispatch: jest.fn(),
};
const navigation = mockNavigation;
// The outermost element carrying an accessibility label (not its host copies)
const labelled = (tree: ReactTestRenderer, label: string) =>
  tree.root.findAll(
    n =>
      n.props.accessibilityLabel === label &&
      n.parent?.props.accessibilityLabel !== label,
  );
const autoColors = (tree: ReactTestRenderer) =>
  tree.root
    .findAllByType("Switch" as any)
    .find(s => s.props.accessibilityLabel === "Automatic color selection")!;
const setAutoColors = (tree: ReactTestRenderer, on: boolean) =>
  act(() => autoColors(tree).props.onValueChange(on));
// The rendered tree as text, without the header's ✓ element (it links back
// into the tree).
const shown = (tree: ReactTestRenderer) =>
  JSON.stringify(tree.toJSON(), (key, value) =>
    key === "actions" ? undefined : value,
  );
const purchaseDate = (tree: ReactTestRenderer) =>
  tree.root.findByType("OptionalDateField" as any);
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
// Editing from the Closet passes only the garment, like the app does.
function edit(editingIndex: string) {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(
      <ItemForm navigation={navigation} route={{ params: { editingIndex } }} />,
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
  setAutoColors(tree, false);
  expect(labelled(tree, "Primary color")).toHaveLength(1);
  expect(labelled(tree, "Secondary color")).toHaveLength(0);
});

test("new item saves typed name, chosen type and wardrobe without generated names or fit selection, with all seasons", () => {
  const tree = render();
  const name = tree.root
    .findAllByType("CustomInput" as any)
    .find(i => i.props.label === "Name")!;
  act(() => name.props.onChange({ nativeEvent: { text: "My blue shirt" } }));
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Subcategory *")!;
  act(() => type.props.setValue(type.props.items[0].value));
  act(() =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Save")!
      .props.onPress(),
  );
  // Back to the Closet, which says where the garment went
  expect(navigation.popTo).toHaveBeenCalledWith("StackNavHome", {
    screen: "Closet",
    params: { saved: "Saved to Home" },
  });
  expect(navigation.popToTop).not.toHaveBeenCalled();
  expect(navigation.dispatch).not.toHaveBeenCalled();
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/addItem",
      payload: expect.objectContaining({
        name: "My blue shirt",
        wardrobeId: "home",
        fit: "",
        seasons: ["Spring", "Summer", "Fall", "Winter"],
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
    .find(d => d.props.placeholder === "Subcategory *")!;
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

test("editing preserves existing fit and seasons while keeping Delete reachable in the scroll area", () => {
  mockState.itemsList.items = [
    {
      id: "shirt",
      name: "Shirt",
      type: "T-Shirt",
      fit: "Slim Fit",
      seasons: ["Winter"],
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
        seasons: ["Winter"],
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
  const dialog = () =>
    tree.root
      .findAllByType("ConfirmationDialog" as any)
      .find(d => !d.props.title)!;
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
    label => labelled(tree, label).length > 0,
  );
const addColor = (tree: ReactTestRenderer, label: string) =>
  labelled(tree, label)[0];
const button = (tree: ReactTestRenderer, label: string) =>
  tree.root
    .findAllByType("Button" as any)
    .find(b => b.props.children === label);
// The icon button on the photo's corner, found by what it does.
const photoAction = (tree: ReactTestRenderer, label: string) =>
  tree.root
    .findAll(n => n.props.accessibilityLabel === label && !!n.props.onPress)
    .at(0);

test("secondary and tertiary colors are optional and only added on request", () => {
  const tree = render();
  setAutoColors(tree, false);
  expect(colorRows(tree)).toEqual(["Primary color"]);
  // Secondary can only be added once primary is set
  expect(addColor(tree, "Add secondary color")!.props.disabled).toBe(true);
  const modal = () => tree.root.findByType("ColorModal" as any);
  act(() => modal().props.setColors(["#1F2A44", "", ""]));
  act(() => addColor(tree, "Add secondary color")!.props.onPress());
  expect(colorRows(tree)).toEqual(["Primary color", "Secondary color"]);
  expect(addColor(tree, "Add tertiary color")!.props.disabled).toBe(true);
  act(() => modal().props.setColors(["#1F2A44", "#D9C7A7", ""]));
  act(() => addColor(tree, "Add tertiary color")!.props.onPress());
  expect(colorRows(tree)).toHaveLength(3);
  expect(addColor(tree, "Add tertiary color")).toBeUndefined();
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
    .find(d => d.props.placeholder === "Subcategory *")!;
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
  expect(autoColors(tree).props.value).toBe(true);
  expect(purchaseDate(tree).props.date).toBeUndefined();
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

test("picking a purchase date saves it, and clearing it saves none", () => {
  const tree = render();
  chooseFirstType(tree);
  const picked = new Date("2026-10-01T00:00:00.000Z");
  act(() => purchaseDate(tree).props.onChange(picked));
  expect(purchaseDate(tree).props.date).toEqual(picked);
  save(tree);
  expect(savedPayload().purchaseDate).toBe(JSON.stringify(picked));
  mockDispatch.mockClear();
  act(() => purchaseDate(tree).props.onChange(undefined));
  expect(purchaseDate(tree).props.date).toBeUndefined();
  save(tree);
  expect(savedPayload().purchaseDate).toBe("");
});

test("tapping a swatch opens the sheet with automatic colors still on; confirming a color turns them off", () => {
  const tree = render();
  const caption = () => shown(tree).includes("From the photo");
  expect(autoColors(tree).props.value).toBe(true);
  expect(caption()).toBe(true);
  expect(tree.root.findByType("ColorModal" as any).props.visible).toBe(false);
  act(() => labelled(tree, "Primary color")[0].props.onPress());
  const modal = () => tree.root.findByType("ColorModal" as any);
  expect(modal().props.visible).toBe(true);
  expect(modal().props.colorSelection).toBe(0);
  expect(autoColors(tree).props.value).toBe(true);
  // Closing without a color keeps them automatic
  act(() => modal().props.setVisible(false));
  expect(autoColors(tree).props.value).toBe(true);
  act(() => modal().props.setColors(["#1F2A44", "", ""]));
  expect(autoColors(tree).props.value).toBe(false);
  expect(caption()).toBe(false);
});

test("with automatic colors on, + adds a color by hand and turns them off", () => {
  const tree = render();
  act(() =>
    tree.root
      .findByType("ColorModal" as any)
      .props.setColors(["#1F2A44", "", ""]),
  );
  setAutoColors(tree, true);
  expect(addColor(tree, "Add secondary color")!.props.disabled).toBe(false);
  act(() => addColor(tree, "Add secondary color")!.props.onPress());
  expect(autoColors(tree).props.value).toBe(false);
  expect(colorRows(tree)).toEqual(["Primary color", "Secondary color"]);
  // The remove × is 24dp with a 12dp hitSlop
  const remove = tree.root.findAll(
    n =>
      n.props.accessibilityLabel === "Remove color: Secondary color" &&
      !!n.props.onPress,
  )[0];
  expect(remove.props.hitSlop).toBe(12);
  expect(remove.props.style).toMatchObject({ width: 24, height: 24 });
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

test("the category picker moves a garment and clears its type; no collection hint", () => {
  mockState.itemsList.items = [
    { id: "shirt", name: "Shirt", type: "Shirt", category: 0, collection: [] },
  ];
  const tree = render("shirt");
  const dropdown = (placeholder: string) =>
    tree.root
      .findAllByType("Dropdown" as any)
      .find(d => d.props.placeholder === placeholder)!;
  expect(dropdown("Category").props.value).toBe(0);
  expect(dropdown("Category").props.items.map((i: any) => i.label)).toEqual([
    "Tops",
    "Bottoms",
    "Shoes",
    "Accessories",
  ]);
  act(() => dropdown("Category").props.setValue(() => 2));
  expect(dropdown("Category").props.value).toBe(2);
  expect(dropdown("Subcategory *").props.value).toBe("");
  act(() => dropdown("Subcategory *").props.setValue("Sneakers"));
  act(() =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === "Save")!
      .props.onPress(),
  );
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/updateItem",
      payload: expect.objectContaining({ category: 2, type: "Sneakers" }),
    }),
  );
  expect(shown(tree)).not.toContain("under a collection");
});

test("season chips start all on and save only the chosen seasons", () => {
  const tree = render();
  const chip = (label: string) =>
    tree.root.find(
      n => n.props.accessibilityLabel === label && !!n.props.onPress,
    );
  ["Spring", "Summer", "Fall", "Winter"].forEach(label =>
    expect(chip(label).props.accessibilityState.selected).toBe(true),
  );
  act(() => chip("Summer").props.onPress());
  act(() => chip("Spring").props.onPress());
  act(() => chip("Spring").props.onPress());
  expect(chip("Summer").props.accessibilityState.selected).toBe(false);
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Subcategory *")!;
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
      payload: expect.objectContaining({
        seasons: ["Spring", "Fall", "Winter"],
      }),
    }),
  );
});

test("In storage starts off for new garments and is saved when switched on", () => {
  const tree = render();
  // A chip beside the wardrobe
  const storage = () =>
    tree.root.find(
      n => n.props.accessibilityLabel === "In storage" && !!n.props.onPress,
    );
  expect(storage().props.accessibilityState.selected).toBe(false);
  act(() => storage().props.onPress());
  expect(storage().props.accessibilityState.selected).toBe(true);
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Subcategory *")!;
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
      payload: expect.objectContaining({ stored: true }),
    }),
  );
});

test("Remove background replaces a shoe photo, Undo brings it back, and Save stores the cutout", async () => {
  mockState.itemsList.items = [
    {
      id: "shoe",
      name: "Shoe",
      type: "Sneakers",
      category: 2,
      image: "/9j/photo",
      collection: [],
    },
    {
      id: "cut",
      name: "Cut",
      type: "Sneakers",
      category: 2,
      image: "UklGRcut",
      collection: [],
    },
  ];
  const photo = (tree: ReactTestRenderer) =>
    tree.root.findByType("ImageViewer" as any).props.imageUrl;
  // Already cut out: no button
  expect(photoAction(edit("cut"), "Remove background")).toBeUndefined();
  const tree = edit("shoe");
  mockRemoveBackground.mockResolvedValueOnce({ error: "noSubject" });
  await act(async () =>
    photoAction(tree, "Remove background")!.props.onPress(),
  );
  expect(photo(tree)).toBe("/9j/photo");
  expect(shown(tree)).toContain("No garment found");
  mockRemoveBackground.mockResolvedValueOnce({ image: "UklGRnew" });
  await act(async () =>
    photoAction(tree, "Remove background")!.props.onPress(),
  );
  expect(mockRemoveBackground).toHaveBeenLastCalledWith("/9j/photo");
  expect(mockIsolateGarment).not.toHaveBeenCalled();
  expect(photo(tree)).toBe("UklGRnew");
  act(() => photoAction(tree, "Undo")!.props.onPress());
  expect(photo(tree)).toBe("/9j/photo");
  mockRemoveBackground.mockResolvedValueOnce({ image: "UklGRnew" });
  await act(async () =>
    photoAction(tree, "Remove background")!.props.onPress(),
  );
  act(() => button(tree, "Save")!.props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/updateItem",
      payload: expect.objectContaining({ id: "shoe", image: "UklGRnew" }),
    }),
  );
});

describe("Keep only the garment", () => {
  const items = () => [
    {
      id: "fleece",
      name: "Fleece",
      type: "Sweater",
      category: 0,
      image: "/9j/photo",
      collection: [],
    },
    // An earlier cutout that still shows the person
    {
      id: "jeans",
      name: "Jeans",
      type: "Jeans",
      category: 1,
      image: "UklGRold",
      collection: [],
    },
  ];
  const modelDialog = (tree: ReactTestRenderer) =>
    tree.root
      .findAllByType("ConfirmationDialog" as any)
      .find(d => d.props.title === "Download the garment model?")!;
  beforeEach(() => {
    mockRemoveBackground.mockClear();
    mockIsolateGarment.mockReset();
    mockGarmentModel.present = true;
    mockGarmentModel.download.mockReset();
  });

  test("tops keep the upper garment, and earlier cutouts of bottoms can be redone", async () => {
    mockState.itemsList.items = items();
    let tree = edit("fleece");
    expect(photoAction(tree, "Remove background")).toBeUndefined();
    mockIsolateGarment.mockResolvedValueOnce({ image: "UklGRtop" });
    await act(async () =>
      photoAction(tree, "Keep only the garment")!.props.onPress(),
    );
    expect(mockIsolateGarment).toHaveBeenLastCalledWith("/9j/photo", "upper");
    expect(mockRemoveBackground).not.toHaveBeenCalled();
    expect(tree.root.findByType("ImageViewer" as any).props.imageUrl).toBe(
      "UklGRtop",
    );
    tree = edit("jeans");
    mockIsolateGarment.mockResolvedValueOnce({ error: "noSubject" });
    await act(async () =>
      photoAction(tree, "Keep only the garment")!.props.onPress(),
    );
    expect(mockIsolateGarment).toHaveBeenLastCalledWith("UklGRold", "lower");
    expect(shown(tree)).toContain("No garment found");
  });

  test("asks before downloading the model, shows progress, then isolates", async () => {
    mockState.itemsList.items = items();
    mockGarmentModel.present = false;
    const tree = edit("fleece");
    await act(async () =>
      photoAction(tree, "Keep only the garment")!.props.onPress(),
    );
    expect(modelDialog(tree).props.visible).toBe(true);
    expect(modelDialog(tree).props.message).toContain("176 MB");
    expect(mockGarmentModel.download).not.toHaveBeenCalled();
    let finish!: (ok: boolean) => void;
    mockGarmentModel.download.mockImplementation(
      (onProgress: (percent: number) => void) =>
        new Promise(resolve => {
          onProgress(42);
          finish = resolve;
        }),
    );
    await act(async () => {
      modelDialog(tree).props.onConfirm();
    });
    expect(
      photoAction(tree, "Downloading the garment model… 42%")!.props.disabled,
    ).toBe(true);
    mockGarmentModel.present = true;
    mockIsolateGarment.mockResolvedValueOnce({ image: "UklGRtop" });
    await act(async () => finish(true));
    expect(mockIsolateGarment).toHaveBeenCalledWith("/9j/photo", "upper");
    expect(photoAction(tree, "Undo")).toBeDefined();
  });

  test("a failed download says so and changes nothing", async () => {
    mockState.itemsList.items = items();
    mockGarmentModel.present = false;
    mockGarmentModel.download.mockResolvedValueOnce(false);
    const tree = edit("fleece");
    await act(async () =>
      photoAction(tree, "Keep only the garment")!.props.onPress(),
    );
    await act(async () => modelDialog(tree).props.onConfirm());
    expect(shown(tree)).toContain("Couldn't download the garment model");
    expect(mockIsolateGarment).not.toHaveBeenCalled();
    expect(tree.root.findByType("ImageViewer" as any).props.imageUrl).toBe(
      "/9j/photo",
    );
  });
});

test("styles follow the subcategory until a chip is tapped; editing keeps saved styles", () => {
  const chip = (tree: ReactTestRenderer, label: string) =>
    tree.root.find(
      n => n.props.accessibilityLabel === label && !!n.props.onPress,
    );
  const selected = (tree: ReactTestRenderer) =>
    ["Casual", "Sporty", "Elegant", "Formal"].filter(
      label => chip(tree, label).props.accessibilityState.selected,
    );
  const tree = render();
  const type = () =>
    tree.root
      .findAllByType("Dropdown" as any)
      .find(d => d.props.placeholder === "Subcategory *")!;
  act(() => type().props.setValue("Blazer"));
  expect(selected(tree)).toEqual(["Elegant", "Formal"]);
  act(() => type().props.setValue("Hoodie"));
  expect(selected(tree)).toEqual(["Casual", "Sporty"]);
  act(() => chip(tree, "Elegant").props.onPress());
  act(() => type().props.setValue("Blazer"));
  expect(selected(tree)).toEqual(["Casual", "Sporty", "Elegant"]);
  act(() => button(tree, "Save")!.props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/addItem",
      payload: expect.objectContaining({
        styles: ["casual", "sporty", "elegant"],
      }),
    }),
  );
  mockState.itemsList.items = [
    {
      id: "s",
      name: "S",
      type: "Blazer",
      category: 0,
      styles: ["sporty"],
      collection: [],
    },
  ];
  expect(selected(render("s"))).toEqual(["Sporty"]);
});

describe("Fix the cut-out", () => {
  const items = () => [
    {
      id: "trousers",
      name: "Trousers",
      type: "Trousers",
      category: 1,
      image: "/9j/photo",
      automaticColor: true,
      collection: [],
    },
  ];
  const editor = (tree: ReactTestRenderer) =>
    tree.root.findAllByType("CutoutEditor" as any)[0];
  const photo = (tree: ReactTestRenderer) =>
    tree.root.findByType("ImageViewer" as any).props.imageUrl;
  const primary = (tree: ReactTestRenderer) =>
    tree.root.findByType("ColorModal" as any).props.colors[0];
  beforeEach(() => {
    mockIsolateGarment.mockReset();
    mockCutoutColors.mockReset();
    mockGarmentModel.present = true;
  });

  test("only cutouts can be fixed by hand, with the original for Restore", async () => {
    mockState.itemsList.items = items();
    const tree = edit("trousers");
    expect(photoAction(tree, "Fix the cut-out")).toBeUndefined();
    // A photo fills its frame; a cut-out is shown whole.
    expect(tree.root.findByType("ImageViewer" as any).props.fit).toBe("cover");
    expect(editor(tree)).toBeUndefined();
    mockIsolateGarment.mockResolvedValueOnce({ image: "UklGRcut" });
    mockCutoutColors.mockResolvedValue(["#C8B49A"]);
    await act(async () =>
      photoAction(tree, "Keep only the garment")!.props.onPress(),
    );
    // Automatic colors come from the garment, not the old background.
    expect(mockCutoutColors).toHaveBeenLastCalledWith("UklGRcut");
    expect(primary(tree)).toBe("#C8B49A");
    expect(tree.root.findByType("ImageViewer" as any).props.fit).toBe(
      "contain",
    );
    act(() => photoAction(tree, "Fix the cut-out")!.props.onPress());
    expect(editor(tree).props).toMatchObject({
      visible: true,
      image: "UklGRcut",
      original: "/9j/photo",
    });
    mockCutoutColors.mockResolvedValue(["#B9A27F"]);
    await act(async () => editor(tree).props.onDone("UklGRfixed"));
    expect(editor(tree).props.visible).toBe(false);
    expect(photo(tree)).toBe("UklGRfixed");
    expect(primary(tree)).toBe("#B9A27F");
    act(() => button(tree, "Save")!.props.onPress());
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "itemsList/updateItem",
        payload: expect.objectContaining({ image: "UklGRfixed" }),
      }),
    );
  });

  test("a saved cutout can still be erased, but has no original to restore", () => {
    mockState.itemsList.items = [{ ...items()[0], image: "UklGRsaved" }];
    const tree = edit("trousers");
    act(() => photoAction(tree, "Fix the cut-out")!.props.onPress());
    expect(editor(tree).props.original).toBeUndefined();
  });
});

describe("the photo", () => {
  const items = () => [
    {
      id: "shoe",
      name: "Shoe",
      type: "Sneakers",
      category: 2,
      image: "/9j/photo",
      collection: [],
    },
  ];
  const viewer = (tree: ReactTestRenderer) =>
    tree.root.findByType("ImageViewer" as any);
  const view = (tree: ReactTestRenderer) => tree.root.findByType(PhotoView);
  const sourceDialog = (tree: ReactTestRenderer) =>
    tree.root
      .findAllByType("CustomModal" as any)
      .find(m => m.props.label === "Import image")!;
  const viewButtons = (tree: ReactTestRenderer) =>
    view(tree)
      .findAllByType("Button" as any)
      .map(b => b.props.children);
  const pressInView = (tree: ReactTestRenderer, label: string) =>
    view(tree)
      .findAllByType("Button" as any)
      .find(b => b.props.children === label)!
      .props.onPress();
  beforeEach(() => {
    mockRemoveBackground.mockReset();
    mockCutoutColors.mockReset();
  });

  test("without a photo, a tap goes straight to camera or gallery, with nothing to reset", () => {
    const tree = render();
    expect(viewer(tree).props.imageUrl).toBe("");
    act(() => viewer(tree).props.onPress());
    expect(sourceDialog(tree).props.visible).toBe(true);
    expect(view(tree).props.visible).toBe(false);
    expect(
      sourceDialog(tree)
        .findAllByType("Button" as any)
        .map(b => b.props.children),
    ).toEqual(["Use camera", "Import from device"]);
  });

  test("a tap shows the photo with labelled actions, and Change photo opens the source choice", () => {
    mockState.itemsList.items = items();
    const tree = edit("shoe");
    act(() => viewer(tree).props.onPress());
    expect(view(tree).props.visible).toBe(true);
    expect(sourceDialog(tree).props.visible).toBe(false);
    expect(viewButtons(tree)).toEqual([
      "Change photo",
      "Remove background",
      "Remove photo",
    ]);
    act(() => pressInView(tree, "Change photo"));
    expect(view(tree).props.visible).toBe(false);
    expect(sourceDialog(tree).props.visible).toBe(true);
  });

  test("the view removes the background, offers Undo and Fix, and Fix opens the editor", async () => {
    mockState.itemsList.items = items();
    const tree = edit("shoe");
    act(() => viewer(tree).props.onPress());
    mockRemoveBackground.mockResolvedValueOnce({ image: "UklGRnew" });
    await act(async () => pressInView(tree, "Remove background"));
    expect(viewer(tree).props.imageUrl).toBe("UklGRnew");
    expect(view(tree).props.visible).toBe(true);
    expect(viewButtons(tree)).toEqual([
      "Change photo",
      "Undo",
      "Fix the cut-out",
      "Remove photo",
    ]);
    // Under the photo too, with its own Undo
    expect(shown(tree)).toContain("Background removed");
    act(() => pressInView(tree, "Fix the cut-out"));
    expect(view(tree).props.visible).toBe(false);
    expect(tree.root.findByType("CutoutEditor" as any).props.visible).toBe(
      true,
    );
    act(() => button(tree, "Undo")!.props.onPress());
    expect(viewer(tree).props.imageUrl).toBe("/9j/photo");
    expect(shown(tree)).not.toContain("Background removed");
  });

  test("a cut-out error shows in red, in the view and under the photo", async () => {
    mockState.itemsList.items = items();
    const tree = edit("shoe");
    act(() => viewer(tree).props.onPress());
    mockRemoveBackground.mockResolvedValueOnce({ error: "noSubject" });
    await act(async () => pressInView(tree, "Remove background"));
    expect(view(tree).props.message).toBe("No garment found in this photo.");
    const errors = tree.root.findAll(
      n =>
        n.props.children === "No garment found in this photo." &&
        n.props.customStyle?.color === "#b3261e",
    );
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  test("Remove photo clears the photo and its original, and closes the view", async () => {
    mockState.itemsList.items = items();
    const tree = edit("shoe");
    act(() => viewer(tree).props.onPress());
    mockRemoveBackground.mockResolvedValueOnce({ image: "UklGRnew" });
    await act(async () => pressInView(tree, "Remove background"));
    act(() => pressInView(tree, "Remove photo"));
    expect(viewer(tree).props.imageUrl).toBe("");
    expect(view(tree).props.visible).toBe(false);
    // No Undo back to the old photo
    expect(photoAction(tree, "Undo")).toBeUndefined();
    expect(button(tree, "Undo")).toBeUndefined();
    act(() => button(tree, "Save")!.props.onPress());
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "itemsList/updateItem",
        payload: expect.objectContaining({ id: "shoe", image: "" }),
      }),
    );
  });
});

describe("leaving a changed form", () => {
  const discard = (tree: ReactTestRenderer) =>
    tree.root
      .findAllByType("ConfirmationDialog" as any)
      .find(d => d.props.title === "Discard changes?")!;
  const press = (tree: ReactTestRenderer, text: string) =>
    act(() =>
      tree.root
        .findAllByType("Button" as any)
        .find(b => b.props.children === text)!
        .props.onPress(),
    );

  test("an untouched new garment leaves without asking, even with automatic name and colors", () => {
    const tree = render();
    expect(mockGuard.prevent).toBe(false);
    setAutoColors(tree, false);
    setAutoColors(tree, true);
    expect(mockGuard.prevent).toBe(false);
    expect(discard(tree).props.visible).toBe(false);
  });

  test("a typed field asks; Keep editing stays, Discard leaves", () => {
    const tree = render();
    act(() =>
      input(tree, "Brand").props.onChange({ nativeEvent: { text: "Uniqlo" } }),
    );
    expect(mockGuard.prevent).toBe(true);
    const action = { type: "GO_BACK" };
    act(() => mockGuard.onPrevented({ data: { action } }));
    expect(discard(tree).props.visible).toBe(true);
    expect(discard(tree).props.confirmLabel).toBe("Discard");
    expect(discard(tree).props.cancelLabel).toBe("Keep editing");
    act(() => discard(tree).props.setVisible(false));
    expect(discard(tree).props.visible).toBe(false);
    expect(navigation.dispatch).not.toHaveBeenCalled();
    act(() => mockGuard.onPrevented({ data: { action } }));
    act(() => discard(tree).props.onConfirm());
    expect(mockGuard.prevent).toBe(false);
    expect(navigation.dispatch).toHaveBeenCalledWith(action);
  });

  test("clearing a typed field again leaves without asking", () => {
    const tree = render();
    act(() =>
      input(tree, "Brand").props.onChange({ nativeEvent: { text: "U" } }),
    );
    act(() =>
      input(tree, "Brand").props.onChange({ nativeEvent: { text: "" } }),
    );
    expect(mockGuard.prevent).toBe(false);
  });

  test("Save and Delete leave without asking", () => {
    const tree = render();
    act(() =>
      input(tree, "Name").props.onChange({ nativeEvent: { text: "Coat" } }),
    );
    const type = tree.root
      .findAllByType("Dropdown" as any)
      .find(d => d.props.placeholder === "Subcategory *")!;
    act(() => type.props.setValue(type.props.items[0].value));
    expect(mockGuard.prevent).toBe(true);
    press(tree, "Save");
    // The guard is off before the screen closes.
    expect(mockGuard.prevent).toBe(false);
    expect(navigation.popTo).toHaveBeenCalledTimes(1);
    act(() => tree.unmount());

    mockState.itemsList.items = [
      { id: "a", name: "Coat", collection: [], category: 0 },
    ];
    const editing = render("a");
    expect(mockGuard.prevent).toBe(false);
    act(() =>
      input(editing, "Brand").props.onChange({ nativeEvent: { text: "Zara" } }),
    );
    expect(mockGuard.prevent).toBe(true);
    act(() =>
      editing.root
        .findAllByType("ConfirmationDialog" as any)
        .find(d => !d.props.title)!
        .props.onConfirm(),
    );
    expect(mockGuard.prevent).toBe(false);
    expect(navigation.popToTop).toHaveBeenCalledTimes(1);
  });
});

describe("Batch D: garment form", () => {
  afterEach(() => {
    mockState.settings.language = 0;
  });
  const dropdown = (tree: ReactTestRenderer, placeholder: string) =>
    tree.root
      .findAllByType("Dropdown" as any)
      .find(d => d.props.placeholder === placeholder)!;

  test("fields are ordered by use, with Category, Subcategory and Brand beside the photo", () => {
    const tree = render();
    const order = tree.root
      .findAll(
        n =>
          ["Dropdown", "CustomInput", "OptionalDateField"].includes(
            n.type as any,
          ) ||
          n.type === ("WardrobeSelector" as any) ||
          (n.props.accessibilityLabel === "Automatic color selection" &&
            n.type === ("Switch" as any)) ||
          (typeof n.props.children === "string" &&
            ["Seasons", "Styles", "Details"].includes(n.props.children) &&
            typeof n.type !== "string"),
      )
      .map(n =>
        n.type === ("WardrobeSelector" as any)
          ? "Wardrobe"
          : n.type === ("Switch" as any)
          ? "Colors"
          : n.props.placeholder ?? n.props.label ?? n.props.children,
      )
      .filter((label, index, all) => all.indexOf(label) === index);
    expect(order).toEqual([
      "Category",
      "Subcategory *",
      "Brand",
      "Colors",
      "Name",
      "Seasons",
      "Styles",
      "Details",
      "Wardrobe",
      "Size",
      "Unit",
      "Collection",
      "Purchase date",
      "Quantity",
    ]);
    // Beside the photo: the same row as the image
    let row = tree.root.findByType("ImageViewer" as any).parent!;
    while (row.findAllByType("Dropdown" as any).length === 0) row = row.parent!;
    expect(
      row.findAllByType("Dropdown" as any).map(d => d.props.placeholder),
    ).toEqual(["Category", "Subcategory *"]);
    expect(
      row.findAllByType("CustomInput" as any).map(i => i.props.label),
    ).toEqual(["Brand"]);
    // Pickers beside the photo open as modals
    row
      .findAllByType("Dropdown" as any)
      .forEach(d => expect(d.props.listMode).toBe("MODAL"));
  });

  test("titles name the garment, and the header ✓ saves like the bottom Save", () => {
    const tree = render();
    const header = tree.root.findByType("PageHeader" as any);
    expect(header.props.title).toBe("New garment");
    expect(header.props.actions.props).toMatchObject({
      name: "checkmark",
      label: "Save",
    });
    chooseFirstType(tree);
    act(() => header.props.actions.props.onPress());
    expect(savedPayload()).toBeDefined();
    expect(navigation.popTo).toHaveBeenCalledTimes(1);
    mockState.itemsList.items = [
      { id: "a", name: "Coat", type: "T-Shirt", collection: [], category: 0 },
    ];
    expect(render("a").root.findByType("PageHeader" as any).props.title).toBe(
      "Edit garment",
    );
  });

  test("Save without a subcategory marks the picker red with the message under it", () => {
    const tree = render();
    save(tree);
    expect(mockDispatch).not.toHaveBeenCalled();
    const picker = dropdown(tree, "Subcategory *");
    expect(StyleSheet.flatten(picker.props.style).borderColor).toBe("#b3261e");
    // The message sits right under the picker
    const under = picker.parent!.findAll(
      n =>
        n.props.children === "Please choose a subcategory" &&
        typeof n.type !== "string",
    );
    expect(under.length).toBeGreaterThan(0);
    chooseFirstType(tree);
    expect(
      StyleSheet.flatten(dropdown(tree, "Subcategory *").props.style)
        .borderColor,
    ).not.toBe("#b3261e");
    expect(shown(tree)).not.toContain("Please choose a subcategory");
  });

  test("the name shows its automatic rule until typed over", () => {
    const tree = render();
    expect(shown(tree)).toContain("Automatic: color + brand + subcategory");
    act(() =>
      input(tree, "Name").props.onChange({ nativeEvent: { text: "Coat" } }),
    );
    expect(shown(tree)).not.toContain("Automatic: color");
  });

  test("an emptied quantity shows empty and saves as 1; a typed one is kept", () => {
    const tree = render();
    expect(input(tree, "Quantity").props.value).toBe("1");
    act(() =>
      input(tree, "Quantity").props.onChange({ nativeEvent: { text: "" } }),
    );
    expect(input(tree, "Quantity").props.value).toBe("");
    chooseFirstType(tree);
    save(tree);
    expect(savedPayload().quantity).toBe(1);
    mockDispatch.mockClear();
    act(() =>
      input(tree, "Quantity").props.onChange({ nativeEvent: { text: "3" } }),
    );
    save(tree);
    expect(savedPayload().quantity).toBe(3);
  });

  test("an old garment without a quantity saves it unchanged", () => {
    mockState.itemsList.items = [
      { id: "old", name: "Old", type: "T-Shirt", collection: [], category: 0 },
    ];
    const tree = edit("old");
    expect(input(tree, "Quantity").props.value).toBe("");
    expect(input(tree, "Size").props.value).toBe("");
    save(tree);
    expect(savedPayload().quantity).toBeUndefined();
  });

  test("automatic colors fill every color read from the photo", async () => {
    mockCutoutColors.mockReset();
    mockState.itemsList.items = [
      {
        id: "cut",
        name: "Cut",
        type: "Sneakers",
        category: 2,
        image: "UklGRcut",
        automaticColor: false,
        primaryColor: "#000000",
        collection: [],
      },
    ];
    const tree = edit("cut");
    expect(colorRows(tree)).toEqual(["Primary color"]);
    mockCutoutColors.mockResolvedValueOnce(["#111111", "#222222", "#333333"]);
    await act(async () => autoColors(tree).props.onValueChange(true));
    expect(colorRows(tree)).toHaveLength(3);
    expect(tree.root.findByType("ColorModal" as any).props.colors).toEqual([
      "#111111",
      "#222222",
      "#333333",
    ]);
    // × stays available with automatic colors on
    expect(
      labelled(tree, "Remove color: Tertiary color").length,
    ).toBeGreaterThan(0);
  });

  test("Save & add next saves, keeps where it goes, and starts an empty garment without asking", () => {
    mockState.settings.lastWardrobeId = "work";
    const tree = render();
    act(() =>
      input(tree, "Brand").props.onChange({ nativeEvent: { text: "Zara" } }),
    );
    act(() =>
      input(tree, "Size").props.onChange({ nativeEvent: { text: "M" } }),
    );
    const typeLabel = chooseFirstType(tree);
    const chip = (label: string) =>
      tree.root.find(
        n => n.props.accessibilityLabel === label && !!n.props.onPress,
      );
    act(() => chip("Summer").props.onPress());
    act(() => chip("In storage").props.onPress());
    act(() => button(tree, "Save & add next")!.props.onPress());
    expect(savedPayload()).toEqual(
      expect.objectContaining({
        brand: "Zara",
        name: `Zara ${typeLabel}`,
        wardrobeId: "work",
        stored: true,
        size: "M",
      }),
    );
    // It stays on the form
    expect(navigation.popTo).not.toHaveBeenCalled();
    expect(navigation.popToTop).not.toHaveBeenCalled();
    expect(mockGuard.prevent).toBe(false);
    // Emptied: brand, subcategory, name, size and photo
    expect(input(tree, "Brand").props.value).toBe("");
    expect(input(tree, "Size").props.value).toBe("");
    expect(input(tree, "Name").props.value).toBe("");
    expect(dropdown(tree, "Subcategory *").props.value).toBe("");
    expect(tree.root.findByType("ImageViewer" as any).props.imageUrl).toBe("");
    // Kept: category, wardrobe, storage, seasons
    expect(dropdown(tree, "Category").props.value).toBe(0);
    expect(tree.root.findByType("WardrobeSelector" as any).props.value).toBe(
      "work",
    );
    expect(chip("In storage").props.accessibilityState.selected).toBe(true);
    expect(chip("Summer").props.accessibilityState.selected).toBe(false);
    // Says where it went and asks for the next photo
    expect(tree.root.findByType("Snackbar" as any).props.visible).toBe(true);
    expect(tree.root.findByType("Snackbar" as any).props.children).toBe(
      "Saved to Work",
    );
    expect(
      tree.root
        .findAllByType("CustomModal" as any)
        .find(m => m.props.label === "Import image")!.props.visible,
    ).toBe(true);
    // A change after that asks again
    act(() =>
      input(tree, "Brand").props.onChange({ nativeEvent: { text: "H" } }),
    );
    expect(mockGuard.prevent).toBe(true);
  });

  test("Save & add next is only for new garments", () => {
    mockState.itemsList.items = [
      { id: "a", name: "Coat", type: "T-Shirt", collection: [], category: 0 },
    ];
    expect(button(render("a"), "Save & add next")).toBeUndefined();
  });

  test("a new garment without a wardrobe says Saved", () => {
    const tree = render();
    act(() =>
      tree.root.findByType("WardrobeSelector" as any).props.onChange(""),
    );
    chooseFirstType(tree);
    save(tree);
    expect(navigation.popTo).toHaveBeenCalledWith("StackNavHome", {
      screen: "Closet",
      params: { saved: "Saved" },
    });
  });

  test("Spanish labels", () => {
    mockState.settings.language = 1;
    const tree = render();
    expect(tree.root.findByType("PageHeader" as any).props.title).toBe(
      "Nueva prenda",
    );
    expect(input(tree, "Talla")).toBeDefined();
    expect(dropdown(tree, "Subcategoría *")).toBeDefined();
    expect(button(tree, "Guardar y añadir otra")).toBeDefined();
    expect(shown(tree)).toContain("Detalles");
    expect(shown(tree)).toContain("De la foto");
    expect(shown(tree)).toContain("Automático: color + marca + subcategoría");
  });
});
