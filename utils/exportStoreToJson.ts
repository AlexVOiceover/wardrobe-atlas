import { createWardrobeBackup } from "./wardrobeData";
import { RootState, store } from "../redux/store"; // Replace with the correct path to your rootReducer file
import * as ScopedStorage from "react-native-scoped-storage";
const pad = (value: number) => String(value).padStart(2, "0");
/** wardrobe-atlas-2026-11-08-1405.json, in the phone's time. */
export const backupFileName = (date: Date) =>
  `wardrobe-atlas-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
export const exportStoreToJson = async () => {
  if (!store) {
    console.log("Store not initialized");
    return;
  }
  try {
    const state: RootState = store.getState();
    const serializedState = JSON.stringify(createWardrobeBackup(state));
    // Android asks where to save it: the phone, Google Drive or another app.
    const storePath = await ScopedStorage.createDocument(
      backupFileName(new Date()),
      "application/json",
      serializedState,
      "utf8",
    );
    if (storePath) {
      console.log("Store exported successfully.");
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error("Error exporting store:", error);
    return false;
  }
};
