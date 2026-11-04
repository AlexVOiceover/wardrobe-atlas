import { cardDensity, gridCellLayout } from "../components/GarmentGrid";
import { sampleSegment, normalizeHex } from "../utils/photoColor";

test.each([
  [1, "full"],
  [2, "full"],
  [3, "name"],
  [4, "name"],
  [5, "photo"],
  [6, "photo"],
])("%i columns show %s cards", (columns, density) => {
  expect(cardDensity(columns)).toBe(density);
});

test("grid cells fill the row exactly, and 2 columns keep today's 48% cells", () => {
  expect(gridCellLayout(2).width).toBe(48);
  [1, 2, 3, 4, 5, 6].forEach(columns => {
    const { width, gap } = gridCellLayout(columns);
    expect(width * columns + gap * (columns - 1)).toBeCloseTo(100);
  });
});

test("taps map to a small square of the photo, kept inside near the edges", () => {
  expect(sampleSegment(100, 50, 200, 200)).toEqual({
    fromX: 49,
    toX: 52,
    fromY: 24,
    toY: 27,
  });
  expect(sampleSegment(0, 0, 200, 100)).toEqual({
    fromX: 0,
    toX: 3,
    fromY: 0,
    toY: 3,
  });
  expect(sampleSegment(200, 100, 200, 100)).toEqual({
    fromX: 97,
    toX: 100,
    fromY: 97,
    toY: 100,
  });
  expect(sampleSegment(-5, 500, 200, 100)).toEqual({
    fromX: 0,
    toX: 3,
    fromY: 97,
    toY: 100,
  });
});

test("sampled colors are normalized to #RRGGBB", () => {
  expect(normalizeHex("#1f2a44")).toBe("#1F2A44");
  expect(normalizeHex("FF1F2A44")).toBe("#1F2A44");
  expect(normalizeHex("#abc")).toBe("#ABC");
});
