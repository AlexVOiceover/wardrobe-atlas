import { NativeModules } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import type { BackgroundError } from "./backgroundRemoval";

/**
 * Which garment to keep from a photo of someone wearing it. Shoes and
 * accessories aren't recognised by the garment model; they keep the plain
 * background removal.
 */
export type GarmentPart = "upper" | "lower" | "any";

export const garmentPart = (category?: number): GarmentPart | undefined => {
  if (category === 0) return "upper";
  if (category === 1) return "lower";
  if (category === 2 || category === 3) return undefined;
  return "any";
};

// U²-Net cloth segmentation (MIT), pinned to one revision and checked by hash.
export const GARMENT_MODEL = {
  url: "https://huggingface.co/litert-community/Cloth-Segmentation-U2Net-LiteRT/resolve/37e0b75777a6c3dfc7533aeef697aa6136716bfe/clothseg.tflite",
  size: 176_300_680,
  sha256: "71b488370fe0ed204a8f7c09332ae4e6e6562c40148caec543c75b4d5153b082",
  megabytes: 176,
};
export const garmentModelPath = () =>
  `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/garment-model-u2net-37e0b75.tflite`;

/** The model is downloaded once; a partial or damaged file doesn't count. */
export async function hasGarmentModel(): Promise<boolean> {
  try {
    const stat = await ReactNativeBlobUtil.fs.stat(garmentModelPath());
    return Number(stat.size) === GARMENT_MODEL.size;
  } catch {
    return false;
  }
}

/** Downloads and verifies the model, reporting progress from 0 to 100. */
export async function downloadGarmentModel(
  onProgress: (percent: number) => void,
): Promise<boolean> {
  const path = garmentModelPath();
  const partial = `${path}.part`;
  const remove = (file: string) =>
    ReactNativeBlobUtil.fs.unlink(file).catch(() => undefined);
  try {
    await remove(partial);
    const task = ReactNativeBlobUtil.config({
      path: partial,
      timeout: 120_000,
    }).fetch("GET", GARMENT_MODEL.url);
    task.progress({ interval: 500 }, received =>
      onProgress(
        Math.min(99, Math.round((Number(received) / GARMENT_MODEL.size) * 100)),
      ),
    );
    const response = await task;
    if (response.info().status !== 200) throw new Error("status");
    const stat = await ReactNativeBlobUtil.fs.stat(partial);
    if (
      Number(stat.size) !== GARMENT_MODEL.size ||
      (await ReactNativeBlobUtil.fs.hash(partial, "sha256")).toLowerCase() !==
        GARMENT_MODEL.sha256
    )
      throw new Error("verification");
    await remove(path);
    await ReactNativeBlobUtil.fs.mv(partial, path);
    onProgress(100);
    return true;
  } catch {
    await remove(partial);
    return false;
  }
}

/**
 * Keeps only the chosen garment of a base64 photo, on the device, and
 * resolves the transparent WebP, or the reason it couldn't be made.
 */
export async function isolateGarment(
  image: string,
  part: GarmentPart,
): Promise<{ image: string } | { error: BackgroundError | "noModel" }> {
  const native = NativeModules.WardrobeBackground;
  if (!native?.isolateGarment) return { error: "unsupported" };
  if (!(await hasGarmentModel())) return { error: "noModel" };
  try {
    const cutout = await native.isolateGarment(image, garmentModelPath(), part);
    return typeof cutout === "string" && cutout
      ? { image: cutout }
      : { error: "failed" };
  } catch (error: any) {
    switch (error?.code) {
      case "NO_SUBJECT":
        return { error: "noSubject" };
      case "NO_MODEL":
        // Damaged on disk: remove it so the next try downloads it again.
        await ReactNativeBlobUtil.fs
          .unlink(garmentModelPath())
          .catch(() => undefined);
        return { error: "noModel" };
      default:
        return { error: "failed" };
    }
  }
}
