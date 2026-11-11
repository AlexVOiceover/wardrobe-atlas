import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { BulkModeForm } from "../screens/stackNav/BulkModeForm";

const mockDispatch = jest.fn();
const mockState = {
  settings: {
    language: 0,
    collectionSortValue: "CUSTOM",
    lastWardrobeId: "work" as string | undefined,
  },
  CategoryList: { CategoryCustomTypes: [] },
  itemsList: {
    wardrobes: [
      { id: "home", name: "Home" },
      { id: "work", name: "Work" },
    ],
    collectionTags: [],
    items: [],
  },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button", Switch: "Switch" }));
jest.mock("react-native-dropdown-picker", () => "Dropdown");
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("../components/PageHeader", () => ({ PageHeader: "PageHeader" }));
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
jest.mock("../components/WardrobeSelector", () => ({
  WardrobeSelector: "WardrobeSelector",
  useWardrobeView: () => ({ selected: "home" }),
}));
const mockLibrary = jest.fn();
const mockCamera = jest.fn();
jest.mock("react-native-image-picker", () => ({
  launchImageLibrary: (options: any) => mockLibrary(options),
  launchCamera: (options: any) => mockCamera(options),
}));
jest.mock("@bam.tech/react-native-image-resizer", () => ({
  __esModule: true,
  default: {
    createResizedImage: async (uri: string) => ({ uri: `${uri}-small` }),
  },
}));
// Each resized photo is kept as a photo file named after it.
jest.mock("../utils/photoStore", () => ({
  savePhotoFile: async (uri: string) => uri.replace(".jpg-small", "-small.jpg"),
}));
const mockExtractColors = jest.fn();
jest.mock("../utils/extractColors", () => ({
  extractColors: (image: string) => mockExtractColors(image),
}));
const mockRemoveBackground = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  removeBackground: (image: string) => mockRemoveBackground(image),
}));
const navigation = { popTo: jest.fn(), popToTop: jest.fn() };
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  mockDispatch.mockClear();
  navigation.popTo.mockClear();
  mockLibrary.mockReset();
  mockCamera.mockReset();
  mockRemoveBackground.mockReset();
  mockExtractColors.mockReset();
  mockExtractColors.mockImplementation(async (image: string) =>
    image.includes("a-small") ? ["#1F2A44", "#FFFFFF"] : [],
  );
});

async function render() {
  let tree!: ReactTestRenderer;
  await act(async () => {
    tree = create(
      <BulkModeForm
        navigation={navigation}
        route={{ params: { selectedCategory: 0 } }}
      />,
    );
  });
  return tree;
}
const press = (tree: ReactTestRenderer, label: string) =>
  act(async () =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === label)!
      .props.onPress(),
  );
const added = () =>
  mockDispatch.mock.calls
    .map(([action]) => action)
    .filter(action => action.type === "itemsList/addItem")
    .map(action => action.payload);

test("gallery: up to 30 photos with no count field, generated names and colors per photo", async () => {
  mockLibrary.mockResolvedValue({
    assets: [{ uri: "a.jpg" }, { uri: "b.jpg" }],
  });
  const tree = await render();
  expect(
    tree.root.findAllByType("CustomInput" as any).map(i => i.props.label),
  ).toEqual(["Name prefix (optional)"]);
  // Starts in the last used wardrobe
  expect(tree.root.findByType("WardrobeSelector" as any).props.value).toBe(
    "work",
  );
  const type = tree.root
    .findAllByType("Dropdown" as any)
    .find(d => d.props.placeholder === "Subcategory")!;
  await act(async () => type.props.setValue("Blazer"));
  await press(tree, "Choose photos");
  expect(mockLibrary).toHaveBeenCalledWith(
    expect.objectContaining({ selectionLimit: 30 }),
  );
  expect(mockRemoveBackground).not.toHaveBeenCalled();
  expect(added()).toEqual([
    expect.objectContaining({
      name: "Navy Blazer",
      image: "a-small.jpg",
      wardrobeId: "work",
      type: "Blazer",
      automaticColor: true,
      primaryColor: "#1F2A44",
      secondaryColor: "#FFFFFF",
      tertiaryColor: "",
    }),
    expect.objectContaining({
      // No color read: the subcategory alone
      name: "Blazer",
      automaticColor: true,
      primaryColor: "",
    }),
  ]);
  expect(mockDispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "settings/setLastWardrobe",
      payload: { wardrobeId: "work" },
    }),
  );
  expect(navigation.popTo).toHaveBeenCalledWith("StackNavHome", {
    screen: "Closet",
    params: { saved: "Saved to Work" },
  });
});

test("a prefix numbers the names, and Remove backgrounds cuts out each photo", async () => {
  mockLibrary.mockResolvedValue({
    assets: [{ uri: "a.jpg" }, { uri: "b.jpg" }],
  });
  mockRemoveBackground
    .mockResolvedValueOnce({ image: "a-cut.webp" })
    .mockResolvedValueOnce({ error: "noSubject" });
  const tree = await render();
  await act(async () =>
    tree.root.findByType("CustomInput" as any).props.onChangeText("Holiday"),
  );
  await act(async () =>
    tree.root
      .findAll(
        n =>
          n.props.accessibilityLabel === "Remove backgrounds" &&
          n.props.accessibilityRole === "switch" &&
          n.props.onPress,
      )[0]
      .props.onPress(),
  );
  await press(tree, "Choose photos");
  expect(mockRemoveBackground).toHaveBeenCalledTimes(2);
  expect(mockRemoveBackground).toHaveBeenCalledWith("a-small.jpg");
  expect(mockExtractColors).toHaveBeenCalledWith("a-cut.webp");
  expect(added().map(g => [g.name, g.image])).toEqual([
    ["Holiday 1", "a-cut.webp"],
    // Couldn't be cut out: keeps its photo
    ["Holiday 2", "b-small.jpg"],
  ]);
});

test("camera: takes photos until the camera is closed", async () => {
  mockCamera
    .mockResolvedValueOnce({ assets: [{ uri: "a.jpg" }] })
    .mockResolvedValueOnce({ assets: [{ uri: "b.jpg" }] })
    .mockResolvedValueOnce({ didCancel: true });
  const tree = await render();
  await press(tree, "Take photos");
  expect(mockCamera).toHaveBeenCalledTimes(3);
  expect(added()).toHaveLength(2);
});

test("cancelling the gallery adds nothing", async () => {
  mockLibrary.mockResolvedValue({ didCancel: true });
  const tree = await render();
  await press(tree, "Choose photos");
  expect(added()).toHaveLength(0);
  expect(navigation.popTo).not.toHaveBeenCalled();
});
