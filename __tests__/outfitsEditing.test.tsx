import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import itemsReducer, { updateEventLog } from "../redux/itemsSlice";
import { ItemSelector } from "../screens/stackNav/ItemSelector";
import { EventLogForm } from "../screens/stackNav/EventLogForm";
import { OutfitLog } from "../screens/bottomNav/OutfitLog";

const garment = (id: string, extra = {}) => ({
  id,
  name: id,
  type: "Shirt",
  image: "",
  category: 0,
  collection: [],
  logIds: [],
  ...extra,
});
const outfits = () => ({
  wardrobes: [
    { id: "home", name: "Home" },
    { id: "trip", name: "Trip" },
  ],
  collectionTags: [
    { label: "Work", value: "work", isOpen: true, arrangement: 0 },
    { label: "Summer", value: "summer", isOpen: true, arrangement: 1 },
  ],
  refreshItems: false,
  items: [
    // In two collections, but picked once.
    garment("Shirt", {
      collection: ["work", "summer"],
      logIds: ["e1", "e2"],
      wardrobeId: "home",
    }),
    garment("Jeans", { category: 1, type: "", logIds: ["e2"] }),
    garment("Boots", { category: 2, type: "", stored: true }),
    garment("Parka", { wardrobeId: "trip" }),
  ],
  logs: [
    // Logged first, but worn last.
    {
      eventId: "e1",
      eventName: "Work",
      eventDate: '"2026-11-04T09:00:00.000Z"',
      logTime: '"2026-11-01T08:00:00.000Z"',
    },
    {
      eventId: "e2",
      eventName: "Dinner",
      eventDate: '"2026-11-02T20:00:00.000Z"',
      logTime: '"2026-11-03T08:00:00.000Z"',
      additionalNotes: "Birthday",
    },
  ],
});
const mockState: any = {
  settings: { language: 0, gridColumns: 3 },
  CategoryList: { Categories: [], CategoryCustomTypes: [] },
  itemsList: outfits(),
};
const mockDispatch = jest.fn();
const mockWardrobe: { selected?: string } = {};
const mockGuard = { prevent: false };
const mockRoute: { params?: any } = {};
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
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
  useRoute: () => mockRoute,
  usePreventRemove: (prevent: boolean) => {
    mockGuard.prevent = prevent;
  },
}));
jest.mock("../components/WardrobeSelector", () => ({
  useWardrobeView: () => ({ selected: mockWardrobe.selected }),
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-modal-datetime-picker", () => "DateModal");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  Snackbar: "Snackbar",
  Searchbar: "Searchbar",
  TextInput: "TextInput",
}));
jest.mock("../components/PageHeader", () => ({
  PageHeader: "PageHeader",
  HeaderIcon: "HeaderIcon",
}));
jest.mock("../components/BottomSheet", () => ({ BottomSheet: "BottomSheet" }));
jest.mock("../components/CustomModal", () => "CustomModal");
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
const button = (tree: ReactTestRenderer, text: string) =>
  tree.root
    .findAllByType("Button" as any)
    .find(x => x.props.children === text)!;
// Every text on screen, joined.
const visibleText = (tree: ReactTestRenderer) => {
  const texts: string[] = [];
  const visit = (node: any) => {
    if (typeof node === "string") texts.push(node);
    else if (Array.isArray(node)) node.forEach(visit);
    else if (node?.children) node.children.forEach(visit);
  };
  visit(tree.toJSON());
  return texts.join("|");
};
const cards = (tree: ReactTestRenderer) =>
  tree.root
    .findAll(x => x.props.accessibilityState && !!x.props.onLongPress)
    .map(x => x.props.accessibilityLabel);

beforeEach(() => {
  mockState.itemsList = outfits();
  mockState.settings.language = 0;
  mockWardrobe.selected = undefined;
  mockRoute.params = undefined;
  mockDispatch.mockClear();
  Object.values(mockNavigation).forEach(fn => fn.mockClear());
});

