import React from "react";
import { StyleSheet } from "react-native";
import { HeaderIcon, PageHeader } from "../components/PageHeader";
import { theme } from "../utils/theme";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { Category } from "../screens/stackNav/Category";
import { ManageCategories } from "../screens/stackNav/ManageCategories";
import { More } from "../screens/bottomNav/More";
import HomeFilterPanel, {
  resetHomeFilters,
} from "../screens/bottomNav/HomeFilterPanel";
import { activeFilterCount } from "../utils/filters";

const mockNavigate = jest.fn();
const mockDispatch = jest.fn();
const mockState: any = {
  settings: { language: 1 },
  CategoryList: {
    Categories: [{ index: 4, name: ["Hats"], screen: "ItemForm" }],
  },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button", Switch: "Switch" }));
jest.mock("../components/ConfirmationDialog", () => ({
  ConfirmationDialog: "ConfirmationDialog",
}));

beforeEach(() => {
  mockNavigate.mockClear();
  mockDispatch.mockClear();
});

const render = (element: React.ReactElement) => {
  let tree: ReactTestRenderer;
  act(() => {
    tree = create(element);
  });
  return tree!;
};
const pressable = (tree: ReactTestRenderer, label: string) =>
  tree.root.find(
    x => x.props.accessibilityLabel === label && !!x.props.onPress,
  );

test("choosing a category goes straight to the form, or to bulk entry when switched on", () => {
  const tree = render(<Category />);
  act(() => pressable(tree, "Zapatos").props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith("ItemForm", {
    selectedCategory: 2,
  });
  act(() => tree.root.findByType("Switch" as any).props.onValueChange(true));
  act(() => pressable(tree, "Hats").props.onPress());
  expect(mockNavigate).toHaveBeenLastCalledWith("BulkModeForm", {
    selectedCategory: 4,
  });
});

test("More reaches every management screen", () => {
  const tree = render(<More navigation={{ navigate: mockNavigate }} />);
  ["Armarios", "Colecciones", "Categorías", "Información del armario"].forEach(
    label => act(() => pressable(tree, label).props.onPress()),
  );
  act(() => pressable(tree, "Configuración").props.onPress());
  expect(mockNavigate.mock.calls.map(call => call[0])).toEqual([
    "Wardrobes",
    "CollectionForm",
    "ManageCategories",
    "ClosetInfo",
    "Settings",
  ]);
});

test("custom categories are only deleted after confirmation; built-in ones cannot be", () => {
  const tree = render(<ManageCategories />);
  expect(
    tree.root.findAll(x => x.props.accessibilityLabel === "Borrar: Tops"),
  ).toHaveLength(0);
  const dialog = () => tree.root.findByType("ConfirmationDialog" as any);
  expect(dialog().props.visible).toBe(false);
  act(() => pressable(tree, "Borrar: Hats").props.onPress());
  expect(dialog().props.visible).toBe(true);
  expect(mockDispatch).not.toHaveBeenCalled();
  act(() => dialog().props.onConfirm());
  expect(mockDispatch).toHaveBeenCalledWith({
    type: "CategoryList/delCategory",
    payload: { index: 4 },
  });
});

test("Reset clears sort, category, type, season and color together", () => {
  const actions = {
    setSortValue: jest.fn(),
    setSeasonFilter: jest.fn(),
    setCategoriesFilter: jest.fn(),
    setTypeFilter: jest.fn(),
    setColorFilter: jest.fn(),
  };
  resetHomeFilters(actions);
  expect(actions.setSortValue).toHaveBeenCalledWith("LA");
  expect(actions.setSeasonFilter).toHaveBeenCalledWith("");
  expect(actions.setCategoriesFilter).toHaveBeenCalledWith([]);
  expect(actions.setTypeFilter).toHaveBeenCalledWith([]);
  expect(actions.setColorFilter).toHaveBeenCalledWith([]);
});

test("filter panel keeps one Reset, translates chips and shows types for a single category", () => {
  const setCategoriesFilter = jest.fn();
  const tree = render(
    <HomeFilterPanel
      filterState={{
        sortValue: "LA",
        seasonFilter: "",
        categoriesFilter: [0],
        TypeFilter: [],
        colorFilter: [],
      }}
      filterActions={
        {
          setSortValue: jest.fn(),
          setSeasonFilter: jest.fn(),
          setCategoriesFilter,
          setTypeFilter: jest.fn(),
          setColorFilter: jest.fn(),
        } as any
      }
      CategoriesList={[
        { label: "Tops", value: 0 },
        { label: "Zapatos", value: 2 },
      ]}
      language={1}
      storedCatTypes={[]}
    />,
  );
  expect(tree.root.findAllByType("Button" as any)).toHaveLength(1);
  expect(pressable(tree, "Verano")).toBeTruthy();
  expect(pressable(tree, "Camisa")).toBeTruthy();
  expect(pressable(tree, "Azul")).toBeTruthy();
  act(() => pressable(tree, "Zapatos").props.onPress());
  expect(setCategoriesFilter).toHaveBeenCalledWith([0, 2]);
});

test("the filter badge counts active filters but not the sort order", () => {
  expect(
    activeFilterCount({
      seasonFilter: "",
      categoriesFilter: [],
      TypeFilter: [],
      colorFilter: [],
    }),
  ).toBe(0);
  expect(
    activeFilterCount({
      seasonFilter: "Winter",
      categoriesFilter: [0],
      TypeFilter: ["Shirt"],
      colorFilter: ["red", "blue"],
    }),
  ).toBe(5);
});

test("page headers use the accent bar with readable icons and title", () => {
  const tree = render(
    <PageHeader
      title="Settings"
      actions={
        <HeaderIcon name="add" label="Add" badge={2} onPress={jest.fn()} />
      }
    />,
  );
  const bar = tree.root.findAll(
    n =>
      StyleSheet.flatten(n.props.style)?.backgroundColor === theme.colors.bar,
  );
  expect(bar.length).toBeGreaterThan(0);
  tree.root
    .findAllByType("Icon" as any)
    .forEach(icon => expect(icon.props.color).toBe(theme.colors.onBar));
  const title = tree.root.findAll(
    n => typeof n.type === "string" && n.props.children === "Settings",
  )[0];
  expect(StyleSheet.flatten(title.props.style).color).toBe(theme.colors.onBar);
  expect(title.props.numberOfLines).toBe(1);
});
