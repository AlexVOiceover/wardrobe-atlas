import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import itemsReducer, {
  addCollection,
  setCollectionGarments,
  updateCollection,
} from "../redux/itemsSlice";
import { collectionNameError } from "../components/CollectionNameSheet";
import { Collections } from "../screens/bottomNav/Collections";
import { Collection } from "../screens/stackNav/Collection";

const garment = {
  id: "shirt",
  name: "Linen shirt",
  type: "Shirt",
  image: "",
  category: 0,
  collection: ["trip"],
  logIds: [],
};
const mockState: any = {
  settings: { language: 0, gridColumns: 3, collectionSortValue: "CUSTOM" },
  CategoryList: { Categories: [], CategoryCustomTypes: [] },
  itemsList: {
    wardrobes: [],
    items: [
      garment,
      { ...garment, id: "shorts", name: "Shorts", collection: [] },
    ],
    collectionTags: [
      { label: "Trip", value: "trip", isOpen: true, arrangement: 0 },
      { label: "Work", value: "work", isOpen: true, arrangement: 1 },
    ],
    logs: [],
  },
};
const mockDispatch = jest.fn();
const navigation = { navigate: jest.fn(), goBack: jest.fn() };
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: jest.fn() }),
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  Snackbar: "Snackbar",
  TextInput: "TextInput",
}));
const mockLogGarments = jest.fn();
jest.mock("../components/QuickLogSheet", () => ({
  QuickLogSheet: "QuickLogSheet",
  logGarments: (...args: unknown[]) => mockLogGarments(...args),
}));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const render = (element: React.ReactElement) => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree!;
};
const pressable = (tree: ReactTestRenderer, label: string) =>
  tree.root.find(
    x => x.props.accessibilityLabel === label && !!x.props.onPress,
  );
const button = (tree: ReactTestRenderer, label: string) =>
  tree.root
    .findAllByType("Button" as any)
    .find(x => x.props.children === label)!;

beforeEach(() => {
  mockDispatch.mockClear();
  navigation.navigate.mockClear();
  navigation.goBack.mockClear();
});

test("a collection's garments are set in one step", () => {
  let state = itemsReducer(
    mockState.itemsList,
    setCollectionGarments({ value: "trip", ids: ["shorts"] }),
  );
  expect(state.items.map(g => g.collection)).toEqual([[], ["trip"]]);
  state = itemsReducer(
    state,
    setCollectionGarments({ value: "work", ids: ["shorts"] }),
  );
  expect(state.items[1].collection).toEqual(["trip", "work"]);
});

test("a new collection never takes the id a renamed one still uses", () => {
  let state = itemsReducer(
    mockState.itemsList,
    updateCollection({ name: "trip", newName: "Holiday" }),
  );
  state = itemsReducer(state, addCollection({ name: "trip" }));
  expect(state.collectionTags.map(t => t.value)).toEqual([
    "trip",
    "work",
    "trip (2)",
  ]);
});

test("collection names must be given and unique, ignoring case", () => {
  const tags = mockState.itemsList.collectionTags;
  expect(collectionNameError(tags, "  ")).toBe("CollectionNameRequired");
  expect(collectionNameError(tags, "work")).toBe("NameTaken");
  expect(collectionNameError(tags, "Trip", "Trip")).toBeUndefined();
  expect(collectionNameError(tags, "Gym")).toBeUndefined();
});

test("the tab lists collections with counts, opens one and creates new ones", () => {
  const tree = render(<Collections navigation={navigation} />);
  const trip = tree.root.find(x => x.props.title === "Trip");
  expect(trip.props.subtitle).toBe("1 garment");
  act(() => trip.props.onPress());
  expect(navigation.navigate).toHaveBeenCalledWith("Collection", {
    value: "trip",
  });
  act(() => pressable(tree, "New collection").props.onPress());
  const input = tree.root.findByType("TextInput" as any);
  act(() => input.props.onChangeText("Gym"));
  act(() => button(tree, "Save").props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith(
    addCollection({ name: "Gym", color: expect.anything() }),
  );
});

test("the custom order is changed from the sort panel", () => {
  const tree = render(<Collections navigation={navigation} />);
  act(() => pressable(tree, "Sort").props.onPress());
  act(() => pressable(tree, "Move down: Trip").props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "itemsList/moveCollection",
    payload: { value: "trip", direction: "down" },
  });
});

