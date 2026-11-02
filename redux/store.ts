import { combineReducers, configureStore } from "@reduxjs/toolkit";
import categoriesSlice from "./categoriesSlice";
import itemsSlice from "./itemsSlice";
import FilesystemStorage from "redux-persist-filesystem-storage";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import settingsSlice from "./settingsSlice";
import { normalizeWardrobe } from "../utils/wardrobeData";
const persistConfig = {
  key: "root",
  version: 2,
  storage: FilesystemStorage,
  migrate: async (state: any) =>
    state ? { ...normalizeWardrobe(state), _persist: state._persist } : state,
};
const rootReducer = combineReducers({
  CategoryList: categoriesSlice,
  itemsList: itemsSlice,
  settings: settingsSlice,
});
export type RootState = ReturnType<typeof rootReducer>;
const persistedReducer = persistReducer(persistConfig, rootReducer);
export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
export const persistor = persistStore(store);
