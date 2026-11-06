import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Modal, StyleSheet, Text } from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { BottomSheet } from "../components/BottomSheet";

jest.mock("../components/ItemSummary", () => ({ ItemSummary: () => null }));
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select({ settings: { language: 0 } }),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({}) }));

const render = (isOpen: boolean, setOpen: jest.Mock, bottom = 0) => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <SafeAreaInsetsContext.Provider
        value={{ top: 0, left: 0, right: 0, bottom }}
      >
        <BottomSheet isOpen={isOpen} setIsOpen={setOpen} title="Filters">
          <Text>Body</Text>
        </BottomSheet>
      </SafeAreaInsetsContext.Provider>,
    );
  });
  return tree;
};

test("sheet closes idempotently on Android Back, its backdrop and its ✕", () => {
  const setOpen = jest.fn();
  const tree = render(true, setOpen);
  const modal = tree.root.findByType(Modal);
  expect(modal.props.visible).toBe(true);
  expect(modal.props.animationType).toBe("none");
  act(() => modal.props.onRequestClose());
  const closers = tree.root.findAll(
    n => n.props.accessibilityLabel === "Close" && !!n.props.onPress,
  );
  // The backdrop and the ✕ in the header; no "Close" text button.
  expect(closers.length).toBeGreaterThanOrEqual(2);
  closers.forEach(closer => act(() => closer.props.onPress()));
  expect(setOpen.mock.calls.every(call => call[0] === false)).toBe(true);
  expect(tree.root.findAllByProps({ children: "Close" })).toHaveLength(0);
  expect(render(false, setOpen).root.findByType(Modal).props.visible).toBe(
    false,
  );
});

test("panel sits in the middle of the screen with rounded corners", () => {
  const tree = render(true, jest.fn(), 48);
  const styles = tree.root
    .findAll(n => !!n.props.style && typeof n.type === "string")
    .map(n => StyleSheet.flatten(n.props.style));
  expect(styles.some(s => s?.justifyContent === "center")).toBe(true);
  expect(styles.some(s => s?.justifyContent === "flex-end")).toBe(false);
  const sheet = styles.find(s => s?.maxHeight === "85%");
  expect(sheet?.borderRadius).toBeGreaterThan(0);
});
