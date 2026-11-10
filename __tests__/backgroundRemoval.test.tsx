import { NativeModules } from "react-native";
import { isCutout, removeBackground } from "../utils/backgroundRemoval";

const JPEG = "/9j/photo";
const WEBP = "UklGRcutout";
const native = (impl: (image: string) => Promise<string>) => {
  NativeModules.WardrobeBackground = { removeBackground: jest.fn(impl) };
  return NativeModules.WardrobeBackground.removeBackground as jest.Mock;
};
const failWith = (code: string) => () =>
  Promise.reject(Object.assign(new Error(code), { code }));

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
