import { getPalette } from "@somesoap/react-native-image-palette";
import { cutoutColors, isCutout } from "./backgroundRemoval";
import { photoUri } from "./photoStore";

/** A garment has at most this many colors. */
export const MAX_COLORS = 3;

/**
 * Up to three main colors of a photo file, most important first. Cut-outs
 * count only the garment, not the transparent background. Empty when no
 * color could be read.
 */
export async function extractColors(photo: string): Promise<string[]> {
  if (!photo) return [];
  const garment = isCutout(photo) ? await cutoutColors(photo) : undefined;
  if (garment) return distinct(garment);
  try {
    const pal: any = await getPalette(photoUri(photo));
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
