import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Image, Modal } from "react-native";
import {
  BRUSH_SIZES,
  CutoutEditor,
  MAX_ZOOM,
  NO_ZOOM,
  clampZoom,
  fitImage,
  loupeSide,
  pinchZoom,
  toStroke,
  zoomedFrame,
} from "../components/CutoutEditor";

const mockEditCutout = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  ...jest.requireActual("../utils/backgroundRemoval"),
  editCutout: (...args: unknown[]) => mockEditCutout(...args),
}));
// Photo files and what they hold; Done saves the result as a new file.
const mockFiles: Record<string, string> = {
  "cut.webp": "UklGRcut",
  "shirt.jpg": "/9j/photo",
};
const mockSavePhoto = jest.fn(async (_data: string) => "saved.webp");
jest.mock("../utils/photoStore", () => ({
  photoUri: (name: string) => `file:///photos/${name}`,
  readPhoto: async (name: string) => mockFiles[name],
  savePhoto: (data: string) => mockSavePhoto(data),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select({ settings: { language: 0 } }),
}));
jest.mock("@react-navigation/native", () => ({ useNavigation: () => ({}) }));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
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

test("pinching zooms around the spot between the fingers, within limits", () => {
  const area = { width: 300, height: 300 };
  const frame = { x: 75, y: 0, width: 150, height: 300 };
  const start = { zoom: NO_ZOOM, center: { x: 150, y: 150 }, distance: 100 };
  // Fingers twice as far apart, still centred: 2× around the middle
  expect(pinchZoom(start, { x: 150, y: 150 }, 200, area, frame)).toEqual({
    scale: 2,
    x: -150,
    y: -150,
  });
  // Can't zoom out past the whole photo, nor in past the limit
  expect(pinchZoom(start, { x: 150, y: 150 }, 50, area, frame)).toEqual(
    NO_ZOOM,
  );
  expect(pinchZoom(start, { x: 150, y: 150 }, 5000, area, frame).scale).toBe(
    MAX_ZOOM,
  );
  // Panning can't push the photo off the middle of the canvas
  const panned = clampZoom({ scale: 2, x: 1000, y: 0 }, area, frame);
  expect(zoomedFrame(frame, panned).x).toBe(150);
});

