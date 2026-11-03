import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ActiveFilters } from "../components/ActiveFilters";
import { garmentName } from "../utils/garmentName";
import { OptionalDateField } from "../components/OptionalDateField";
import { HomeFilter } from "../utils/filters";
import type { item } from "../redux/itemsSlice";

jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-modal-datetime-picker", () => "DateTimePickerModal");
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select({ settings: { language: 0 } }),
}));

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
    setCollectionFilter: jest.fn(),
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
          collectionFilter: ["work"],
        }}
        filterActions={actions}
        CategoriesList={[{ label: "Hats", value: 4 }]}
        categoryState={
          {
            Categories: [{ index: 4, name: ["Hats"] }],
            CategoryCustomTypes: [
              null,
              null,
              null,
              null,
              { customTypes: [{ label: "Linen hat", value: "linen" }] },
            ],
          } as any
        }
        collections={[{ label: "Work", value: "work" }]}
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
    "Remove filter: Work",
    "Clear all",
  ]);
  act(() => buttons()[3].props.onPress());
  expect(actions.setColorFilter.mock.calls[0][0](["navy", "red"])).toEqual([
    "red",
  ]);
  act(() => buttons()[5].props.onPress());
  expect(actions.setCategoriesFilter).toHaveBeenCalledWith([]);
  expect(actions.setTypeFilter).toHaveBeenCalledWith([]);
  expect(actions.setSeasonFilter).toHaveBeenCalledWith("");
  expect(actions.setColorFilter).toHaveBeenLastCalledWith([]);
  expect(actions.setCollectionFilter).toHaveBeenCalledWith([]);
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
          collectionFilter: [],
        }}
        filterActions={{} as any}
        CategoriesList={[]}
        categoryState={{ Categories: [], CategoryCustomTypes: [] } as any}
        collections={[]}
        language={0}
      />,
    );
  });
  expect(tree.toJSON()).toBeNull();
});

test("the optional date shows a dash until picked, and can be cleared", () => {
  const onChange = jest.fn();
  const field = (date?: Date) => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(
        <OptionalDateField
          label="Purchase Date"
          date={date}
          onChange={onChange}
        />,
      );
    });
    return tree;
  };
  const labels = (tree: ReactTestRenderer) =>
    tree.root
      .findAll(
        n =>
          n.props.accessibilityRole === "button" &&
          n.parent?.props.accessibilityRole !== "button",
      )
      .map(n => n.props.accessibilityLabel);
  const empty = field();
  expect(labels(empty)).toEqual(["Purchase Date: Not set"]);
  const picker = empty.root.findByType("DateTimePickerModal" as any);
  act(() => picker.props.onConfirm(new Date(2026, 9, 1)));
  expect(onChange).toHaveBeenCalledWith(new Date(2026, 9, 1));
  const set = field(new Date(2026, 9, 1));
  expect(labels(set)).toEqual(["Purchase Date: 01/10/2026", "Clear date"]);
  act(() =>
    set.root
      .findAll(
        n => n.props.accessibilityLabel === "Clear date" && n.props.onPress,
      )[0]
      .props.onPress(),
  );
  expect(onChange).toHaveBeenLastCalledWith(undefined);
});
