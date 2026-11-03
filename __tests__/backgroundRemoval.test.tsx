import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { NativeModules } from "react-native";
import { isCutout, removeBackground } from "../utils/backgroundRemoval";
import { BulkBackgroundRemoval } from "../components/BulkBackgroundRemoval";

const mockDispatch = jest.fn();
const mockState: any = { itemsList: { items: [] } };
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-paper", () => ({ Button: "Button" }));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const JPEG = "/9j/photo";
const WEBP = "UklGRcutout";
const native = (impl: (image: string) => Promise<string>) => {
  NativeModules.WardrobeBackground = { removeBackground: jest.fn(impl) };
  return NativeModules.WardrobeBackground.removeBackground as jest.Mock;
};
const failWith = (code: string) => () =>
  Promise.reject(Object.assign(new Error(code), { code }));

beforeEach(() => mockDispatch.mockClear());
afterEach(() => {
  delete NativeModules.WardrobeBackground;
});

test("cutouts are recognised by their WebP header", () => {
  expect(isCutout(WEBP)).toBe(true);
  expect(isCutout(JPEG)).toBe(false);
  expect(isCutout(undefined)).toBe(false);
});

test("the native result and each failure reason are passed on", async () => {
  expect(await removeBackground(JPEG)).toEqual({ error: "unsupported" });
  native(async () => WEBP);
  expect(await removeBackground(JPEG)).toEqual({ image: WEBP });
  for (const [code, error] of [
    ["PREPARING", "preparing"],
    ["NO_SUBJECT", "noSubject"],
    ["UNSUPPORTED", "unsupported"],
    ["OTHER", "failed"],
  ]) {
    native(failWith(code));
    expect(await removeBackground(JPEG)).toEqual({ error });
  }
});

describe("removing every background from Settings", () => {
  const render = () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<BulkBackgroundRemoval language={0} />);
    });
    return tree;
  };
  const start = async (tree: ReactTestRenderer) => {
    act(() => tree.root.findByType("Button" as any).props.onPress());
    const dialog = tree.root.findByType("ConfirmationDialog" as any);
    await act(async () => dialog.props.onConfirm());
    return dialog;
  };
  const text = (tree: ReactTestRenderer) => JSON.stringify(tree.toJSON());

  test("asks first, skips cut-out and photo-less garments, saves each one and counts failures", async () => {
    mockState.itemsList.items = [
      { id: "a", image: JPEG },
      { id: "b", image: WEBP },
      { id: "c", image: "" },
      { id: "d", image: "/9j/bad" },
    ];
    const remove = native(image =>
      image === "/9j/bad" ? failWith("NO_SUBJECT")() : Promise.resolve(WEBP),
    );
    const tree = render();
    act(() => tree.root.findByType("Button" as any).props.onPress());
    const dialog = tree.root.findByType("ConfirmationDialog" as any);
    expect(dialog.props.visible).toBe(true);
    expect(dialog.props.message).toContain("photos of 2 garments");
    expect(remove).not.toHaveBeenCalled();
    await act(async () => dialog.props.onConfirm());
    expect(remove.mock.calls.map(call => call[0])).toEqual([JPEG, "/9j/bad"]);
    expect(mockDispatch.mock.calls).toEqual([
      [
        {
          type: "itemsList/setGarmentImage",
          payload: { id: "a", image: WEBP },
        },
      ],
    ]);
    expect(text(tree)).toContain(
      "Backgrounds removed: 1. 1 couldn't be processed.",
    );
  });

  test("Stop keeps the finished garments and ends the run", async () => {
    mockState.itemsList.items = [
      { id: "a", image: JPEG },
      { id: "b", image: JPEG },
      { id: "c", image: JPEG },
    ];
    let release!: () => void;
    native(
      () =>
        new Promise(resolve => {
          release = () => resolve(WEBP);
        }),
    );
    const tree = render();
    act(() => tree.root.findByType("Button" as any).props.onPress());
    const dialog = tree.root.findByType("ConfirmationDialog" as any);
    act(() => {
      dialog.props.onConfirm();
    });
    expect(text(tree)).toContain("Removing backgrounds: 0 / 3");
    act(() =>
      tree.root
        .findAllByType("Button" as any)
        .find(b => b.props.children === "Stop")!
        .props.onPress(),
    );
    await act(async () => release());
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(text(tree)).toContain("Backgrounds removed: 1.");
  });

  test("stops at once while the model is still downloading", async () => {
    mockState.itemsList.items = [
      { id: "a", image: JPEG },
      { id: "b", image: JPEG },
    ];
    const remove = native(failWith("PREPARING"));
    const tree = render();
    await start(tree);
    expect(remove).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(text(tree)).toContain("getting ready");
  });

  test("says so when every photo is already cut out", () => {
    mockState.itemsList.items = [{ id: "a", image: WEBP }];
    const tree = render();
    act(() => tree.root.findByType("Button" as any).props.onPress());
    expect(
      tree.root.findByType("ConfirmationDialog" as any).props.visible,
    ).toBe(false);
    expect(text(tree)).toContain("Every photo is already cut out.");
  });
});