describe("updateEventLog", () => {
  test("patches only the fields given", () => {
    const state = itemsReducer(
      outfits() as any,
      updateEventLog({ eventId: "e2", eventName: "Party" }),
    );
    expect(state.logs[1]).toEqual({ ...outfits().logs[1], eventName: "Party" });
    expect(state.items).toEqual(outfits().items);
  });

  test("garments link exactly as given; kept links stay in place", () => {
    const state = itemsReducer(
      outfits() as any,
      updateEventLog({
        eventId: "e1",
        eventDate: '"2026-11-03T10:00:00.000Z"',
        additionalNotes: "Office",
        garmentIds: ["Jeans", "Boots"],
      }),
    );
    expect(state.logs[0]).toMatchObject({
      eventName: "Work",
      eventDate: '"2026-11-03T10:00:00.000Z"',
      additionalNotes: "Office",
    });
    expect(state.items.map(g => g.logIds)).toEqual([
      ["e2"],
      ["e2", "e1"],
      ["e1"],
      [],
    ]);
  });

  test("an unknown outfit changes nothing", () => {
    const before = outfits() as any;
    expect(
      itemsReducer(
        before,
        updateEventLog({ eventId: "gone", eventName: "X", garmentIds: [] }),
      ),
    ).toEqual(before);
  });
});

describe("Outfits +", () => {
  test("shows the closet by category, each garment once, without stored ones", () => {
    const tree = render(<ItemSelector />);
    expect(cards(tree)).toEqual(["Shirt", "Parka", "Jeans"]);
    expect(visibleText(tree)).toContain("Tops");
    // Stored garments show when asked for.
    act(() =>
      tree.root.findByProps({ label: "Show stored (1)" }).props.onPress(),
    );
    expect(cards(tree)).toContain("Boots");
  });

  test("follows the wardrobe the Closet shows", () => {
    mockWardrobe.selected = "home";
    const tree = render(<ItemSelector />);
    expect(cards(tree)).toEqual(["Shirt"]);
  });

  test("Log outfit (n) logs the ticked garments at once and Outfits offers Undo", () => {
    const tree = render(<ItemSelector />);
    expect(button(tree, "Log outfit (0)").props.disabled).toBe(true);
    act(() => pressable(tree, "Shirt").props.onPress());
    act(() => pressable(tree, "Jeans").props.onLongPress());
    act(() => pressable(tree, "Jeans").props.onPress());
    act(() => pressable(tree, "Jeans").props.onPress());
    expect(pressable(tree, "Shirt").props.accessibilityState).toEqual({
      selected: true,
    });
    // Ticking and folding headings save nothing.
    act(() => pressable(tree, "Tops, 2").props.onPress());
    expect(cards(tree)).toEqual(["Jeans"]);
    act(() => pressable(tree, "Tops, 2").props.onPress());
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(visibleText(tree)).toContain("Now · change");
    act(() => button(tree, "Log outfit (2)").props.onPress());
    expect(mockDispatch.mock.calls.map(call => call[0].type)).toEqual([
      "itemsList/addEventLog",
      "itemsList/addLog",
      "itemsList/addLog",
    ]);
    expect(mockDispatch.mock.calls[0][0].payload.eventName).toBe("Outfit");
    expect(mockNavigation.popTo).toHaveBeenCalledWith("StackNavHome", {
      screen: "Outfits",
      params: { notice: { kind: "logged", eventId: "new", name: "Outfit" } },
    });
  });
});

