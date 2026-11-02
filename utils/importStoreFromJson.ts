import { persistor, store } from "../redux/store";
import * as ScopedStorage from "react-native-scoped-storage";
import { importCategory } from "../redux/categoriesSlice";
import { importItems } from "../redux/itemsSlice";
import { importSettings } from "../redux/settingsSlice";
import { readWardrobeBackup } from "./wardrobeData";

export const importStoreFromJson = async (
  syncDisplay: (enabled: boolean) => void,
) => {
  try {
    const file = await ScopedStorage.openDocument(true, "utf8");
    if (
      !file ||
      (file.mime !== "application/json" && !file.name.endsWith(".json"))
    )
      return false;
    const state = readWardrobeBackup(JSON.parse(file.data));
    store.dispatch(importCategory(state.CategoryList));
    store.dispatch(importItems(state.itemsList));
    store.dispatch(importSettings(state.settings));
    await persistor.flush();
    syncDisplay(state.settings.enableHeatMap);
    return true;
  } catch (error) {
    console.error("Import failed:", error);
    return false;
  }
};
