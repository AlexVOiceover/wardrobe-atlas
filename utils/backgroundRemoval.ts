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
