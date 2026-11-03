import { NativeModules } from "react-native";

// App language index → ML Kit language tag.
const languageTags = ["en", "es"];

/**
 * Translates on the device (the language pack downloads on first use).
 * Resolves undefined when translation isn't available, so callers can fall
 * back to copying the text.
 */
export async function translateText(
  text: string,
  from: number,
  to: number,
): Promise<string | undefined> {
  const translator = NativeModules.WardrobeTranslator;
  if (!translator || !text.trim() || from === to) return undefined;
  try {
    const translated = await translator.translate(
      text.trim(),
      languageTags[from],
      languageTags[to],
    );
    return typeof translated === "string" && translated.trim()
      ? translated.trim()
      : undefined;
  } catch {
    return undefined;
  }
}
