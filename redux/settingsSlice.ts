import { createSlice } from "@reduxjs/toolkit";
import {
  COLLECTION_SORT_VALUES,
  type CollectionSortValue,
} from "../utils/collectionOrder";
export const GRID_COLUMN_OPTIONS = [1, 2, 3, 4, 5];
export const DEFAULT_GRID_COLUMNS = 2;
// Stored settings and backups from before the grid size setting have no value.
export const normalizeGridColumns = (value: unknown) =>
  GRID_COLUMN_OPTIONS.includes(value as number)
    ? (value as number)
    : DEFAULT_GRID_COLUMNS;
export type SettingsType = {
  language: number;
  name: string;
  enableHeatMap: boolean;
  appVer: string;
  collectionSortValue: CollectionSortValue;
  gridColumns: number;
};
const initialState: SettingsType = {
  language: 0,
  name: "User",
  enableHeatMap: false,
  appVer: "1.0.1",
  collectionSortValue: COLLECTION_SORT_VALUES.CUSTOM,
  gridColumns: DEFAULT_GRID_COLUMNS,
};
const settingsSlice = createSlice({
  name: "settings",
  initialState: initialState,
  reducers: {
    changeLanguage: (state, action) => {
      state.language = action.payload.lang === 1 ? 1 : 0;
    },
    userNameSetter: (state, action) => {
      state.name = action.payload.name;
    },
    setHeatMap: (state, action) => {
      state.enableHeatMap = action.payload.enableHeatMap;
    },
    setCollectionSortValue: (state, action) => {
      state.collectionSortValue =
        action.payload.collectionSortValue ?? COLLECTION_SORT_VALUES.CUSTOM;
    },
    setGridColumns: (state, action) => {
      state.gridColumns = normalizeGridColumns(action.payload.gridColumns);
    },
    importSettings: (state, action) => {
      state.language = action.payload.language === 1 ? 1 : 0;
      state.name = action.payload.name;
      state.enableHeatMap = action.payload.enableHeatMap === true;
      state.appVer = action.payload.appVer || state.appVer;
      state.collectionSortValue =
        action.payload.collectionSortValue ?? COLLECTION_SORT_VALUES.CUSTOM;
      state.gridColumns = normalizeGridColumns(action.payload.gridColumns);
    },
    setAppVer: (state, action) => {
      state.appVer = action.payload.appVer;
    },
  },
});
export const {
  changeLanguage,
  userNameSetter,
  setHeatMap,
  setCollectionSortValue,
  setGridColumns,
  importSettings,
  setAppVer,
} = settingsSlice.actions;
export default settingsSlice.reducer;
