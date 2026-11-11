# Photos as files, backups as ZIP

Status: discussed on 2026-11-11. The owner found photos encoded inside the JSON backup odd and asked whether that is standard. They said there are no users and no real data, so compatibility isn't needed: "do what is best for the project". Implemented on `feature/photo-files-zip-backup`.

## Goals

- Keep each garment photo as a normal image file in the app's private storage. The saved data refers to it by file name instead of holding the image as base64 text.
- Make Export write one `.zip`: a small `wardrobe.json` plus a `photos/` folder of normal image files that open in any viewer.
- Make Import read that `.zip` and replace everything, photos included.
- Saving any change (a log, an edit) no longer rewrites every photo.

## Non-goals

- No compatibility with older `.json` backups or with base64 photos already saved. There are no users and no real data (owner, 2026-11-11). A saved photo that isn't a file name is dropped.
- No change to how photos are taken, resized (500 px JPEG) or cut out, and no change to the native background module.
- No cloud or automatic backups.

## UX

- **Export:** Android's "Save as" picker opens with `wardrobe-atlas-YYYY-MM-DD-HHmm.zip`. Choosing Google Drive works as before.
- **Import:** the picker opens and a `.zip` backup can be chosen. Anything else, or a ZIP without `wardrobe.json`, shows the existing "isn't a Wardrobe Atlas backup" message, and nothing changes.
- Everything else looks the same.

## Implementation

- **`utils/photoStore.ts` (new).** One place for photo files in `DocumentDir/photos/`:
  - `isPhotoFile(name)`: a safe name like `Xy3…_-.jpg|png|webp`, so no paths.
  - `photoUri(name)`: the `file://` address for an `<Image>`.
  - `photoPath(name)`.
  - `savePhoto(base64)` and `savePhotoFile(path)`: each writes a new file with a new random name and resolves that name. Files are never overwritten, so the image cache never shows a stale photo.
  - `readPhoto(name)`: base64, only where the native module needs it.
  - `removeUnusedPhotos(used)`: deletes files no garment refers to.
- **Every photo version is a file.** A picked photo, a cut-out, an edit from the cut-out editor and an undo each refer to a file, so `garment.image` and the garment form's photo are always a file name. Saving a garment stays synchronous.
- **Unused files** (a photo replaced before Save, a deleted garment, the data replaced by Import) are removed when the app starts, after the saved data loads, and after an Import.
- **Base64 only at the native edge.** `removeBackground`, `isolateGarment`, `cutoutColors` and the cut-out editor read the file as base64 for the native module and save its result as a new file. The cut-out editor keeps its undo history in memory and saves one file on Done. Colour extraction and the colour picker read the file directly.
- **Displays.** `GarmentPhoto`, `ItemSummary`, `PhotoView`, `ImageViewer`, `SuggestOutfit`, `ColorModal`, `PhotoColorPicker` and `CutoutEditor` show `photoUri(name)`.
- **`isCutout(name)`** checks for the `.webp` extension; cut-outs are WebP.
- **Data.** `normalizeWardrobe` keeps `image` only when `isPhotoFile` accepts it. `DATA_FORMAT_VERSION` goes to 3.
- **Native `WardrobeArchive` module (Kotlin, `java.util.zip`; no new library):**
  - `zip(entries, uri)` streams the listed files into the document the user picked.
  - `unzip(uri, dir)` streams a picked document into a folder. It rejects entry names that would escape that folder.
- **Export:**
  1. Write `wardrobe.json` to the cache.
  2. `ScopedStorage.createDocument(name.zip, "application/zip", "")` asks where to save and creates an empty file.
  3. `WardrobeArchive.zip` fills it with `wardrobe.json` and `photos/<name>` for each garment photo.
- **Import:**
  1. `ScopedStorage.openDocument(false)` gives the picked file without reading it into memory.
  2. `WardrobeArchive.unzip` unpacks it into a fresh cache folder.
  3. Read and check `wardrobe.json`. A garment whose photo is missing from the ZIP keeps no photo.
  4. Copy the photos into `photos/`, replace the data, flush, and remove unused photos.
- **Removed:** `utils/exportStoreToJson.ts` and `utils/importStoreFromJson.ts` are replaced by `utils/backupArchive.ts`.

## Storage and migration

- Saved garments now hold photo file names. No migration: earlier base64 photos are dropped on load, which the owner accepted because there is no real data.
- The persisted store shrinks to text only.

## Edge cases

- The user cancels the "Save as" picker or the open picker: nothing happens.
- A ZIP with an entry like `../x` is rejected by the native unzip, and nothing changes.
- A photo file missing from the app (for example, deleted outside the app) shows as no photo. The garment keeps working.
- An Import that fails part-way leaves the current data unchanged, because the data is replaced only after the ZIP is unpacked and checked.

## Acceptance checks

- Add a garment with a photo, cut it out and edit the cut-out: it shows everywhere, and after Save and an app restart it is still there.
- Export saves a `.zip`. Opening it shows `wardrobe.json` (no base64) and a `photos/` folder with viewable images.
- Delete or change garments, then Import that ZIP: everything is back, photos included.
- Importing a non-backup file shows the message and changes nothing.

## Implementation notes

- Photo names are the time plus a random part (`lq3k9-ab12cd34.jpg`). They aren't `nanoid`, which Jest can't load without a mock in every test.
- `isPhotoFile` lives in `utils/photoName.ts` (no native imports), so `wardrobeData` can use it in every test.
- The persisted store's version goes from 2 to 3, so `normalizeWardrobe` runs once on update and drops old base64 photos.
- Tests share a default `react-native-blob-util` stub (`jest.setup.js`); tests that need file behaviour mock it themselves.
- Startup clean-up runs from `PersistGate`'s `onBeforeLift` and doesn't delay the app.

## Validation

- `npx tsc --noEmit` and `npm run lint`: clean.
- `npm test`: 30 suites, 295 tests pass. New tests:
  - `photoStore`: names, new file per save, copy-in, deleting unused photos.
  - `backupArchive`: the export entries and the photo-free data, cancel, import with a missing photo, non-backup files, a refused unsafe ZIP, and clean-up of replaced photos.
  - `coreData`: only file names survive loading.
- The Kotlin module is compiled by the CI Android build. ZIP writing and reading run only on the phone; they aren't checked yet.

## Known limitations

- A deleted garment's photo file stays until the next app start.
- Export and Import show no progress; a large wardrobe may take a few seconds.
