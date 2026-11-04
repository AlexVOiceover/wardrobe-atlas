import { NativeModules } from "react-native";

export type BackgroundError =
  | "preparing"
  | "noSubject"
  | "unsupported"
  | "failed";

// Cutouts are saved as WebP ("RIFF" header); original photos are JPEG.
export const isCutout = (image?: string) => !!image?.startsWith("UklGR");

/**
 * Removes the background of a base64 photo on the device and resolves the
 * transparent WebP cutout, or the reason it couldn't be made.
 */
export async function removeBackground(
  image: string,
): Promise<{ image: string } | { error: BackgroundError }> {
  const remover = NativeModules.WardrobeBackground;
  if (!remover) return { error: "unsupported" };
  try {
    const cutout = await remover.removeBackground(image);
    return typeof cutout === "string" && cutout
      ? { image: cutout }
      : { error: "failed" };
  } catch (error: any) {
    switch (error?.code) {
      case "PREPARING":
        return { error: "preparing" };
      case "NO_SUBJECT":
        return { error: "noSubject" };
      case "UNSUPPORTED":
        return { error: "unsupported" };
      default:
        return { error: "failed" };
    }
  }
}

/** A brush stroke over a cutout; size and points are fractions of the image. */
export type CutoutStroke = {
  mode: "erase" | "restore";
  size: number;
  points: number[];
};

/**
 * Applies brush strokes to a cutout: "erase" clears, "restore" brings back
 * the original photo (when there is one). Resolves the edited WebP.
 */
export async function editCutout(
  image: string,
  original: string | undefined,
  strokes: CutoutStroke[],
): Promise<string | undefined> {
  const editor = NativeModules.WardrobeBackground;
  try {
    const edited = await editor?.editCutout(image, original ?? "", strokes);
    return typeof edited === "string" && edited ? edited : undefined;
  } catch {
    return undefined;
  }
}

/** Up to three main colors of a cutout, ignoring its transparent background. */
export async function cutoutColors(
  image: string,
): Promise<string[] | undefined> {
  try {
    const colors = await NativeModules.WardrobeBackground?.cutoutColors(image);
    return Array.isArray(colors) && colors.length > 0 ? colors : undefined;
  } catch {
    return undefined;
  }
}