describe("Outfits list", () => {
  test("newest worn first; compact cards open the outfit", () => {
    const tree = render(<OutfitLog />);
    const titles = tree.root
      .findAll(
        x =>
          typeof x.props.accessibilityLabel === "string" &&
          x.props.accessibilityLabel.startsWith("Edit ") &&
          !!x.props.onPress,
      )
      .map(x => x.props.accessibilityLabel);
    expect(titles).toEqual(["Edit Work", "Edit Dinner"]);
    expect(visibleText(tree)).toContain("Birthday");
    // Small photos, no bin on the card
    expect(
      tree.root.findAll(x => x.props.accessibilityLabel === "Shirt").length,
    ).toBeGreaterThan(0);
    expect(
      tree.root.findAll(x => x.props.accessibilityLabel === "Delete: Dinner"),
    ).toHaveLength(0);
    act(() => pressable(tree, "Edit Dinner").props.onPress());
    expect(mockNavigation.navigate).toHaveBeenCalledWith("EventLogForm", {
      eventId: "e2",
    });
    const sort = tree.root.findByType("BottomSheet" as any);
    expect(
      sort
        .findAll(x => x.props.label && x.props.selected !== undefined)
        .map(x => x.props.label),
    ).toEqual(["Date ↓", "Date ↑", "Name ↑", "Name ↓", "Last added"]);
    act(() => tree.unmount());
  });

  test("an empty list explains how to log", () => {
    mockState.itemsList = { ...outfits(), logs: [] };
    mockState.settings.language = 1;
    const tree = render(<OutfitLog />);
    expect(visibleText(tree)).toContain(
      "Aún no hay conjuntos. Toca una prenda en tu Armario o toca + para registrar un conjunto.",
    );
    act(() => tree.unmount());
  });

  test("a logged outfit coming back shows Logged with Undo", () => {
    mockRoute.params = {
      notice: { kind: "logged", eventId: "e9", name: "Outfit" },
    };
    const tree = render(<OutfitLog />);
    const snackbar = tree.root.findByType("Snackbar" as any);
    expect(snackbar.props.visible).toBe(true);
    expect(snackbar.props.children).toBe("Logged: Outfit");
    act(() => snackbar.props.action.onPress());
    expect(mockDispatch.mock.calls.map(call => call[0])).toEqual([
      { type: "itemsList/deleteLog", payload: { selectedLogId: "e9" } },
      { type: "itemsList/deleteEventLog", payload: { selectedLogId: "e9" } },
    ]);
    act(() => tree.unmount());
  });
});

describe("editing a logged outfit", () => {
  const open = (eventId = "e2") =>
    render(
      <EventLogForm
        navigation={mockNavigation}
        route={{ params: { eventId } }}
      />,
    );
  const save = (tree: ReactTestRenderer) =>
    act(() =>
      tree.root.findByType("PageHeader" as any).props.actions.props.onPress(),
    );

  test("shows the outfit; Save without changes writes nothing new", () => {
    const tree = open();
    const inputs = tree.root.findAllByType("TextInput" as any);
    expect(inputs.map(i => [i.props.label, i.props.value])).toEqual([
      ["Name", "Dinner"],
      ["Additional notes", "Birthday"],
    ]);
    expect(visibleText(tree)).toContain("2 garments");
    expect(mockGuard.prevent).toBe(false);
    save(tree);
    expect(mockDispatch).toHaveBeenCalledWith(
      updateEventLog({ eventId: "e2" }),
    );
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  test("garments are removed and added, then saved together", () => {
    const tree = open();
    act(() => pressable(tree, "Remove Jeans").props.onPress());
    expect(mockGuard.prevent).toBe(true);
    act(() => button(tree, "Add garments").props.onPress());
    const modal = tree.root.find(
      x => x.props.visible === true && !!x.props.onRequestClose,
    );
    // The picker starts with the outfit's garments ticked.
    expect(pressable(tree, "Shirt").props.accessibilityState).toEqual({
      selected: true,
    });
    act(() => pressable(tree, "Parka").props.onPress());
    act(() => button(tree, "Done").props.onPress());
    expect(modal.props.visible).toBe(false);
    expect(visibleText(tree)).toContain("2 garments");
    save(tree);
    expect(mockDispatch).toHaveBeenCalledWith(
      updateEventLog({ eventId: "e2", garmentIds: ["Shirt", "Parka"] }),
    );
  });

  test("a name is required; the date can't be in the future", () => {
    const tree = open();
    const name = tree.root.find(
      x => x.props.label === "Name" && !!x.props.onChange,
    );
    act(() => name.props.onChange({ nativeEvent: { text: "  " } }));
    save(tree);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(visibleText(tree)).toContain("Give the outfit a name");
    const picker = tree.root.findByType("DateModal" as any);
    expect(picker.props.maximumDate).toBeInstanceOf(Date);
    act(() => picker.props.onConfirm(new Date(Date.now() + 86400000)));
    act(() => name.props.onChange({ nativeEvent: { text: "Party" } }));
    save(tree);
    const { payload } = mockDispatch.mock.calls[0][0];
    expect(payload.eventName).toBe("Party");
    expect(
      new Date(JSON.parse(payload.eventDate)).getTime(),
    ).toBeLessThanOrEqual(Date.now());
  });
});