test("the close-up moves to the right when the finger is under it", () => {
  expect(loupeSide({ x: 250, y: 50 })).toBe("left");
  expect(loupeSide({ x: 50, y: 250 })).toBe("left");
  expect(loupeSide({ x: 50, y: 50 })).toBe("right");
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

const open = async (
  props: Partial<React.ComponentProps<typeof CutoutEditor>>,
) => {
  const onDone = jest.fn();
  const onCancel = jest.fn();
  let tree!: ReactTestRenderer;
  // The editor reads the photo files before it can be painted on.
  await act(async () => {
    tree = create(
      <CutoutEditor
        visible
        image="cut.webp"
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
  const { tree, onDone } = await open({ original: "shirt.jpg" });
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
  await act(async () => pressable(tree, "Done").props.onPress());
  // The edited cutout is saved as a new photo file.
  expect(mockSavePhoto).toHaveBeenCalledWith("UklGRone");
  expect(onDone).toHaveBeenCalledWith("saved.webp");
});

test("while painting a close-up shows; after a pinch strokes are finer and land on the zoomed photo", async () => {
  const { tree, onDone } = await open({});
  const canvas = () => tree.root.find(n => n.props.testID === "cutout-canvas");
  const loupe = () =>
    tree.root.findAll(
      n => n.props.testID === "cutout-loupe" && typeof n.type === "string",
    );
  const touch = (x: number, y: number) => ({
    locationX: x,
    locationY: y,
    pageX: x,
    pageY: y,
  });
  // The responder skips moves it has already seen, so time moves on.
  let time = 0;
  const history = () => {
    time += 1;
    return {
      numberActiveTouches: 1,
      indexOfSingleActiveTouch: 0,
      mostRecentTimeStamp: time,
      touchBank: [
        {
          touchActive: true,
          startPageX: 0,
          startPageY: 0,
          currentPageX: 0,
          currentPageY: 0,
          currentTimeStamp: time,
          previousPageX: 0,
          previousPageY: 0,
          previousTimeStamp: time,
        },
      ],
    };
  };
  const event = (touches: { x: number; y: number }[]) => ({
    nativeEvent: {
      ...touch(touches[0].x, touches[0].y),
      touches: touches.map(t => touch(t.x, t.y)),
      changedTouches: [],
    },
    touchHistory: history(),
  });
  // One finger: the close-up shows while it is down
  act(() => {
    canvas().props.onStartShouldSetResponder(event([{ x: 150, y: 200 }]));
    canvas().props.onResponderGrant(event([{ x: 150, y: 200 }]));
  });
  expect(loupe()).toHaveLength(1);
  // A second finger turns it into a pinch: no stroke, no close-up
  act(() => {
    canvas().props.onResponderMove(
      event([
        { x: 100, y: 150 },
        { x: 200, y: 150 },
      ]),
    );
    canvas().props.onResponderMove(
      event([
        { x: 50, y: 150 },
        { x: 250, y: 150 },
      ]),
    );
  });
  expect(loupe()).toHaveLength(0);
  await act(async () =>
    canvas().props.onResponderRelease(event([{ x: 250, y: 150 }])),
  );
  expect(mockEditCutout).not.toHaveBeenCalled();
  expect(pressable(tree, "Show the whole photo")).toBeDefined();
  // Zoomed 2× around the middle: the middle of the screen is still the
  // middle of the photo, and the brush is half as wide on the photo.
  mockEditCutout.mockResolvedValueOnce("UklGRzoomed");
  await paint(tree, [[150, 150]]);
  expect(mockEditCutout).toHaveBeenLastCalledWith("UklGRcut", undefined, [
    { mode: "erase", size: BRUSH_SIZES[1] / 2, points: [0.5, 0.5] },
  ]);
  act(() => pressable(tree, "Show the whole photo").props.onPress());
  expect(pressable(tree, "Show the whole photo")).toBeUndefined();
  await act(async () => pressable(tree, "Done").props.onPress());
  expect(mockSavePhoto).toHaveBeenCalledWith("UklGRzoomed");
  expect(onDone).toHaveBeenCalledWith("saved.webp");
});

test("without the original photo only Erase is offered", async () => {
  const { tree } = await open({});
  expect(pressable(tree, "Erase")).toBeDefined();
  expect(pressable(tree, "Restore")).toBeUndefined();
});

test("a failed stroke keeps the image and says so", async () => {
  const { tree, onCancel, onDone } = await open({});
  mockEditCutout.mockResolvedValueOnce(undefined);
  await paint(tree, [[150, 150]]);
  expect(photo(tree)).toBe("data:image/webp;base64,UklGRcut");
  expect(JSON.stringify(tree.toJSON())).toContain("couldn't be applied");
  // Nothing changed, so Done just closes.
  await act(async () => pressable(tree, "Done").props.onPress());
  expect(onDone).not.toHaveBeenCalled();
  expect(onCancel).toHaveBeenCalled();
});

test("closing with strokes applied asks first; without them it just closes", async () => {
  const { tree, onCancel } = await open({});
  const dialog = () => tree.root.findByType("ConfirmationDialog" as any);
  const modal = () => tree.root.findByType(Modal);
  // Nothing painted yet: ✕ and Back close at once.
  act(() => pressable(tree, "Cancel").props.onPress());
  act(() => modal().props.onRequestClose());
  expect(onCancel).toHaveBeenCalledTimes(2);
  expect(dialog().props.visible).toBe(false);
  mockEditCutout.mockResolvedValueOnce("UklGRone");
  await paint(tree, [[150, 150]]);
  act(() => modal().props.onRequestClose());
  expect(dialog().props.visible).toBe(true);
  expect(dialog().props.title).toBe("Discard changes?");
  expect(onCancel).toHaveBeenCalledTimes(2);
  // Keep editing keeps the stroke.
  act(() => dialog().props.setVisible(false));
  expect(dialog().props.visible).toBe(false);
  expect(photo(tree)).toBe("data:image/webp;base64,UklGRone");
  act(() => pressable(tree, "Cancel").props.onPress());
  act(() => dialog().props.onConfirm());
  expect(onCancel).toHaveBeenCalledTimes(3);
});
