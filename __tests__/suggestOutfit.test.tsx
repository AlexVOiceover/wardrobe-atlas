import React from "react";
import { act, create, ReactTestRenderer } from "react-test-renderer";
import { defaultStyles } from "../utils/styles";
import { currentSeason, outfitCandidates } from "../utils/outfits";
import {
  createWardrobeBackup,
  readWardrobeBackup,
} from "../utils/wardrobeData";
import { SuggestOutfit } from "../screens/stackNav/SuggestOutfit";

const mockDispatch = jest.fn();
const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
const mockState: any = {
  settings: { language: 0 },
  itemsList: { items: [], logs: [], wardrobes: [] },
};
jest.mock("react-redux", () => ({
  useSelector: (select: Function) => select(mockState),
  useDispatch: () => mockDispatch,
}));
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => mockNavigation,
}));
jest.mock("nanoid", () => ({ nanoid: () => "outfit-1" }));
jest.mock("react-native-get-random-values", () => ({}));
jest.mock("react-native-vector-icons/Ionicons", () => "Icon");
jest.mock("react-native-paper", () => ({ Button: "Button", Switch: "Switch" }));
jest.mock("../components/PageHeader", () => ({ PageHeader: "PageHeader" }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const garment = (id: string, category: number, extra = {}) =>
  ({
    id,
    name: id,
    category,
    type: "",
    seasons: ["Summer"],
    styles: ["casual"],
    logIds: [],
    ...extra,
  } as any);
const event = (eventId: string, date: string) => ({
  eventId,
  eventName: "",
  eventDate: JSON.stringify(new Date(date)),
  logTime: "",
});

beforeEach(() => {
  mockDispatch.mockClear();
  mockNavigation.goBack.mockClear();
});

test("subcategories give default styles; underwear is never suggested", () => {
  expect(defaultStyles("Blazer")).toEqual(["elegant", "formal"]);
  expect(defaultStyles("Hoodie")).toEqual(["casual", "sporty"]);
  expect(defaultStyles("Running Shoes")).toEqual(["sporty"]);
  expect(defaultStyles("Underwear")).toEqual([]);
  expect(defaultStyles("My own type")).toEqual(["casual"]);
  expect(defaultStyles(undefined)).toEqual(["casual"]);
});

test("existing garments get their subcategory's styles on load; saved styles are kept", () => {
  const restored = readWardrobeBackup(
    JSON.parse(
      JSON.stringify(
        createWardrobeBackup({
          settings: {},
          CategoryList: {},
          itemsList: {
            items: [
              { id: "a", type: "Blazer" },
              { id: "b", type: "Blazer", styles: ["sporty", "party"] },
            ],
            logs: [],
          },
        }),
      ),
    ),
  );
  expect(restored.itemsList.items.map(g => g.styles)).toEqual([
    ["elegant", "formal"],
    ["sporty"],
  ]);
});

test("the season follows the calendar", () => {
  expect(
    ["2026-01-15", "2026-03-01", "2026-07-20", "2026-10-31", "2026-12-01"].map(
      date => currentSeason(new Date(date)),
    ),
  ).toEqual(["Winter", "Spring", "Summer", "Fall", "Winter"]);
});

test("candidates match category, storage, season and style; least worn come first", () => {
  const garments = [
    garment("worn-recently", 0),
    garment("worn-long-ago", 0),
    garment("never-worn", 0),
    garment("stored", 0, { stored: true }),
    garment("winter-only", 0, { seasons: ["Winter"] }),
    garment("elegant-only", 0, { styles: ["elegant"] }),
    garment("a-bottom", 1),
  ];
  const lastUsed = {
    "worn-recently": "2026-10-01T00:00:00.000Z",
    "worn-long-ago": "2026-01-01T00:00:00.000Z",
  };
  const options = {
    category: 0,
    style: "casual",
    season: "Summer",
    lastUsed,
  };
  expect(
    outfitCandidates(garments, { ...options, preferLeastWorn: true }).map(
      g => g.id,
    ),
  ).toEqual(["never-worn", "worn-long-ago", "worn-recently"]);
  const shuffled = outfitCandidates(garments, {
    ...options,
    preferLeastWorn: false,
    random: () => 0,
  }).map(g => g.id);
  expect([...shuffled].sort()).toEqual(
    ["never-worn", "worn-long-ago", "worn-recently"].sort(),
  );
  expect(shuffled).not.toEqual([
    "never-worn",
    "worn-long-ago",
    "worn-recently",
  ]);
});

describe("Suggest outfit screen", () => {
  const render = () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(<SuggestOutfit />);
    });
    return tree;
  };
  const press = (tree: ReactTestRenderer, label: string) =>
    act(() =>
      tree.root
        .find(n => n.props.accessibilityLabel === label && n.props.onPress)
        .props.onPress(),
    );
  const button = (tree: ReactTestRenderer, text: string) =>
    tree.root
      .findAllByType("Button" as any)
      .find(b => b.props.children === text)!;
  const text = (tree: ReactTestRenderer) => JSON.stringify(tree.toJSON());

  test("suggests the least worn top, bottom and shoes, reshuffles and logs the outfit", () => {
    mockState.itemsList.items = [
      garment("Old tee", 0, { logIds: ["e1"] }),
      garment("New tee", 0),
      garment("Jeans", 1, { logIds: ["e2"] }),
      garment("Sneakers", 2),
      garment("Watch", 3),
    ];
    mockState.itemsList.logs = [
      event("e1", "2026-01-02"),
      event("e2", "2026-09-30"),
    ];
    const tree = render();
    press(tree, "Summer");
    expect(text(tree)).toContain("New tee");
    expect(text(tree)).toContain("never worn");
    expect(text(tree)).toContain("last 30/09/2026");
    // No accessory unless asked for
    expect(text(tree)).not.toContain("Watch");
    press(tree, "Another option: Top");
    expect(text(tree)).toContain("Old tee");
    expect(text(tree)).not.toContain("New tee");
    act(() =>
      tree.root
        .findAllByType("Switch" as any)
        .find(s => s.props.accessibilityLabel === "Include an accessory")!
        .props.onValueChange(true),
    );
    // Changing a choice starts again from the first candidate
    expect(text(tree)).toContain("New tee");
    expect(text(tree)).toContain("Watch");
    act(() => button(tree, "Wear this").props.onPress());
    const actions = mockDispatch.mock.calls.map(call => call[0]);
    expect(actions[0]).toMatchObject({
      type: "itemsList/addEventLog",
      payload: { eventId: "outfit-1", eventName: "Casual outfit" },
    });
    expect(actions.slice(1).map(a => a.payload.selectedId)).toEqual([
      "New tee",
      "Jeans",
      "Sneakers",
      "Watch",
    ]);
    expect(mockNavigation.goBack).toHaveBeenCalled();
    act(() => tree.unmount());
  });

  test("says which piece is missing and logs only the pieces found", () => {
    mockState.itemsList.items = [garment("Hoodie", 0, { styles: ["sporty"] })];
    mockState.itemsList.logs = [];
    const tree = render();
    press(tree, "Summer");
    press(tree, "Sporty");
    expect(text(tree)).toContain("No bottoms for Sporty · Summer");
    expect(text(tree)).toContain("No shoes for Sporty · Summer");
    act(() => button(tree, "Wear this").props.onPress());
    expect(mockDispatch.mock.calls.map(call => call[0].type)).toEqual([
      "itemsList/addEventLog",
      "itemsList/addLog",
    ]);
    act(() => tree.unmount());
  });

  test("Wear this is disabled when nothing matches", () => {
    mockState.itemsList.items = [];
    const tree = render();
    expect(button(tree, "Wear this").props.disabled).toBe(true);
    act(() => tree.unmount());
  });
});
