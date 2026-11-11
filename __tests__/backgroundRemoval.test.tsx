import { NativeModules } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { isCutout, removeBackground } from "../utils/backgroundRemoval";

const fs = ReactNativeBlobUtil.fs as unknown as Record<string, jest.Mock>;
const PHOTO = "shirt.jpg";
const WEBP = "UklGRcutout";
const native = (impl: (image: string) => Promise<string>) => {
  NativeModules.WardrobeBackground = { removeBackground: jest.fn(impl) };
  return NativeModules.WardrobeBackground.removeBackground as jest.Mock;
};
const failWith = (code: string) => () =>
  Promise.reject(Object.assign(new Error(code), { code }));

beforeEach(() => {
  fs.readFile.mockResolvedValue("/9j/photo");
  fs.writeFile.mockClear();
});
afterEach(() => {
  delete NativeModules.WardrobeBackground;
});

test("cutouts are WebP photo files", () => {
  expect(isCutout("k3x9-ab12.webp")).toBe(true);
  expect(isCutout(PHOTO)).toBe(false);
  expect(isCutout(undefined)).toBe(false);
});

test("the photo file goes to the native tool and the cutout comes back as a new WebP file", async () => {
  expect(await removeBackground(PHOTO)).toEqual({ error: "unsupported" });
  const remove = native(async () => WEBP);
  const result = await removeBackground(PHOTO);
  expect(fs.readFile).toHaveBeenCalledWith("/docs/photos/shirt.jpg", "base64");
  expect(remove).toHaveBeenCalledWith("/9j/photo");
  expect(result).toEqual({ image: expect.stringMatching(/\.webp$/) });
  const saved = (result as { image: string }).image;
  expect(fs.writeFile).toHaveBeenCalledWith(
    `/docs/photos/${saved}`,
    WEBP,
    "base64",
  );
  expect(saved).not.toBe(PHOTO);
});

test("each failure reason is passed on", async () => {
  for (const [code, error] of [
    ["PREPARING", "preparing"],
    ["NO_SUBJECT", "noSubject"],
    ["UNSUPPORTED", "unsupported"],
    ["OTHER", "failed"],
  ]) {
    native(failWith(code));
    expect(await removeBackground(PHOTO)).toEqual({ error });
  }
});
