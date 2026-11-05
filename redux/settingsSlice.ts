import { createSlice } from "@reduxjs/toolkit";
import {
  COLLECTION_SORT_VALUES,
  type CollectionSortValue,
} from "../utils/collectionOrder";
import {
  DEFAULT_CLOSET_SORT,
  DEFAULT_OUTFIT_SORT,
  normalizeClosetSort,
  normalizeOutfitSort,
} from "../utils/sorts";
export const GRID_COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6];
export const DEFAULT_GRID_COLUMNS = 2;
// Stored settings and backups from before the grid size setting have no value.
export const normalizeGridColumns = (value: unknown) =>
  GRID_COLUMN_OPTIONS.includes(value as number)
    ? (value as number)
    : DEFAULT_GRID_COLUMNS;
// Folded Closet sections survive restarts; only strings are kept.
export const normalizeCollapsedSections = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((key): key is string => typeof key === "string")
    : [];
export type SettingsType = {
  language: number;
  // No longer shown; kept so older stores and backups round-trip.
  name: string;
  enableHeatMap: boolean;
  appVer: string;
  collectionSortValue: CollectionSortValue;
  gridColumns: number;
  // Wardrobe of the last garment saved; new garments start there.
  lastWardrobeId: string;
  // Closet category and type sections the user folded.
  collapsedSections: string[];
  // Last chosen sort orders; older stores have none and get the defaults.
  closetSortValue: string;
  outfitSortValue: string;
};
const initialState: SettingsType = {
  language: 0,
  name: "User",
  enableHeatMap: false,
  appVer: "1.0.1",
  collectionSortValue: COLLECTION_SORT_VALUES.CUSTOM,
  gridColumns: DEFAULT_GRID_COLUMNS,
  lastWardrobeId: "",
  collapsedSections: [],
  closetSortValue: DEFAULT_CLOSET_SORT,
  outfitSortValue: DEFAULT_OUTFIT_SORT,
};
const settingsSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    changeLanguage: (state, action) => {
      state.language = action.payload.lang === 1 ? 1 : 0;
    },
    setHeatMap: (state, action) => {
      state.enableHeatMap = action.payload.enableHeatMap;
    },
    setCollectionSortValue: (state, action) => {
      state.collectionSortValue =
        action.payload.collectionSortValue ?? COLLECTION_SORT_VALUES.CUSTOM;
    },
    setClosetSortValue: (state, action) => {
      state.closetSortValue = normalizeClosetSort(action.payload.sortValue);
    },
    setOutfitSortValue: (state, action) => {
      state.outfitSortValue = normalizeOutfitSort(action.payload.sortValue);
    },
    setGridColumns: (state, action) => {
      state.gridColumns = normalizeGridColumns(action.payload.gridColumns);
    },
    setLastWardrobe: (state, action) => {
      state.lastWardrobeId = action.payload.wardrobeId || "";
    },
    toggleSection: (state, action) => {
      const key = action.payload.key;
      const sections = state.collapsedSections ?? [];
      state.collapsedSections = sections.includes(key)
        ? sections.filter(current => current !== key)
        : [...sections, key];
    },
    importSettings: (state, action) => {
      state.language = action.payload.language === 1 ? 1 : 0;
      state.name = action.payload.name;
      state.enableHeatMap = action.payload.enableHeatMap === true;
      state.appVer = action.payload.appVer || state.appVer;
      state.collectionSortValue =
        action.payload.collectionSortValue ?? COLLECTION_SORT_VALUES.CUSTOM;
      state.gridColumns = normalizeGridColumns(action.payload.gridColumns);
      state.lastWardrobeId =
        typeof action.payload.lastWardrobeId === "string"
          ? action.payload.lastWardrobeId
          : "";
      state.collapsedSections = normalizeCollapsedSections(
        action.payload.collapsedSections,
      );
      state.closetSortValue = normalizeClosetSort(
        action.payload.closetSortValue,
      );
      state.outfitSortValue = normalizeOutfitSort(
        action.payload.outfitSortValue,
      );
    },
  },
});
export const {
  changeLanguage,
  setHeatMap,
  setCollectionSortValue,
  setClosetSortValue,
  setOutfitSortValue,
  setGridColumns,
  setLastWardrobe,
  toggleSection,
  importSettings,
} = settingsSlice.actions;
export default settingsSlice.reducer;
