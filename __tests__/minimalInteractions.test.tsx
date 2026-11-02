import React from "react";
import { SelectionItemBox } from "../components/SelectionItemBox";
import { BottomSheet } from "../components/BottomSheet";

jest.mock("../components/ItemSummary", () => ({ ItemSummary: () => null }));
jest.mock("react-redux", () => ({ useSelector: () => ({ language: 0 }) }));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button" }));

const garment = {
  id: "shirt",
  name: "Shirt",
  image: "",
  type: "Top",
  primary: "#fff",
  secondary: "",
  tertiary: "",
};

test("selection follows external bulk changes and toggles against the latest state", () => {
  let ids = ["coat"];
  const setIds = jest.fn(update => {
    ids = typeof update === "function" ? update(ids) : update;
  });
  const render = () =>
    SelectionItemBox({
      ...garment,
      selectedIdCollector: ids,
      setSelectedIdCollector: setIds,
    });
  expect(render().props.accessibilityState.checked).toBe(false);
  render().props.onPress();
  expect(ids).toEqual(["coat", "shirt"]);
  expect(render().props.accessibilityState.checked).toBe(true);
  // A parent select-all/reset must immediately drive the control, with no stale local state.
  ids = [];
  expect(render().props.accessibilityState.checked).toBe(false);
  const stalePress = render().props.onPress;
  ids = ["shirt", "trousers"];
  stalePress();
  expect(ids).toEqual(["trousers"]);
});

test("filter sheet closes idempotently on Android Back and its backdrop", () => {
  const setOpen = jest.fn();
  const sheet = (isOpen: boolean) =>
    BottomSheet({
      isOpen,
      setIsOpen: setOpen,
      title: "Filters",
      children: <React.Fragment />,
    });
  const modal = sheet(true);
  expect(modal.props.visible).toBe(true);
  expect(modal.props.animationType).toBe("none");
  modal.props.onRequestClose();
  modal.props.children.props.children[0].props.onPress();
  expect(setOpen.mock.calls).toEqual([[false], [false]]);
  expect(sheet(false).props.visible).toBe(false);
});
