import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Text } from "react-native";
import ColorModal from "../components/ColorModal";

jest.mock("react-redux", () => ({ useSelector: () => ({ language: 0 }) }));
jest.mock("../components/CustomModal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("react-native-wheel-color-picker", () => "ColorPicker");
const mockAverage = jest.fn();
jest.mock("@somesoap/react-native-image-palette", () => ({
  getSegmentsAverageColor: (...args: unknown[]) => mockAverage(...args),
}));
jest.mock("react-native-blob-util", () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: "/cache" },
      writeFile: jest.fn(() => Promise.resolve()),
      unlink: jest.fn(() => Promise.resolve()),
    },
  },
}));
const mockFs = require("react-native-blob-util").default.fs;
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
  // One contained "Use color" and a Cancel, on the wheel too
  expect(
    view!.root.findAllByType("Button" as any).map(b => b.props.children),
  ).toEqual(["Cancel", "Use color"]);
  const save = view!.root
    .findAllByType("Button" as any)
    .find(b => b.props.children === "Use color")!;
  expect(save.props.mode).toBe("contained");
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

test("with a photo, the picker opens on the photo and saves the tapped color", async () => {
  mockAverage.mockResolvedValue(["#FF1F2A44"]);
  const setColors = jest.fn();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ColorModal
        colors={["#123456", ""]}
        setColors={setColors}
        colorSelection={1}
        visible={true}
        setVisible={jest.fn()}
        image="photo-data"
      />,
    );
  });
  expect(view.root.findAllByType("ColorPicker" as any)).toHaveLength(0);
  const container = view.root.find(
    n => typeof n.props.onLayout === "function" && n.props.style?.gap,
  );
  await act(async () => {
    container.props.onLayout({ nativeEvent: { layout: { width: 200 } } });
  });
  const photo = view.root.find(
    n => n.props.accessibilityRole === "imagebutton" && n.props.onPress,
  );
  await act(async () => {
    await photo.props.onPress({
      nativeEvent: { locationX: 100, locationY: 50 },
    });
  });
  expect(mockFs.writeFile).toHaveBeenCalledWith(
    expect.stringMatching(/^\/cache\/picker_/),
    "photo-data",
    "base64",
  );
  // Jest's Image.getSize reports a 4:3 photo, so the 200-wide box is 150 tall
  // and the tap sits at 50% across and 33% down.
  expect(mockAverage).toHaveBeenCalledWith(
    expect.stringMatching(/^file:\/\//),
    [{ fromX: 49, toX: 52, fromY: 32, toY: 35 }],
  );
  const use = view.root
    .findAllByType("Button" as any)
    .find(b => b.props.children === "Use color")!;
  expect(use.props.disabled).toBe(false);
  await act(async () => {
    use.props.onPress();
  });
  expect(setColors).toHaveBeenCalledWith(["#123456", "#1F2A44"]);
  await act(async () => {
    view.unmount();
  });
  expect(mockFs.unlink).toHaveBeenCalled();
});

test("on the wheel the photo stays in view next to a live swatch", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ColorModal
        colors={["#123456"]}
        setColors={jest.fn()}
        colorSelection={0}
        visible={true}
        setVisible={jest.fn()}
        image="photo-data"
      />,
    );
  });
  const chip = view.root.find(
    n => n.props.accessibilityLabel === "Wheel" && !!n.props.onPress,
  );
  await act(async () => chip.props.onPress());
  const photo = view.root.find(
    n => n.props.accessibilityLabel === "Photo" && !!n.props.source,
  );
  expect(photo.props.source.uri).toBe("data:image/jpeg;base64,photo-data");
  const swatch = () =>
    view.root.find(n => n.props.testID === "wheel-swatch" && !!n.props.style);
  await act(async () =>
    view.root.findByType("ColorPicker" as any).props.onColorChange("#AA0000"),
  );
  expect(JSON.stringify(swatch().props.style)).toContain("#AA0000");
  expect(swatch().findByType(Text).props.children).toBe("#AA0000");
  await act(async () => view.unmount());
});

test("without a photo the wheel shows no comparison", async () => {
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ColorModal
        colors={["#123456"]}
        setColors={jest.fn()}
        colorSelection={0}
        visible={true}
        setVisible={jest.fn()}
      />,
    );
  });
  expect(
    view.root.findAll(n => n.props.testID === "wheel-swatch"),
  ).toHaveLength(0);
  await act(async () => view.unmount());
});

test("a typed HEX applies on the keyboard's Done, and Cancel keeps the old color", async () => {
  const setColors = jest.fn();
  const setVisible = jest.fn();
  let view!: ReactTestRenderer;
  await act(async () => {
    view = create(
      <ColorModal
        colors={["#123456"]}
        setColors={setColors}
        colorSelection={0}
        visible={true}
        setVisible={setVisible}
      />,
    );
  });
  const hex = () => view.root.findByType("HexInput" as any);
  // No separate ✓ button in the field
  expect(hex().props.right).toBeUndefined();
  await act(async () => hex().props.onChangeText("#aa0000"));
  await act(async () => hex().props.onSubmitEditing());
  expect(view.root.findByType("ColorPicker" as any).props.color).toBe(
    "#AA0000",
  );
  const press = (label: string) =>
    view.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === label)!
      .props.onPress();
  await act(async () => press("Cancel"));
  expect(setVisible).toHaveBeenCalledWith(false);
  expect(setColors).not.toHaveBeenCalled();
  await act(async () => press("Use color"));
  expect(setColors).toHaveBeenCalledWith(["#AA0000"]);
  await act(async () => view.unmount());
});
