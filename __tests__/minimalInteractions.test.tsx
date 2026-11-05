import React from "react";
import { BottomSheet } from "../components/BottomSheet";

jest.mock("../components/ItemSummary", () => ({ ItemSummary: () => null }));
jest.mock("react-redux", () => ({ useSelector: () => ({ language: 0 }) }));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button" }));

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
