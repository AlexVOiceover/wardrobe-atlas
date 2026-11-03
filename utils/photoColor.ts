import type { ImageSegmentConfig } from "@somesoap/react-native-image-palette";

// Side of the sampled square, in percent of the photo's width and height.
// Averaging a small area keeps fabric texture and single noisy pixels out.
export const SAMPLE_SIZE = 3;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Maps a tap on the displayed photo to the area the palette library averages.
 * The library takes whole percentages, and each side must be at least 1 wide,
 * so the square is shifted inside the photo near the edges.
 */
export function sampleSegment(
  x: number,
  y: number,
  width: number,
  height: number,
  size = SAMPLE_SIZE,
): ImageSegmentConfig {
  const axis = (position: number, length: number) => {
    const center = clamp((position / length) * 100, 0, 100);
    const from = clamp(Math.round(center - size / 2), 0, 100 - size);
    return [from, from + size];
  };
  const [fromX, toX] = axis(x, width);
  const [fromY, toY] = axis(y, height);
  return { fromX, toX, fromY, toY };
}

export const normalizeHex = (color: string) => {
  const hex = color.trim().replace(/^#/, "").toUpperCase();
  // Some Android builds return ARGB; keep the RGB part.
  return `#${hex.length === 8 ? hex.slice(2) : hex}`;
};
