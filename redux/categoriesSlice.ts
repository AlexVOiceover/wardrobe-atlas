import { createSlice } from "@reduxjs/toolkit";
import { customCategorySprite } from "../screens/stackNav/images";
import { clothesList } from "../utils/localization";

export const BUILT_IN_CATEGORY_COUNT = 4;
export const typeKey = (category: number, value: string) =>
  `${category}|${value}`;

export type Category = {
  name: string[];
  spriteSheet: any;
  screen: string;
  index: number;
};
// Names are [English, Spanish].
export type Names = string[];
export type CategoryCustomType = {
  customTypes: {
    label: string;
    labels?: Names;
    value: string;
    icon: number;
  }[];
};
export type CategoryList = {
  Categories: Category[];
  CategoryCustomTypes: CategoryCustomType[];
  // Built-in categories and types can't be removed from the code, so
  // deletions and renames of them are stored here.
  hiddenCategories: number[];
  categoryNames: Record<string, Names>;
  hiddenTypes: string[];
  typeNames: Record<string, Names>;
};
const initialState: CategoryList = {
  Categories: [],
  CategoryCustomTypes: [],
  hiddenCategories: [],
  categoryNames: {},
  hiddenTypes: [],
  typeNames: {},
};
export { initialState as CurrentCategories };
// Older payloads and data carry one name for both languages.
const bothNames = (name: unknown): Names =>
  Array.isArray(name)
    ? [name[0], name[1] || name[0]]
    : [String(name), String(name)];
const isBuiltIn = (index: number) =>
  index >= 0 && index < BUILT_IN_CATEGORY_COUNT;
const customTypesOf = (state: CategoryList, index: number) => {
  if (!state.CategoryCustomTypes) state.CategoryCustomTypes = [];
  if (!state.CategoryCustomTypes[index])
    state.CategoryCustomTypes[index] = { customTypes: [] };
  return state.CategoryCustomTypes[index].customTypes;
};
const categoriesSlice = createSlice({
  name: "CategoryList",
  initialState: initialState,
  reducers: {
    addCategory: (state, action) => {
      // The caller passes a number no garment uses, so a new category never
      // picks up the garments of a deleted one.
      const index = Math.max(
        action.payload.index ?? 0,
        BUILT_IN_CATEGORY_COUNT,
        ...state.Categories.map(category => category.index + 1),
      );
      state.Categories.push({
        name: bothNames(action.payload.name),
        screen: "ItemForm",
        spriteSheet: customCategorySprite,
        index,
      } as Category);
      if (state.CategoryCustomTypes?.[index])
        state.CategoryCustomTypes[index] = { customTypes: [] };
    },
    delCategory: (state, action) => {
      const index = action.payload.index;
      if (isBuiltIn(index)) {
        if (!state.hiddenCategories.includes(index))
          state.hiddenCategories.push(index);
      } else {
        const position = state.Categories.findIndex(x => x.index === index);
        if (position < 0) return;
        state.Categories.splice(position, 1);
      }
      // Types are stored by category number; clear them in place so other
      // categories keep theirs.
      if (state.CategoryCustomTypes?.[index])
        state.CategoryCustomTypes[index] = { customTypes: [] };
    },
    renameCategory: (state, action) => {
      const { index } = action.payload;
      const name = bothNames(action.payload.name);
      if (isBuiltIn(index)) {
        state.categoryNames[String(index)] = name;
        return;
      }
      const category = state.Categories.find(x => x.index === index);
      if (category) category.name = name;
    },
    importCategory: (state, action) => {
      state.Categories = action.payload.Categories;
      state.CategoryCustomTypes = action.payload.CategoryCustomTypes;
      state.hiddenCategories = action.payload.hiddenCategories ?? [];
      state.categoryNames = action.payload.categoryNames ?? {};
      state.hiddenTypes = action.payload.hiddenTypes ?? [];
      state.typeNames = action.payload.typeNames ?? {};
    },
    addTypeToCategory: (state, action) => {
      const { index } = action.payload;
      const labels = bothNames(
        action.payload.labels ?? action.payload.typeName,
      );
      const typeName = labels[0];
      const customTypes = customTypesOf(state, index);
      // Renames keep the stored value, so a new type may need a fresh one.
      const taken = new Set([
        ...(isBuiltIn(index) ? clothesList[0][index] : []).map(x => x.value),
        ...customTypes.map(x => x.value),
      ]);
      let value = typeName;
      for (let n = 2; taken.has(value); n++) value = `${typeName} (${n})`;
      customTypes.push({ label: typeName, labels, value, icon: 0 });
    },
    renameType: (state, action) => {
      const { category, value } = action.payload;
      const name = bothNames(action.payload.name);
      const custom = state.CategoryCustomTypes?.[category]?.customTypes.find(
        x => x.value === value,
      );
      if (custom) {
        custom.label = name[0];
        custom.labels = name;
      } else state.typeNames[typeKey(category, value)] = name;
    },
    deleteType: (state, action) => {
      const { category, value } = action.payload;
      const customTypes = state.CategoryCustomTypes?.[category]?.customTypes;
      const position = customTypes?.findIndex(x => x.value === value) ?? -1;
      if (customTypes && position >= 0) customTypes.splice(position, 1);
      else if (!state.hiddenTypes.includes(typeKey(category, value)))
        state.hiddenTypes.push(typeKey(category, value));
    },
    restoreDefaultCategories: state => {
      state.hiddenCategories = [];
      state.categoryNames = {};
      state.hiddenTypes = [];
      state.typeNames = {};
    },
  },
});
export const {
  addCategory,
  delCategory,
  renameCategory,
  importCategory,
  addTypeToCategory,
  renameType,
  deleteType,
  restoreDefaultCategories,
} = categoriesSlice.actions;
export default categoriesSlice.reducer;
