import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ActiveFilters } from "../components/ActiveFilters";
import { garmentName } from "../utils/garmentName";
import { HomeFilter } from "../utils/filters";
import type { item } from "../redux/itemsSlice";

jest.mock("react-native-vector-icons/Ionicons", () => "Icon");

test("garment names read Color Brand Type and skip missing parts", () => {
  expect(
    garmentName({
      primaryColor: "#1F2A44",
      brand: " Benetton ",
      typeLabel: "Sweater",
      language: 0,
    }),
  ).toBe("Navy Benetton Sweater");
  expect(
    garmentName({ primaryColor: "#1F2A44", typeLabel: "Jersey", language: 1 }),
  ).toBe("Azul marino Jersey");
  expect(garmentName({ brand: "Zara", typeLabel: "Coat", language: 0 })).toBe(
    "Zara Coat",
  );
  expect(garmentName({ language: 0 })).toBe("");
});

test("sorting by purchase date puts garments without a date last", () => {
  const garment = (id: string, purchaseDate?: string) =>
    ({ id, name: id, category: 0, type: "", purchaseDate } as item);
  const garments = [
    garment("none"),
    garment("late", '"2026-05-01"'),
    garment("empty", ""),
    garment("early", '"2025-01-01"'),
  ];
  const sorted = (sortValue: string) =>
    HomeFilter(
      { sortValue, categories: [], types: [], season: "", colors: [] },
      [...garments],
      false,
    ).map(g => g.id);
  expect(sorted("PDA")).toEqual(["early", "late", "none", "empty"]);
  expect(sorted("PDD")).toEqual(["late", "early", "none", "empty"]);
});

test("active filters show as removable chips, and Clear all keeps the sort", () => {
  const actions = {
    setSortValue: jest.fn(),
    setSeasonFilter: jest.fn(),
    setCategoriesFilter: jest.fn(),
    setTypeFilter: jest.fn(),
    setColorFilter: jest.fn(),
  };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <ActiveFilters
        filterState={{
          sortValue: "NA",
          seasonFilter: "Summer",
          categoriesFilter: [4],
          TypeFilter: ["linen"],
          colorFilter: ["navy"],
        }}
        filterActions={actions}
        CategoriesList={[{ label: "Hats", value: 4 }]}
        storedCatTypes={[
          {},
          {},
          {},
          {},
          { customTypes: [{ label: "Linen hat", value: "linen" }] },
        ]}
        language={0}
      />,
    );
  });
  const buttons = () =>
    tree.root.findAll(
      n =>
        n.props.accessibilityRole === "button" &&
        n.parent?.props.accessibilityRole !== "button",
    );
  expect(buttons().map(b => b.props.accessibilityLabel)).toEqual([
    "Remove filter: Hats",
    "Remove filter: Linen hat",
    "Remove filter: Summer",
    "Remove filter: Navy",
    "Clear all",
  ]);
  act(() => buttons()[3].props.onPress());
  expect(actions.setColorFilter.mock.calls[0][0](["navy", "red"])).toEqual([
    "red",
  ]);
  act(() => buttons()[4].props.onPress());
  expect(actions.setCategoriesFilter).toHaveBeenCalledWith([]);
  expect(actions.setTypeFilter).toHaveBeenCalledWith([]);
  expect(actions.setSeasonFilter).toHaveBeenCalledWith("");
  expect(actions.setColorFilter).toHaveBeenLastCalledWith([]);
  expect(actions.setSortValue).not.toHaveBeenCalled();
});

test("no chips when no filter is active", () => {
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <ActiveFilters
        filterState={{
          sortValue: "NA",
          seasonFilter: "",
          categoriesFilter: [],
          TypeFilter: [],
          colorFilter: [],
        }}
        filterActions={{} as any}
        CategoriesList={[]}
        storedCatTypes={[]}
        language={0}
      />,
    );
  });
  expect(tree.toJSON()).toBeNull();
});
