import { getPalette } from "@somesoap/react-native-image-palette";
import ReactNativeBlobUtil from "react-native-blob-util";
import { cutoutColors, isCutout } from "./backgroundRemoval";

/** A garment has at most this many colors. */
export const MAX_COLORS = 3;

/**
 * Up to three main colors of a base64 photo, most important first. Cut-outs
 * count only the garment, not the transparent background. Empty when no
 * color could be read.
 */
export async function extractColors(image: string): Promise<string[]> {
  if (!image) return [];
  const garment = isCutout(image) ? await cutoutColors(image) : undefined;
  if (garment) return distinct(garment);
  try {
    const tmp = `${
      ReactNativeBlobUtil.fs.dirs.CacheDir
    }/palette_${Date.now()}.jpg`;
    await ReactNativeBlobUtil.fs.writeFile(tmp, image, "base64");
    const pal: any = await getPalette(`file://${tmp}`);
    try {
      await ReactNativeBlobUtil.fs.unlink(tmp);
    } catch {}
    return distinct([
      pal.dominant || pal.vibrant || pal.darkVibrant,
      pal.muted || pal.vibrant,
      pal.darkVibrant,
    ]);
  } catch (e) {
    console.log("colorExtractor error:", e);
    return [];
  }
}

const distinct = (colors: (string | undefined)[]) =>
  colors
    .filter((color): color is string => !!color)
    .filter(
      (color, index, all) =>
        all.findIndex(other => other.toLowerCase() === color.toLowerCase()) ===
        index,
    )
    .slice(0, MAX_COLORS);
