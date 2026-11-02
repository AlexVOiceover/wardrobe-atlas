import { createSlice } from "@reduxjs/toolkit";
import {
  COLLECTION_SORT_VALUES,
  type CollectionSortValue,
} from "../utils/collectionOrder";
export type SettingsType = {
  language: number;
  name: string;
  enableHeatMap: boolean;
  appVer: string;
  collectionSortValue: CollectionSortValue;
};
const initialState: SettingsType = {
  language: 0,
  name: "User",
  enableHeatMap: false,
  appVer: "1.0.1",
  collectionSortValue: COLLECTION_SORT_VALUES.CUSTOM,
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
    importSettings: (state, action) => {
      state.language = action.payload.language === 1 ? 1 : 0;
      state.name = action.payload.name;
      state.enableHeatMap = action.payload.enableHeatMap === true;
      state.appVer = action.payload.appVer || state.appVer;
      state.collectionSortValue =
        action.payload.collectionSortValue ?? COLLECTION_SORT_VALUES.CUSTOM;
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
  importSettings,
  setAppVer,
} = settingsSlice.actions;
export default settingsSlice.reducer;