test("garments are added and removed by ticking, and saved together", () => {
  const tree = render(
    <Collection
      navigation={navigation}
      route={{ params: { value: "trip" } }}
    />,
  );
  act(() => button(tree, "Add or remove garments").props.onPress());
  act(() => pressable(tree, "Shorts").props.onPress());
  act(() => pressable(tree, "Save").props.onPress());
  expect(mockDispatch).toHaveBeenCalledWith(
    setCollectionGarments({ value: "trip", ids: ["shirt", "shorts"] }),
  );
});

test("cancelling keeps the garments as they were", () => {
  const tree = render(
    <Collection
      navigation={navigation}
      route={{ params: { value: "trip" } }}
    />,
  );
  act(() => button(tree, "Add or remove garments").props.onPress());
  act(() => pressable(tree, "Linen shirt").props.onPress());
  act(() => pressable(tree, "Cancel").props.onPress());
  expect(mockDispatch).not.toHaveBeenCalled();
  expect(button(tree, "Log as outfit")).toBeTruthy();
});

test("Log as outfit logs every garment in the collection", () => {
  const tree = render(
    <Collection
      navigation={navigation}
      route={{ params: { value: "trip" } }}
    />,
  );
  const sheet = () => tree.root.findByType("QuickLogSheet" as any);
  expect(sheet().props.garments).toEqual([]);
  act(() => button(tree, "Log as outfit").props.onPress());
  expect(sheet().props.garments.map((g: any) => g.id)).toEqual(["shirt"]);
});

test("tapping a garment opens its sheet, a double tap logs it with Undo, and a long press edits it", () => {
  const tree = render(
    <Collection
      navigation={navigation}
      route={{ params: { value: "trip" } }}
    />,
  );
  const sheet = () => tree.root.findByType("QuickLogSheet" as any);
  const card = () =>
    tree.root.find(
      x => x.props.accessibilityLabel === "Linen shirt" && !!x.props.onPress,
    );
  jest.useFakeTimers();
  act(() => card().props.onPress());
  act(() => jest.advanceTimersByTime(300));
  expect(sheet().props.garments.map((g: any) => g.id)).toEqual(["shirt"]);
  expect(navigation.navigate).not.toHaveBeenCalled();
  act(() => sheet().props.onClose());
  mockLogGarments.mockReturnValueOnce({ eventId: "e1", name: "Linen shirt" });
  act(() => card().props.onPress());
  act(() => card().props.onPress());
  act(() => jest.advanceTimersByTime(1000));
  jest.useRealTimers();
  expect(sheet().props.garments).toEqual([]);
  expect(mockLogGarments).toHaveBeenCalledWith(
    mockDispatch,
    [expect.objectContaining({ id: "shirt" })],
    0,
  );
  const snackbar = tree.root.findByType("Snackbar" as any);
  expect(snackbar.props.children).toBe("Logged: Linen shirt");
  act(() => snackbar.props.action.onPress());
  expect(mockDispatch.mock.calls.map(call => call[0].type)).toEqual([
    "itemsList/deleteLog",
    "itemsList/deleteEventLog",
  ]);
  act(() => card().props.onLongPress());
  expect(navigation.navigate).toHaveBeenCalledWith("ItemForm", {
    editingIndex: "shirt",
  });
});

test("deleting asks first, then removes the collection and goes back", () => {
  const tree = render(
    <Collection
      navigation={navigation}
      route={{ params: { value: "trip" } }}
    />,
  );
  const dialog = () => tree.root.findByType("ConfirmationDialog" as any);
  act(() => pressable(tree, "Delete").props.onPress());
  expect(dialog().props.visible).toBe(true);
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => dialog().props.onConfirm());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "itemsList/deleteCollection",
    payload: { name: "trip" },
  });
  expect(navigation.goBack).toHaveBeenCalled();
});

test("an empty collection offers to add garments instead of logging", () => {
  const tree = render(
    <Collection
      navigation={navigation}
      route={{ params: { value: "work" } }}
    />,
  );
  expect(
    tree.root.findAllByType("Button" as any).map(b => b.props.children),
  ).toEqual(["Add or remove garments"]);
});
