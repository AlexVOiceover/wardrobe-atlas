import { extractColors } from "../utils/extractColors";

const mockPalette = jest.fn();
jest.mock("@somesoap/react-native-image-palette", () => ({
  getPalette: (uri: string) => mockPalette(uri),
}));
const mockCutoutColors = jest.fn();
jest.mock("../utils/backgroundRemoval", () => ({
  ...jest.requireActual("../utils/backgroundRemoval"),
  cutoutColors: (image: string) => mockCutoutColors(image),
}));

beforeEach(() => mockPalette.mockReset());

test("a photo gives up to three different colors, most important first", async () => {
  mockPalette.mockResolvedValueOnce({
    dominant: "#111111",
    muted: "#222222",
    darkVibrant: "#333333",
  });
  expect(await extractColors("shirt.jpg")).toEqual([
    "#111111",
    "#222222",
    "#333333",
  ]);
  // The palette reads the photo file itself
  expect(mockPalette).toHaveBeenCalledWith("file:///docs/photos/shirt.jpg");
  // Repeats count once, and nothing is made up for missing ones
  mockPalette.mockResolvedValueOnce({ dominant: "#AAAAAA", muted: "#aaaaaa" });
  expect(await extractColors("shirt.jpg")).toEqual(["#AAAAAA"]);
});

test("a cut-out uses only the garment's colors", async () => {
  mockCutoutColors.mockResolvedValueOnce(["#C8B49A", "#123456"]);
  expect(await extractColors("cut.webp")).toEqual(["#C8B49A", "#123456"]);
  expect(mockCutoutColors).toHaveBeenCalledWith("cut.webp");
  expect(mockPalette).not.toHaveBeenCalled();
});

test("no photo or an unreadable one gives no colors", async () => {
  expect(await extractColors("")).toEqual([]);
  mockPalette.mockRejectedValueOnce(new Error("bad"));
  jest.spyOn(console, "log").mockImplementation(() => {});
  expect(await extractColors("shirt.jpg")).toEqual([]);
});
