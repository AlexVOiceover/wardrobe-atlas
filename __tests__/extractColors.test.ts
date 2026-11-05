import { extractColors } from "../utils/extractColors";

const mockPalette = jest.fn();
jest.mock("@somesoap/react-native-image-palette", () => ({
  getPalette: (uri: string) => mockPalette(uri),
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
const mockCutoutColors = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  ...jest.requireActual("../utils/backgroundRemoval"),
  cutoutColors: (image: string) => mockCutoutColors(image),
}));

test("a photo gives up to three different colors, most important first", async () => {
  mockPalette.mockResolvedValueOnce({
    dominant: "#111111",
    muted: "#222222",
    darkVibrant: "#333333",
  });
  expect(await extractColors("/9j/photo")).toEqual([
    "#111111",
    "#222222",
    "#333333",
  ]);
  // Repeats count once, and nothing is made up for missing ones
  mockPalette.mockResolvedValueOnce({ dominant: "#AAAAAA", muted: "#aaaaaa" });
  expect(await extractColors("/9j/photo")).toEqual(["#AAAAAA"]);
});

test("a cut-out uses only the garment's colors", async () => {
  mockCutoutColors.mockResolvedValueOnce(["#C8B49A", "#123456"]);
  expect(await extractColors("UklGRcut")).toEqual(["#C8B49A", "#123456"]);
  expect(mockPalette).not.toHaveBeenCalledWith(expect.stringContaining("cut"));
});

test("no photo or an unreadable one gives no colors", async () => {
  expect(await extractColors("")).toEqual([]);
  mockPalette.mockRejectedValueOnce(new Error("bad"));
  jest.spyOn(console, "log").mockImplementation(() => {});
  expect(await extractColors("/9j/photo")).toEqual([]);
});
