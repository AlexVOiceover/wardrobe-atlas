import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import ColorFilter from "../components/ColorFilter";
import { categorizeColor, clothingColors, NO_COLOR } from "../utils/colors";
import { HomeFilter } from "../utils/filters";
import { colorNames } from "../utils/localization";
import type { item } from "../redux/itemsSlice";

const mockState = { settings: { language: 0 } };
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
}));

test.each([
  ["#000000", "black"],
  ["#2E2E2E", "black"],
  ["#808080", "gray"],
  ["#C0C0C0", "gray"],
  ["#FFFFFF", "white"],
  ["#FFFFF0", "white"],
  ["#F5F5DC", "beige"],
  ["#E3D5B8", "beige"],
  ["#65432A", "brown"],
  ["#5D6532", "khaki"],
  ["#4CBB17", "green"],
  ["#000080", "navy"],
  ["#232B4A", "navy"],
  ["#0000FF", "blue"],
  ["#305CDE", "blue"],
  ["#9BC4E2", "lightBlue"],
  ["#702963", "purple"],
  ["#FFC0CB", "pink"],
  ["#FC8EAC", "pink"],
  ["#FF0000", "red"],
  ["#C21807", "red"],
  ["#800020", "burgundy"],
  ["#7C0A02", "burgundy"],
  ["#FFA500", "orange"],
  ["#FF6F00", "orange"],
  ["#FFE135", "yellow"],
])("%s is filed under %s", (hex, expected) => {
  expect(categorizeColor(hex)).toBe(expected);
});

test("short, lowercase and missing colors are handled", () => {
  expect(categorizeColor("#00f")).toBe("blue");
  expect(categorizeColor("000080")).toBe("navy");
  expect(categorizeColor("#f5f5dc")).toBe("beige");
  expect(categorizeColor("")).toBe(NO_COLOR);
  expect(categorizeColor("#zzz")).toBe(NO_COLOR);
  expect(categorizeColor(undefined as unknown as string)).toBe(NO_COLOR);
});

test("every filter color has an English and Spanish name", () => {
  expect(Object.keys(clothingColors)).toHaveLength(16);
  [...Object.keys(clothingColors), NO_COLOR].forEach(key =>
    colorNames.forEach(names => expect(names[key]).toBeTruthy()),
  );
});

const garment = (id: string, colors: Partial<item> = {}) =>
  ({ id, name: id, category: 0, type: "shirt", ...colors } as item);

test("the filter matches any of a garment's colors, and No color finds uncolored garments", () => {
  const coat = garment("coat", {
    primaryColor: "#14213D",
    secondaryColor: "#C8AD7F",
  });
  const tee = garment("tee", { primaryColor: "#FFFFFF" });
  const bare = garment("bare");
  const filter = (colors: string[]) =>
    HomeFilter(
      { sortValue: "LA", categories: [], types: [], seasons: [], colors },
      [coat, tee, bare],
      false,
    ).map(g => g.id);
  expect(filter(["navy"])).toEqual(["coat"]);
  expect(filter(["beige", "white"])).toEqual(["coat", "tee"]);
  expect(filter([NO_COLOR])).toEqual(["bare"]);
  expect(filter(["red"])).toEqual([]);
});

test("the filter offers the clothing palette and names the selected colors", () => {
  const setColors = jest.fn();
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <ColorFilter colors={["navy", "beige"]} setColors={setColors} />,
    );
  });
  const swatches = tree.root.findAll(
    n =>
      n.props.accessibilityRole === "button" &&
      n.parent?.props.accessibilityRole !== "button",
  );
  expect(swatches.map(s => s.props.accessibilityLabel)).toEqual([
    ...Object.keys(clothingColors).map(key => colorNames[0][key]),
    "No color",
  ]);
  expect(swatches.filter(s => s.props.accessibilityState.selected).length).toBe(
    2,
  );
  expect(
    tree.root.findAll(n => n.props.children === "Beige, Navy").length,
  ).toBeGreaterThan(0);
  act(() =>
    swatches.find(s => s.props.accessibilityLabel === "Red")!.props.onPress(),
  );
  expect(setColors.mock.calls[0][0](["navy"])).toEqual(["navy", "red"]);
});
