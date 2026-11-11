import ReactNativeBlobUtil from "react-native-blob-util";

// Garment photos are image files in the app's private storage. A garment
// keeps only the file's name; a photo is never overwritten, so each new
// version (a cutout, an edit) is a new file and the image cache stays right.

export { isPhotoFile } from "./photoName";

export const photoDir = () =>
  `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/photos`;

export const photoPath = (name: string) => `${photoDir()}/${name}`;

/** What an <Image> shows for a stored photo. */
export const photoUri = (name: string) => `file://${photoPath(name)}`;

const extension = (base64: string) =>
  base64.startsWith("UklGR")
    ? "webp"
    : base64.startsWith("iVBOR")
    ? "png"
    : "jpg";

// Unique enough for one phone's photos: the time plus a random part.
const newName = (ext: string) =>
  `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}.${ext}`;

export const ensurePhotoDir = async () => {
  if (!(await ReactNativeBlobUtil.fs.isDir(photoDir())))
    await ReactNativeBlobUtil.fs.mkdir(photoDir());
};

/** Saves a base64 image as a new photo file; resolves its name. */
export async function savePhoto(base64: string): Promise<string> {
  await ensurePhotoDir();
  const name = newName(extension(base64));
  await ReactNativeBlobUtil.fs.writeFile(photoPath(name), base64, "base64");
  return name;
}

/** Copies an image file (a resized JPEG) in as a new photo; resolves its name. */
export async function savePhotoFile(path: string): Promise<string> {
  await ensurePhotoDir();
  const ext = path.toLowerCase().match(/\.(png|webp)$/)?.[1] ?? "jpg";
  const name = newName(ext);
  await ReactNativeBlobUtil.fs.cp(
    path.replace(/^file:\/\//, ""),
    photoPath(name),
  );
  return name;
}

/** The photo as base64, for the native background tools. */
export const readPhoto = (name: string): Promise<string> =>
  ReactNativeBlobUtil.fs.readFile(photoPath(name), "base64");

/**
 * Deletes the photo files no garment uses: replaced versions, photos of
 * deleted garments, and those of data replaced by an Import.
 */
export async function removeUnusedPhotos(used: string[]) {
  try {
    if (!(await ReactNativeBlobUtil.fs.isDir(photoDir()))) return;
    const keep = new Set(used);
    const files = await ReactNativeBlobUtil.fs.ls(photoDir());
    for (const file of files)
      if (!keep.has(file))
        await ReactNativeBlobUtil.fs
          .unlink(photoPath(file))
          .catch(() => undefined);
  } catch (error) {
    console.log("Couldn't tidy photos:", error);
  }
}
