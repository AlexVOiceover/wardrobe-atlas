import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { ClosetInfo } from "../screens/stackNav/ClosetInfo";
import {
  WardrobeProvider,
  useWardrobeView,
} from "../components/WardrobeSelector";
import { SelectionBar } from "../components/SelectionBar";
import { visibleGarments } from "../components/ClosetSections";
import { topUsed, daysAgo } from "../utils/closetStats";
import { formatDate, formatDateTime } from "../utils/dates";
import { filterItemsBySearch } from "../utils/filters";
import {
  closetSortOptions,
  normalizeClosetSort,
  SORT_ICON,
} from "../utils/sorts";
import { localization } from "../utils/localization";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({
  Button: "Button",
  RadioButton: { Group: "RadioGroup", Item: "RadioItem" },
}));
jest.mock("../components/PageHeader", () => ({
  PageHeader: "PageHeader",
  HeaderIcon: "HeaderIcon",
}));

const now = Date.now();
const day = 24 * 60 * 60 * 1000;
const log = (eventId: string, daysBack: number) => ({
  eventId,
  eventName: eventId,
  eventDate: JSON.stringify(new Date(now - daysBack * day)),
  logTime: "",
});
const garment = (id: string, logIds: string[], wardrobeId?: string) =>
  ({
    id,
    name: id,
    type: "Shirt",
    image: "",
    category: 0,
    logIds,
    wardrobeId,
    collection: [],
  } as any);
const logs = [
  log("a", 1),
  log("b", 2),
  log("c", 3),
  log("old1", 60),
  log("old2", 70),
];
// "often" is worn most overall, but "recent" most in the last 30 days.
const items = [
  garment("often", ["a", "old1", "old2"], "home"),
  garment("recent", ["b", "c"], "work"),
  garment("never", []),
];
const mockState: any = {
  settings: { language: 0 },
  CategoryList: { Categories: [], CategoryCustomTypes: [] },
  itemsList: {
    wardrobes: [
      { id: "home", name: "Home" },
      { id: "work", name: "Work" },
    ],
    items,
    logs,
    collectionTags: [{ label: "Trip", value: "trip", isOpen: true }],
  },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => jest.fn(),
}));

test("top garments of the last 30 days rank by uses within that period", () => {
  expect(topUsed(items, logs).map(g => g.id)).toEqual(["often", "recent"]);
  expect(topUsed(items, logs, { since: daysAgo(30) }).map(g => g.id)).toEqual([
    "recent",
    "often",
  ]);
});

test("Closet info follows the Closet's wardrobe, says which, and opens a garment", () => {
  let view!: ReturnType<typeof useWardrobeView>;
  const Probe = () => {
    view = useWardrobeView();
    return null;
  };
  let tree!: ReactTestRenderer;
  act(() => {
    tree = create(
      <WardrobeProvider>
        <Probe />
        <ClosetInfo />
      </WardrobeProvider>,
    );
  });
  const text = () => JSON.stringify(tree.toJSON());
  expect(text()).toContain("All wardrobes");
  expect(text()).toContain("Top 5, last 30 days");
  expect(text()).toContain("Outfits");
  act(() => view.select("work"));
  expect(text()).toContain("Wardrobe: Work");
  expect(text()).not.toContain('"often"');
  act(() =>
    tree.root
      .findAll(
        n => n.props.accessibilityLabel === "recent" && !!n.props.onPress,
      )[0]
      .props.onPress(),
  );
  expect(mockNavigate).toHaveBeenCalledWith("ItemForm", {
    editingIndex: "recent",
  });
});

test("dates use month names in the app's language and 24-hour time", () => {
  const date = new Date(2026, 8, 5, 21, 7);
  expect(formatDate(date, 0)).toBe("5 Sep 2026");
  expect(formatDate(date, 1)).toBe("5 sep 2026");
  expect(formatDateTime(date, 0)).toBe("Sat 5 Sep 2026 · 21:07");
  expect(formatDateTime(date, 1)).toBe("sáb 5 sep 2026 · 21:07");
});

test("search matches name, brand, subcategory in both languages and collections", () => {
  const shirt = {
    ...garment("s", []),
    name: "Blue",
    brand: "Uniqlo",
    collection: ["trip"],
  };
  const context = {
    categoryState: { Categories: [], CategoryCustomTypes: [] } as any,
    collectionTags: [{ label: "Beach trip", value: "trip" }],
  };
  ["blue", "UNIQLO", "shirt", "camisa", "beach"].forEach(query =>
    expect(filterItemsBySearch([shirt], query, context)).toHaveLength(1),
  );
  expect(filterItemsBySearch([shirt], "boots", context)).toHaveLength(0);
});

test("one Store/Unstore button and Select all / Deselect all", () => {
  const render = (storing: boolean, allSelected: boolean, language = 0) => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(
        <SelectionBar
          count={2}
          language={language}
          storing={storing}
          allSelected={allSelected}
          onClose={jest.fn()}
          onSelectAll={jest.fn()}
          onStore={jest.fn()}
          onLog={jest.fn()}
          onMove={jest.fn()}
        />,
      );
    });
    return tree.root
      .findAll(n => n.props.accessibilityRole === "button" && !!n.props.onPress)
      .map(n => n.props.accessibilityLabel);
  };
  expect(render(true, false)).toEqual([
    "Stop selecting",
    "Select all",
    "Store",
    "Log use",
    "Move",
  ]);
  expect(render(false, true, 1)).toEqual([
    "Dejar de seleccionar",
    "Deseleccionar todo",
    "Sacar del almacén",
    "Registrar uso",
    "Mover",
  ]);
});

test("visible garments leave out folded sections and type headings", () => {
  const sections = [
    {
      key: "c:0",
      label: "Tops",
      count: 2,
      types: [
        { key: "c:0|t:Shirt", label: "Shirt", garments: [items[0]] },
        { key: "c:0|t:Tee", label: "Tee", garments: [items[1]] },
      ],
    },
    {
      key: "c:other",
      label: "Other",
      count: 1,
      types: [{ key: "c:other|t:other", label: "", garments: [items[2]] }],
    },
  ];
  expect(visibleGarments(sections, []).map(g => g.id)).toEqual([
    "often",
    "recent",
    "never",
  ]);
  expect(
    visibleGarments(sections, ["c:0|t:Tee", "c:other"]).map(g => g.id),
  ).toEqual(["often"]);
});

test("sorts: unknown stored values fall back, labels are sentence case, one icon", () => {
  expect(normalizeClosetSort(undefined)).toBe("LA");
  expect(closetSortOptions(0)[0]).toEqual({ value: "LA", label: "Last added" });
  expect(SORT_ICON).toBe("swap-vertical-outline");
  // Glossary: no "item", "artículo", "atuendo" or "evento" in the UI.
  const all = Object.values(localization).flat().join(" ");
  expect(all).not.toMatch(/\bitem\b|artículo|atuendo|evento|seleccione/i);
});
