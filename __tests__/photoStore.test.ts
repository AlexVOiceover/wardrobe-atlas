import ReactNativeBlobUtil from "react-native-blob-util";
import {
  isPhotoFile,
  photoUri,
  removeUnusedPhotos,
  savePhoto,
  savePhotoFile,
} from "../utils/photoStore";

const fs = ReactNativeBlobUtil.fs as unknown as Record<string, jest.Mock>;

beforeEach(() => Object.values(fs).forEach(f => f.mockClear?.()));

test("only names this app makes count as photos, never paths", () => {
  expect(isPhotoFile("lq3k9-ab12cd34.webp")).toBe(true);
  expect(isPhotoFile("lq3k9-ab12cd34.jpg")).toBe(true);
  expect(isPhotoFile("../lq3k9.jpg")).toBe(false);
  expect(isPhotoFile("photos/lq3k9.jpg")).toBe(false);
  expect(isPhotoFile("/9j/4AAQSkZJRg")).toBe(false);
  expect(isPhotoFile("")).toBe(false);
});

test("a photo is shown from its file in the app's photos folder", () => {
  expect(photoUri("a.jpg")).toBe("file:///docs/photos/a.jpg");
});

test("each saved image becomes a new file named by its type, creating the folder once", async () => {
  fs.isDir.mockResolvedValueOnce(false);
  const cutout = await savePhoto("UklGRcutout");
  expect(fs.mkdir).toHaveBeenCalledWith("/docs/photos");
  expect(cutout).toMatch(/^[\w-]+\.webp$/);
  expect(fs.writeFile).toHaveBeenCalledWith(
    `/docs/photos/${cutout}`,
    "UklGRcutout",
    "base64",
  );
  const photo = await savePhoto("/9j/photo");
  expect(photo).toMatch(/\.jpg$/);
  expect(photo).not.toBe(cutout);
  expect(fs.mkdir).toHaveBeenCalledTimes(1);
});

test("a resized photo file is copied in under a new name", async () => {
  const name = await savePhotoFile("file:///cache/resized.JPEG");
  expect(name).toMatch(/^[\w-]+\.jpg$/);
  expect(fs.cp).toHaveBeenCalledWith(
    "/cache/resized.JPEG",
    `/docs/photos/${name}`,
  );
});

test("photos no garment uses are deleted, the rest are kept", async () => {
  fs.ls.mockResolvedValueOnce(["used.jpg", "old.webp", "gone.jpg"]);
  await removeUnusedPhotos(["used.jpg", ""]);
  expect(fs.unlink.mock.calls.map(([path]) => path)).toEqual([
    "/docs/photos/old.webp",
    "/docs/photos/gone.jpg",
  ]);
});
