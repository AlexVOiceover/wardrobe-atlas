import { categorizeColor, NO_COLOR } from "./colors";
import { colorNames } from "./localization";

/**
 * Default garment name in the form "Color Brand Type", e.g. "Navy Benetton
 * Sweater". The color is the primary color's filter name in the app language;
 * missing parts are skipped.
 */
export function garmentName({
  primaryColor,
  brand,
  typeLabel,
  language,
}: {
  primaryColor?: string;
  brand?: string;
  typeLabel?: string;
  language: number;
}) {
  const colorKey = categorizeColor(primaryColor || "");
  const color =
    colorKey === NO_COLOR ? "" : colorNames[language]?.[colorKey] ?? "";
  return [color, brand, typeLabel]
    .map(part => (part || "").trim())
    .filter(Boolean)
    .join(" ");
}
