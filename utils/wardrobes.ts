import type { item, Wardrobe } from "../redux/itemsSlice";
export const validWardrobeId = (wardrobes: Wardrobe[], id?: string) =>
  wardrobes.some(w => w.id === id) ? id : undefined;
export function wardrobeNameError(
  wardrobes: Wardrobe[],
  name: string,
  id?: string,
) {
  if (!name.trim()) return "WardrobeNameRequired";
  if (
    wardrobes.some(
      w => w.id !== id && w.name.toLowerCase() === name.trim().toLowerCase(),
    )
  )
    return "WardrobeNameDuplicate";
  return undefined;
}
export function normalizeWardrobes(value: unknown): Wardrobe[] {
  const result: Wardrobe[] = [];
  if (!Array.isArray(value)) return result;
  for (const w of value) {
    if (
      !w ||
      typeof w.id !== "string" ||
      !w.id.trim() ||
      typeof w.name !== "string"
    )
      continue;
    if (
      result.some(entry => entry.id === w.id) ||
      wardrobeNameError(result, w.name)
    )
      continue;
    result.push({ id: w.id, name: w.name.trim() });
  }
  return result;
}
// undefined = All; empty string = Unassigned; otherwise a stable wardrobe ID.
export function filterByWardrobe(items: item[], id?: string) {
  return items.filter(
    item =>
      id === undefined ||
      (id === "" ? !item.wardrobeId : item.wardrobeId === id),
  );
}
