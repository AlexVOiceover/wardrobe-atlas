export const defaultCollectionColor = "#242424";

// Colors offered by the Closet color filter, neutrals first. Each entry lists
// reference shades (mostly standard named colors); the first is the swatch shown
// in the filter. A garment color is filed under the closest reference shade.
const colorReferences: { [key: string]: string[] } = {
  black: ["#1C1C1C", "#000000", "#2B2B2B"],
  gray: [
    "#8E8E8E",
    "#808080",
    "#A9A9A9",
    "#C0C0C0",
    "#D3D3D3",
    "#696969",
    "#36454F",
    "#555555",
  ],
  white: ["#F7F7F2", "#FFFFFF", "#FFFFF0", "#F8F8FF", "#FDF5E6", "#F5F5F5"],
  beige: [
    "#D9C7A7",
    "#F5F5DC",
    "#D2B48C",
    "#FAEBD7",
    "#F5DEB3",
    "#FFFDD0",
    "#C3B091",
    "#E8D8C0",
  ],
  brown: [
    "#6F4E37",
    "#8B4513",
    "#5C4033",
    "#A0522D",
    "#483C32",
    "#704214",
    "#7B3F00",
    "#964B00",
  ],
  khaki: [
    "#7A7A45",
    "#4B5320",
    "#556B2F",
    "#6B8E23",
    "#BDB76B",
    "#8A865D",
    "#78866B",
  ],
  green: [
    "#2E7D4F",
    "#008000",
    "#00FF00",
    "#228B22",
    "#006400",
    "#3CB371",
    "#50C878",
    "#008080",
    "#2E8B57",
  ],
  navy: ["#1F2A44", "#000080", "#191970", "#1E3A5F", "#2C3E50", "#0B1F3A"],
  blue: [
    "#3E6DB5",
    "#0000FF",
    "#4169E1",
    "#1560BD",
    "#4682B4",
    "#0047AB",
    "#1E90FF",
  ],
  lightBlue: [
    "#A7C7E7",
    "#87CEEB",
    "#ADD8E6",
    "#B0C4DE",
    "#89CFF0",
    "#40E0D0",
    "#AFEEEE",
  ],
  purple: [
    "#6A4C93",
    "#800080",
    "#7F00FF",
    "#8E4585",
    "#9370DB",
    "#DA70D6",
    "#E6E6FA",
    "#4B0082",
    "#C8A2C8",
  ],
  pink: [
    "#E8A5B8",
    "#FFC0CB",
    "#FF69B4",
    "#FFB6C1",
    "#DE3163",
    "#B76E79",
    "#F4C2C2",
    "#FF1493",
    "#AA336A",
  ],
  red: [
    "#B22222",
    "#FF0000",
    "#DC143C",
    "#C41E3A",
    "#9B111E",
    "#E0115F",
    "#A52A2A",
  ],
  burgundy: ["#6D1A2E", "#800020", "#800000", "#722F37", "#5E1914"],
  orange: [
    "#E07B39",
    "#FFA500",
    "#FF7F50",
    "#FF4500",
    "#E2725B",
    "#FF8C00",
    "#CC5500",
    "#F28500",
  ],
  yellow: [
    "#E8C547",
    "#FFFF00",
    "#FFD700",
    "#F0E68C",
    "#FFDB58",
    "#FADA5E",
    "#E1AD01",
  ],
};
export const clothingColors: { [key: string]: string } = Object.fromEntries(
  Object.entries(colorReferences).map(([name, shades]) => [name, shades[0]]),
);
// Filter key for garments without a usable color
export const NO_COLOR = "none";

type Lab = [number, number, number];

function parseHex(hexColor: string): [number, number, number] | undefined {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hexColor.trim());
  if (!match) {
    return undefined;
  }
  const hex =
    match[1].length === 3
      ? match[1]
          .split("")
          .map(c => c + c)
          .join("")
      : match[1];
  return [0, 2, 4].map(i => parseInt(hex.substring(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

// sRGB → OKLab, where straight-line distance tracks perceived difference
// (more even than CIELAB in blues and purples)
function toLab([r, g, b]: [number, number, number]): Lab {
  const [lr, lg, lb] = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const referenceLab = Object.entries(colorReferences).flatMap(([name, shades]) =>
  shades.map(hex => [name, toLab(parseHex(hex)!)] as const),
);

export function categorizeColor(hexColor: string) {
  const rgb = parseHex(hexColor || "");
  if (!rgb) {
    return NO_COLOR;
  }
  const [l, a, b] = toLab(rgb);
  let best = NO_COLOR;
  let bestDistance = Infinity;
  for (const [name, [pl, pa, pb]] of referenceLab) {
    const distance = (l - pl) ** 2 + (a - pa) ** 2 + (b - pb) ** 2;
    if (distance < bestDistance) {
      best = name;
      bestDistance = distance;
    }
  }
  return best;
}
