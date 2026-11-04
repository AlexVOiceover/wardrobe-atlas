import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Image } from "react-native";
import {
  BRUSH_SIZES,
  CutoutEditor,
  fitImage,
  toStroke,
} from "../components/CutoutEditor";

const mockEditCutout = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  ...jest.requireActual("../utils/backgroundRemoval"),
  editCutout: (...args: unknown[]) => mockEditCutout(...args),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select({ settings: { language: 0 } }),
}));
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({}) }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  mockEditCutout.mockReset();
  jest
    .spyOn(Image, "getSize")
    .mockImplementation((_uri, success: any) => success(200, 400));
});

test("the image is fitted and centred inside the drawing area", () => {
  expect(fitImage({ width: 300, height: 300 }, 0.5)).toEqual({
    x: 75,
    y: 0,
    width: 150,
    height: 300,
  });
  expect(fitImage({ width: 300, height: 300 }, 2)).toEqual({
    x: 0,
    y: 75,
    width: 300,
    height: 150,
  });
  expect(fitImage({ width: 0, height: 300 }, 1).width).toBe(0);
});

test("finger positions become fractions of the image", () => {
  const frame = { x: 75, y: 0, width: 150, height: 300 };
  expect(
    toStroke(
      [
        { x: 75, y: 0 },
        { x: 150, y: 150 },
      ],
      frame,
      "erase",
      0.06,
    ),
  ).toEqual({ mode: "erase", size: 0.06, points: [0, 0, 0.5, 0.5] });
});

// Drives the canvas's touch handlers the way React Native's responder does.
const paint = async (tree: ReactTestRenderer, points: number[][]) => {
  const canvas = tree.root.find(n => n.props.testID === "cutout-canvas");
  let time = 0;
  const event = ([x, y]: number[]) => ({
    nativeEvent: {
      locationX: x,
      locationY: y,
      touches: [],
      changedTouches: [],
    },
    touchHistory: {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: ++time,
      touchBank: [
        {
          touchActive: true,
          startPageX: x,
          startPageY: y,
          currentPageX: x,
          currentPageY: y,
          currentTimeStamp: time,
          previousPageX: x,
          previousPageY: y,
          previousTimeStamp: time,
        },
      ],
    },
  });
  act(() => {
    canvas.props.onStartShouldSetResponder(event(points[0]));
    canvas.props.onResponderGrant(event(points[0]));
    points
      .slice(1)
      .forEach(point => canvas.props.onResponderMove(event(point)));
  });
  await act(async () => canvas.props.onResponderRelease(event(points.at(-1)!)));
};

const open = (props: Partial<React.ComponentProps<typeof CutoutEditor>>) => {
  const onDone = jest.fn();
  const onCancel = jest.fn();
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <CutoutEditor
        visible
        image="UklGRcut"
        language={0}
        onCancel={onCancel}
        onDone={onDone}
        {...props}
      />,
    );
  });
  const canvas = tree.root.find(n => n.props.testID === "cutout-canvas");
  act(() =>
    canvas.props.onLayout({
      nativeEvent: { layout: { width: 300, height: 300 } },
    }),
  );
  return { tree, onDone, onCancel };
};
const pressable = (tree: ReactTestRenderer, label: string) =>
  tree.root.findAll(
    n => n.props.accessibilityLabel === label && !!n.props.onPress,
  )[0];
const photo = (tree: ReactTestRenderer) =>
  tree.root.findByType(Image).props.source.uri;

test("each stroke is applied when the finger lifts, and Undo steps back", async () => {
  const { tree, onDone } = open({ original: "/9j/photo" });
  mockEditCutout.mockResolvedValueOnce("UklGRone");
  await paint(tree, [
    [75, 0],
    [150, 150],
  ]);
  expect(mockEditCutout).toHaveBeenLastCalledWith("UklGRcut", "/9j/photo", [
    {
      mode: "erase",
      size: BRUSH_SIZES[1],
      points: [0, 0, 0.5, 0.5],
    },
  ]);
  expect(photo(tree)).toBe("data:image/webp;base64,UklGRone");
  act(() => pressable(tree, "Restore").props.onPress());
  act(() => pressable(tree, "Wide").props.onPress());
  mockEditCutout.mockResolvedValueOnce("UklGRtwo");
  await paint(tree, [[150, 150]]);
  expect(mockEditCutout).toHaveBeenLastCalledWith("UklGRone", "/9j/photo", [
    { mode: "restore", size: BRUSH_SIZES[2], points: [0.5, 0.5] },
  ]);
  act(() => pressable(tree, "Undo").props.onPress());
  expect(photo(tree)).toBe("data:image/webp;base64,UklGRone");
  act(() => pressable(tree, "Done").props.onPress());
  expect(onDone).toHaveBeenCalledWith("UklGRone");
});

test("without the original photo only Erase is offered", () => {
  const { tree } = open({});
  expect(pressable(tree, "Erase")).toBeDefined();
  expect(pressable(tree, "Restore")).toBeUndefined();
});

test("a failed stroke keeps the image and says so", async () => {
  const { tree, onCancel, onDone } = open({});
  mockEditCutout.mockResolvedValueOnce(undefined);
  await paint(tree, [[150, 150]]);
  expect(photo(tree)).toBe("data:image/webp;base64,UklGRcut");
  expect(JSON.stringify(tree.toJSON())).toContain("couldn't be applied");
  // Nothing changed, so Done just closes.
  act(() => pressable(tree, "Done").props.onPress());
  expect(onDone).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalled();
});
