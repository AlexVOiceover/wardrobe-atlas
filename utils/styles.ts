export const STYLES = ["casual", "sporty", "elegant", "formal"];

const CASUAL = ["casual"];
const CASUAL_SPORTY = ["casual", "sporty"];
const CASUAL_ELEGANT = ["casual", "elegant"];
const ELEGANT_FORMAL = ["elegant", "formal"];
// Built-in subcategories (by stored value) and the styles they suit.
const defaults: Record<string, string[]> = {
  ...Object.fromEntries(
    [
      "Hoodie",
      "Joggers",
      "Leggings",
      "Sneakers",
      "Hiking Boots",
      "Winter Boots",
      "Watch",
    ].map(type => [type, CASUAL_SPORTY]),
  ),
  "Running Shoes": ["sporty"],
  ...Object.fromEntries(
    [
      "Shirt",
      "Blouse",
      "Jacket",
      "Polo Shirt",
      "Sweater",
      "Turtleneck",
      "Jeans",
      "Skirt",
      "Leather Pants",
      "Boots",
      "Casual Shoes",
      "Necklace",
      "Bracelet",
      "Ring",
      "Earrings",
      "Handbag",
      "Belt",
      "Scarf",
      "Gloves",
    ].map(type => [type, CASUAL_ELEGANT]),
  ),
  ...Object.fromEntries(
    [
      "Blazer",
      "Trousers",
      "Loafers",
      "Dress Shoes",
      "High Heels",
      "Clutch",
      "Tie",
    ].map(type => [type, ELEGANT_FORMAL]),
  ),
  // Never part of a suggested outfit.
  "Upper Underwear": [],
  Underwear: [],
};

/** Styles a garment starts with, from its subcategory; Casual otherwise. */
export const defaultStyles = (type?: string) => [
  ...(type !== undefined && type in defaults ? defaults[type] : CASUAL),
];
