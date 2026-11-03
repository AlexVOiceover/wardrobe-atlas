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
jest.mock("../components/OptionalDateField", () => ({
  OptionalDateField: "OptionalDateField",
}));
jest.mock("../components/ImageViewer", () => ({ ImageViewer: "ImageViewer" }));
const mockRemoveBackground = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  ...jest.requireActual("../utils/backgroundRemoval"),
  removeBackground: (image: string) => mockRemoveBackground(image),
}));

beforeEach(() => {
  mockDispatch.mockClear();
  navigation.popToTop.mockClear();
  navigation.dispatch.mockClear();
  mockState.itemsList.items = [];
  mockState.settings.lastWardrobeId = "";
});

const navigation = { popToTop: jest.fn(), dispatch: jest.fn() };
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
    .find(d => d.props.placeholder === "Subcategory")!;
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
    .find(d => d.props.placeholder === "Subcategory")!;
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
    label => labelled(tree, label).length > 0,
  );
const addColor = (tree: ReactTestRenderer, label: string) =>
  labelled(tree, label)[0];
const button = (tree: ReactTestRenderer, label: string) =>
  tree.root
    .findAllByType("Button" as any)
    .find(b => b.props.children === label);

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
    .find(d => d.props.placeholder === "Subcategory")!;
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

test("tapping a color swatch with automatic colors on switches to manual and opens the sheet", () => {
  const tree = render();
  expect(autoColors(tree).props.value).toBe(true);
  expect(tree.root.findByType("ColorModal" as any).props.visible).toBe(false);
  act(() => labelled(tree, "Primary color")[0].props.onPress());
  expect(autoColors(tree).props.value).toBe(false);
  const modal = tree.root.findByType("ColorModal" as any);
  expect(modal.props.visible).toBe(true);
  expect(modal.props.colorSelection).toBe(0);
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
  expect(dropdown("Subcategory").props.value).toBe("");
  act(() => dropdown("Subcategory").props.setValue("Sneakers"));
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
  expect(JSON.stringify(tree.toJSON())).not.toContain("under a collection");
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
    .find(d => d.props.placeholder === "Subcategory")!;
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
  const storage = () =>
    tree.root
      .findAllByType("Switch" as any)
      .find(s => s.props.accessibilityLabel === "In storage")!;
  expect(storage().props.value).toBe(false);
  act(() => storage().props.onValueChange(true));
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Subcategory")!;
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

test("Remove background replaces the photo, Undo brings it back, and Save stores the cutout", async () => {
  mockState.itemsList.items = [
    {
      id: "shirt",
      name: "Shirt",
      type: "Shirt",
      category: 0,
      image: "/9j/photo",
      collection: [],
    },
    {
      id: "cut",
      name: "Cut",
      type: "Shirt",
      category: 0,
      image: "UklGRcut",
      collection: [],
    },
  ];
  const photo = (tree: ReactTestRenderer) =>
    tree.root.findByType("ImageViewer" as any).props.imageUrl;
  // Already cut out: no button
  expect(button(render("cut"), "Remove background")).toBeUndefined();
  const tree = render("shirt");
  mockRemoveBackground.mockResolvedValueOnce({ error: "noSubject" });
  await act(async () => button(tree, "Remove background")!.props.onPress());
  expect(photo(tree)).toBe("/9j/photo");
  expect(JSON.stringify(tree.toJSON())).toContain("No garment found");
  mockRemoveBackground.mockResolvedValueOnce({ image: "UklGRnew" });
  await act(async () => button(tree, "Remove background")!.props.onPress());
  expect(mockRemoveBackground).toHaveBeenLastCalledWith("/9j/photo");
  expect(photo(tree)).toBe("UklGRnew");
  act(() => button(tree, "Undo")!.props.onPress());
  expect(photo(tree)).toBe("/9j/photo");
  mockRemoveBackground.mockResolvedValueOnce({ image: "UklGRnew" });
  await act(async () => button(tree, "Remove background")!.props.onPress());
  act(() => button(tree, "Save")!.props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "itemsList/updateItem",
      payload: expect.objectContaining({ id: "shirt", image: "UklGRnew" }),
    }),
  );
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
      .find(d => d.props.placeholder === "Subcategory")!;
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
