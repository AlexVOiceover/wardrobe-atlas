import { NativeModules } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import { persistor, store } from "../redux/store";
import { importCategory } from "../redux/categoriesSlice";
import { importItems } from "../redux/itemsSlice";
import { importSettings } from "../redux/settingsSlice";
import { createWardrobeBackup, readWardrobeBackup } from "./wardrobeData";
import {
  ensurePhotoDir,
  isPhotoFile,
  photoPath,
  removeUnusedPhotos,
} from "./photoStore";

// A backup is one ZIP: wardrobe.json (everything but the photos) and a
// photos folder holding each garment's photo under the name the data uses.
const DATA_FILE = "wardrobe.json";
const PHOTOS = "photos";

const pad = (value: number) => String(value).padStart(2, "0");
/** wardrobe-atlas-2026-11-11-0930.zip, in the phone's time. */
export const backupFileName = (date: Date) =>
  `wardrobe-atlas-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}.zip`;

const fs = () => ReactNativeBlobUtil.fs;
const workDir = (name: string) => `${fs().dirs.CacheDir}/${name}`;
const removeDir = async (dir: string) => {
  if (await fs().exists(dir)) await fs().unlink(dir);
};

/**
 * Saves a backup where the user chooses (the phone, Google Drive, …).
 * Resolves false when cancelled or when it couldn't be written.
 */
export async function exportBackup(): Promise<boolean> {
  const dir = workDir("backup-export");
  try {
    const backup = createWardrobeBackup(store.getState());
    await removeDir(dir);
    await fs().mkdir(dir);
    const data = `${dir}/${DATA_FILE}`;
    await fs().writeFile(data, JSON.stringify(backup), "utf8");
    const entries: Record<string, string> = { [DATA_FILE]: data };
    for (const garment of backup.itemsList.items)
      if (
        isPhotoFile(garment.image) &&
        (await fs().exists(photoPath(garment.image)))
      )
        entries[`${PHOTOS}/${garment.image}`] = photoPath(garment.image);
    // Android asks where to save; the file starts empty and is filled here.
    const document = await ScopedStorage.createDocument(
      backupFileName(new Date()),
      "application/zip",
      "",
      "utf8",
    );
    if (!document?.uri) return false;
    await NativeModules.WardrobeArchive.zip(entries, document.uri);
    return true;
  } catch (error) {
    console.error("Export failed:", error);
    return false;
  } finally {
    await removeDir(dir).catch(() => undefined);
  }
}

/**
 * Replaces everything with a chosen backup, photos included; says how it
 * went. Nothing changes unless the backup unpacks and reads correctly.
 */
export async function importBackup(
  syncDisplay: (enabled: boolean) => void,
): Promise<"imported" | "cancelled" | "invalid"> {
  const dir = workDir("backup-import");
  try {
    const file = await ScopedStorage.openDocument(false);
    if (!file?.uri) return "cancelled";
    await removeDir(dir);
    await NativeModules.WardrobeArchive.unzip(file.uri, dir);
    const data = `${dir}/${DATA_FILE}`;
    if (!(await fs().exists(data))) return "invalid";
    const state = readWardrobeBackup(
      JSON.parse(await fs().readFile(data, "utf8")),
    );
    // Photos keep their names; a garment whose photo isn't in the backup
    // keeps no photo.
    await ensurePhotoDir();
    const items = [];
    for (const garment of state.itemsList.items) {
      const photo = `${dir}/${PHOTOS}/${garment.image}`;
      if (garment.image && (await fs().exists(photo))) {
        if (!(await fs().exists(photoPath(garment.image))))
          await fs().cp(photo, photoPath(garment.image));
        items.push(garment);
      } else items.push({ ...garment, image: "" });
    }
    store.dispatch(importCategory(state.CategoryList));
    store.dispatch(importItems({ ...state.itemsList, items }));
    store.dispatch(importSettings(state.settings));
    await persistor.flush();
    syncDisplay(state.settings.enableHeatMap);
    await removeUnusedPhotos(items.map(garment => garment.image));
    return "imported";
  } catch (error) {
    console.error("Import failed:", error);
    return "invalid";
  } finally {
    await removeDir(dir).catch(() => undefined);
  }
}
