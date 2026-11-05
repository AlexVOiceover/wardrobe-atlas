import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import itemsReducer from "../redux/itemsSlice";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { deleteOutfit } from "../components/LogComponent";
import { EventLogForm } from "../screens/stackNav/EventLogForm";
import { ManageCategories } from "../screens/stackNav/ManageCategories";
import { OutfitLog } from "../screens/bottomNav/OutfitLog";

const mockDispatch = jest.fn();
const mockState: any = {
  settings: { language: 0 },
  CategoryList: { Categories: [], CategoryCustomTypes: [] },
  itemsList: { items: [], logs: [] },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
// The latest arguments of usePreventRemove: whether leaving asks first.
const mockGuard = { prevent: false };
const mockNavigation = {
  navigate: jest.fn(),
  popToTop: jest.fn(),
  goBack: jest.fn(),
  popTo: jest.fn(),
  setParams: jest.fn(),
};
const mockRoute: { params?: any } = {};
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => mockRoute,
  usePreventRemove: (prevent: boolean) => {
    mockGuard.prevent = prevent;
  },
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  Snackbar: "Snackbar",
}));
jest.mock("../components/CustomModal", () => "CustomModal");
jest.mock("../components/BottomSheet", () => ({ BottomSheet: "BottomSheet" }));
jest.mock("../components/NameSheet", () => ({ NameSheet: "NameSheet" }));
jest.mock("../components/PageHeader", () => ({
  PageHeader: "PageHeader",
  HeaderIcon: "HeaderIcon",
}));
jest.mock("../components/CustomInput", () => ({ CustomInput: "CustomInput" }));
jest.mock("../components/DatePicker", () => ({ DatePicker: "DatePicker" }));
jest.mock("../components/GarmentPicker", () => ({
  GarmentPicker: "GarmentPicker",
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const render = (element: React.ReactElement) => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree!;
};
const buttons = (tree: ReactTestRenderer) =>
  tree.root.findAllByType("Button" as any);

beforeEach(() => {
  mockDispatch.mockClear();
  mockState.settings.language = 0;
});

describe("confirmation dialog", () => {
  test("Cancel on the left, the named action on the right, red, no Close", () => {
    const onConfirm = jest.fn();
    const setVisible = jest.fn();
    const tree = render(
      <ConfirmationDialog
        visible
        setVisible={setVisible}
        title="Delete: Summer"
        message="The garments stay in your closet."
        onConfirm={onConfirm}
      />,
    );
    const modal = tree.root.findByType("CustomModal" as any);
    expect(modal.props.showClose).toBe(false);
    expect(modal.props.label).toBe("Delete: Summer");
    expect(buttons(tree).map(b => b.props.children)).toEqual([
      "Cancel",
      "Delete",
    ]);
    const confirm = buttons(tree)[1];
    expect(confirm.props.mode).toBe("contained");
    expect(confirm.props.buttonColor).toBe("#b3261e");
    act(() => buttons(tree)[0].props.onPress());
    expect(onConfirm).not.toHaveBeenCalled();
    expect(setVisible).toHaveBeenLastCalledWith(false);
    act(() => confirm.props.onPress());
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("labels can name other actions; non-destructive ones aren't red; Spanish", () => {
    mockState.settings.language = 1;
    const tree = render(
      <ConfirmationDialog
        visible
        setVisible={() => {}}
        confirmLabel="Descargar"
        destructive={false}
        onConfirm={() => {}}
      />,
    );
    expect(buttons(tree).map(b => b.props.children)).toEqual([
      "Cancelar",
      "Descargar",
    ]);
    expect(buttons(tree)[1].props.buttonColor).toBeUndefined();
    // No generic message any more
    expect(JSON.stringify(tree.toJSON())).not.toContain("registro");
  });
});

test("outfit form asks before leaving only once something is changed", async () => {
  mockState.itemsList = {
    items: [{ id: "a", name: "Shirt", logIds: ["e1"] }],
    logs: [{ eventId: "e1", eventName: "Work", eventDate: '"2026-11-01"' }],
  };
  const tree = render(
    <EventLogForm
      navigation={mockNavigation}
      route={{ params: { eventId: "e1" } }}
    />,
  );
  expect(mockGuard.prevent).toBe(false);
  const name = tree.root
    .findAllByType("CustomInput" as any)
    .find(i => i.props.label === "Name")!;
  act(() => name.props.onChange({ nativeEvent: { text: "Dinner" } }));
  expect(mockGuard.prevent).toBe(true);
  // Changing it back is not a change.
  act(() => name.props.onChange({ nativeEvent: { text: "Work" } }));
  expect(mockGuard.prevent).toBe(false);
  act(() => name.props.onChange({ nativeEvent: { text: "Dinner" } }));
  await act(async () => {
    const save = tree.root.findByType("PageHeader" as any).props.actions;
    expect(save.props.label).toBe("Save");
    save.props.onPress();
  });
  expect(mockGuard.prevent).toBe(false);
  expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
});

test("Restore default categories sits after Add and asks first", () => {
  const tree = render(<ManageCategories />);
  const labels = buttons(tree).map(b => b.props.children);
  expect(labels.indexOf("Restore default categories")).toBeGreaterThan(
    labels.indexOf("Add New Category"),
  );
  act(() =>
    buttons(tree)
      .find(b => b.props.children === "Restore default categories")!
      .props.onPress(),
  );
  expect(mockDispatch).not.toHaveBeenCalled();
  const dialog = tree.root
    .findAllByType(ConfirmationDialog)
    .find(d => d.props.title === "Restore default categories?")!;
  expect(dialog.props.visible).toBe(true);
  expect(dialog.props.confirmLabel).toBe("Restore");
  act(() => dialog.props.onConfirm());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "CategoryList/restoreDefaultCategories",
    payload: undefined,
  });
});

describe("deleting a logged outfit", () => {
  const outfits = () => ({
    wardrobes: [],
    collectionTags: [],
    refreshItems: false,
    items: [
      { id: "a", name: "Shirt", logIds: ["e1", "e2", "e3"] },
      { id: "b", name: "Jeans", logIds: ["e2", "e1"] },
      { id: "c", name: "Coat", logIds: ["e3"] },
    ],
    logs: [
      { eventId: "e1", eventName: "Work", eventDate: '"2026-11-01"' },
      {
        eventId: "e2",
        eventName: "Dinner",
        eventDate: '"2026-11-02T20:00:00.000Z"',
        logTime: '"2026-11-03T08:00:00.000Z"',
        additionalNotes: "Birthday",
      },
      { eventId: "e3", eventName: "Walk", eventDate: '"2026-11-03"' },
    ],
  });

  test("Undo puts the outfit and every garment link back exactly", () => {
    const before: any = outfits();
    let state: any = before;
    const dispatch = (action: any) => {
      state = itemsReducer(state, action);
    };
    const deleted = deleteOutfit(dispatch, state.logs, state.items, "e2")!;
    expect(deleted.name).toBe("Dinner");
    expect(state.logs.map((log: any) => log.eventId)).toEqual(["e1", "e3"]);
    expect(state.items.map((item: any) => item.logIds)).toEqual([
      ["e1", "e3"],
      ["e1"],
      ["e3"],
    ]);
    dispatch(deleted.restore);
    expect(state).toEqual(before);
    // A second Undo changes nothing.
    dispatch(deleted.restore);
    expect(state).toEqual(before);
  });

  test("Delete in the outfit's page deletes at once and Outfits offers Undo", async () => {
    mockState.itemsList = outfits();
    const form = render(
      <EventLogForm
        navigation={mockNavigation}
        route={{ params: { eventId: "e2" } }}
      />,
    );
    const remove = buttons(form).find(
      b => b.props.children === "Delete outfit",
    )!;
    expect(remove.props.textColor).toBe("#b3261e");
    await act(async () => remove.props.onPress());
    expect(mockDispatch.mock.calls.map(call => call[0].type)).toEqual([
      "itemsList/deleteLog",
      "itemsList/deleteEventLog",
    ]);
    // Deleting never asks to discard changes.
    expect(mockGuard.prevent).toBe(false);
    expect(mockNavigation.popTo).toHaveBeenCalledTimes(1);
    const [screen, params] = mockNavigation.popTo.mock.calls[0];
    expect(screen).toBe("StackNavHome");
    expect(params.screen).toBe("Outfits");
    act(() => form.unmount());
    mockRoute.params = params.params;
    const tree = render(<OutfitLog />);
    expect(mockNavigation.setParams).toHaveBeenCalledWith({
      notice: undefined,
    });
    const snackbar = tree.root.findByType("Snackbar" as any);
    expect(snackbar.props.visible).toBe(true);
    expect(snackbar.props.children).toBe("Deleted: Dinner");
    expect(snackbar.props.action.label).toBe("Undo");
    mockDispatch.mockClear();
    act(() => snackbar.props.action.onPress());
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "itemsList/restoreEventLog",
      payload: {
        log: mockState.itemsList.logs[1],
        index: 1,
        garments: [
          { id: "a", index: 1 },
          { id: "b", index: 0 },
        ],
      },
    });
    act(() => tree.unmount());
    mockRoute.params = undefined;
  });
});
