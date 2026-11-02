import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import ColorModal from "../components/ColorModal";

jest.mock("react-redux", () => ({ useSelector: () => ({ language: 0 }) }));
jest.mock("../components/CustomModal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("react-native-wheel-color-picker", () => "ColorPicker");
jest.mock("react-native-paper", () => {
  const ReactForMock = require("react");
  const Input = Object.assign(
    (props: unknown) => ReactForMock.createElement("HexInput", props),
    { Icon: "InputIcon" },
  );
  return { Button: "Button", HelperText: "HelperText", TextInput: Input };
});

// React 19 requires act for updates; this test exercises the real component state.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

test("garment color picker starts with the saved color and saves a new selection", async () => {
  const setColors = jest.fn();
  const setVisible = jest.fn();
  let view: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ColorModal
        colors={["#123456", "#ffffff"]}
        setColors={setColors}
        colorSelection={0}
        visible={true}
        setVisible={setVisible}
      />,
    );
  });
  const picker = () => view!.root.findByType("ColorPicker" as any);
  expect(picker().props.color).toBe("#123456");
  await act(async () => {
    picker().props.onColorChange("#654321");
  });
  expect(picker().props.color).toBe("#654321");
  const save = view!.root.findByType("Button" as any);
  expect(save.props.disabled).toBe(false);
  await act(async () => {
    save.props.onPress();
  });
  expect(setColors).toHaveBeenCalledWith(["#654321", "#ffffff"]);
  expect(setVisible).toHaveBeenCalledWith(false);
  await act(async () => {
    view!.unmount();
  });
});
