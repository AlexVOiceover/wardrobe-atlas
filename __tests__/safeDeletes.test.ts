import itemsReducer, {
  addLog,
  deleteEventLog,
  deleteItem,
} from "../redux/itemsSlice";
import categoriesReducer, { delCategory } from "../redux/categoriesSlice";

jest.mock("nanoid", () => ({ nanoid: () => "new" }));
jest.mock("react-native-get-random-values", () => ({}));

const itemsState = (): any => ({
  wardrobes: [],
  items: [
    { id: "a", name: "First", logIds: [] },
    { id: "b", name: "Last", logIds: [] },
  ],
  collectionTags: [],
  logs: [{ eventId: "e1", eventName: "Dinner" }],
  refreshItems: false,
});

test("deleting a garment twice removes only that garment", () => {
  const once = itemsReducer(itemsState(), deleteItem({ selectedId: "a" }));
  const twice = itemsReducer(once, deleteItem({ selectedId: "a" }));
  expect(twice.items.map(x => x.id)).toEqual(["b"]);
});

test("deleting an unknown outfit log keeps every log", () => {
  const state = itemsReducer(
    itemsState(),
    deleteEventLog({ selectedLogId: "missing" }),
  );
  expect(state.logs).toHaveLength(1);
});

test("logging a garment that no longer exists changes nothing", () => {
  const state = itemsReducer(
    itemsState(),
    addLog({ selectedId: "missing", logId: "e1" }),
  );
  expect(state.items.every(x => x.logIds?.length === 0)).toBe(true);
});

test("deleting an unknown category keeps the others and their types", () => {
  const initial: any = {
    Categories: [
      { name: ["Tops"], index: 0 },
      { name: ["Shoes"], index: 1 },
    ],
    CategoryCustomTypes: [{ customTypes: [] }, { customTypes: [] }],
  };
  const state = categoriesReducer(initial, delCategory({ index: 99 }));
  expect(state.Categories).toHaveLength(2);
  expect(state.CategoryCustomTypes).toHaveLength(2);
});
