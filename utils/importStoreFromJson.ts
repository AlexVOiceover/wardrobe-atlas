import { persistor, store } from "../redux/store";
import * as ScopedStorage from "react-native-scoped-storage";
import { importCategory } from "../redux/categoriesSlice";
import { importItems } from "../redux/itemsSlice";
import { importSettings } from "../redux/settingsSlice";
import { readWardrobeBackup } from "./wardrobeData";

/**
 * Replaces the store with a backup's text, the same way for a chosen file and
 * a Google Drive backup. Throws if the text isn't a backup.
 */
export const applyBackup = async (
  text: string,
  syncDisplay: (enabled: boolean) => void,
) => {
  const state = readWardrobeBackup(JSON.parse(text));
  store.dispatch(importCategory(state.CategoryList));
  store.dispatch(importItems(state.itemsList));
  store.dispatch(importSettings(state.settings));
  await persistor.flush();
  syncDisplay(state.settings.enableHeatMap);
};

/** Replaces the store with a chosen backup; says how it went. */
export const importStoreFromJson = async (
  syncDisplay: (enabled: boolean) => void,
): Promise<"imported" | "cancelled" | "invalid"> => {
  try {
    const file = await ScopedStorage.openDocument(true, "utf8");
    if (!file) return "cancelled";
    if (file.mime !== "application/json" && !file.name.endsWith(".json"))
      return "invalid";
    await applyBackup(file.data, syncDisplay);
    return "imported";
  } catch (error) {
    console.error("Import failed:", error);
    return "invalid";
  }
};
