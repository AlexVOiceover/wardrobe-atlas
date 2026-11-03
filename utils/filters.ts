import { item, logsType } from "../redux/itemsSlice";
import { categorizeColor, NO_COLOR } from "./colors";

function desc(array: any[], sub: string) {
  array.sort((a, b) => {
    if (a[`${sub}`] > b[`${sub}`]) {
      return -1;
    }
    if (a[`${sub}`] < b[`${sub}`]) {
      return 1;
    }
    return 0;
  });
}
function asc(array: any[], sub: string) {
  array.sort((a, b) => {
    if (a[`${sub}`] < b[`${sub}`]) {
      return -1;
    }
    if (a[`${sub}`] > b[`${sub}`]) {
      return 1;
    }
    return 0;
  });
}

function nameAsc(array: any[], sub: string) {
  array.sort((a, b) => {
    const nameA = a[`${sub}`].toUpperCase(); // Convert names to uppercase for case-insensitive sorting
    const nameB = b[`${sub}`].toUpperCase();

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
    return 0;
  });
}
function nameDesc(array: any[], sub: string) {
  array.sort((a, b) => {
    const nameA = a[`${sub}`].toUpperCase();
    const nameB = b[`${sub}`].toUpperCase();

    if (nameA > nameB) {
      return -1;
    }
    if (nameA < nameB) {
      return 1;
    }
    return 0;
  });
}

// Garments without a purchase date go last in both directions.
function byPurchaseDate(array: item[], direction: 1 | -1) {
  array.sort((a, b) => {
    if (!a.purchaseDate || !b.purchaseDate) {
      return (a.purchaseDate ? 0 : 1) - (b.purchaseDate ? 0 : 1);
    }
    if (a.purchaseDate === b.purchaseDate) {
      return 0;
    }
    return (a.purchaseDate < b.purchaseDate ? -1 : 1) * direction;
  });
}

export function LogFilter(
  sortValue: string,
  array: logsType[],
  search: string,
) {
  let newArray = array.filter(x =>
    x.eventName.toLowerCase().includes(search.toLowerCase()),
  );
  switch (sortValue) {
    //lastAdded
    case "LA":
      desc(newArray, "logTime");
      break;
    case "NA":
      nameAsc(newArray, "eventName");
      break;
    case "ND":
      nameDesc(newArray, "eventName");
      break;
    case "DA":
      asc(newArray, "eventDate");
      break;
    case "DD":
      desc(newArray, "eventDate");
      break;
  }
  return newArray;
}

// Filter colors a garment belongs to; empty color slots are ignored, so
// "No color" only matches garments without any usable color.
function garmentColorKeys(garment: item) {
  const keys = [
    garment.primaryColor,
    garment.secondaryColor,
    garment.tertiaryColor,
  ]
    .map(color => categorizeColor(color || ""))
    .filter(key => key !== NO_COLOR);
  return keys.length > 0 ? keys : [NO_COLOR];
}
function matchesColors(garment: item, colors: string[]) {
  return garmentColorKeys(garment).some(key => colors.includes(key));
}

export type SortValuesType = {
  sortValue: string;
  categories: number[];
  types: string[];
  season: string;
  colors: string[];
};
export function HomeFilter(
  filters: SortValuesType,
  array: item[][],
  is2D: true,
): item[][];
export function HomeFilter(
  filters: SortValuesType,
  array: item[],
  is2D: false,
): item[];
export function HomeFilter(
  filters: SortValuesType,
  array: item[] | item[][],
  is2D: boolean,
) {
  if (is2D) {
    let newArray = array as item[][];
    for (let i in array) {
      switch (filters.sortValue) {
        case "LA":
          newArray = array as item[][];
          break;
        case "NA":
          nameAsc(newArray[i], "name");
          break;
        case "ND":
          nameDesc(newArray[i], "name");
          break;
        case "PDA":
          byPurchaseDate(newArray[i], 1);
          break;
        case "PDD":
          byPurchaseDate(newArray[i], -1);
          break;
      }

      if (filters.categories.length > 0) {
        newArray[i] = newArray[i].filter(garment =>
          filters.categories.includes(garment.category),
        );
      }

      if (filters.types.length > 0) {
        newArray[i] = newArray[i].filter(garment =>
          filters.types.includes(garment.type),
        );
      }
      if (filters.season !== "") {
        newArray[i] = newArray[i].filter(
          garment => filters.season === garment.season,
        );
      }
      if (filters.colors.length > 0) {
        newArray[i] = newArray[i].filter(garment =>
          matchesColors(garment, filters.colors),
        );
      }
    }
    return newArray;
  } else {
    let newArray = array as item[];
    switch (filters.sortValue) {
      case "LA":
        break;
      case "NA":
        nameAsc(newArray, "name");
        break;
      case "ND":
        nameDesc(newArray, "name");
        break;
      case "PDA":
        byPurchaseDate(newArray, 1);
        break;
      case "PDD":
        byPurchaseDate(newArray, -1);
        break;
    }

    if (filters.categories.length > 0) {
      newArray = newArray.filter(garment =>
        filters.categories.includes(garment.category),
      );
    }

    if (filters.types.length > 0) {
      newArray = newArray.filter(garment =>
        filters.types.includes(garment.type),
      );
    }
    if (filters.season !== "") {
      newArray = newArray.filter(garment => filters.season === garment.season);
    }
    if (filters.colors.length > 0) {
      newArray = newArray.filter(garment =>
        matchesColors(garment, filters.colors),
      );
    }
    return newArray;
  }
}

export function activeFilterCount(filters: {
  seasonFilter: string;
  categoriesFilter: unknown[];
  TypeFilter: unknown[];
  colorFilter: unknown[];
}) {
  return (
    (filters.seasonFilter ? 1 : 0) +
    filters.categoriesFilter.length +
    filters.TypeFilter.length +
    filters.colorFilter.length
  );
}
export function filterCollectionsBySearch(array: item[][], search: string) {
  if (!search) return array;
  const searchLower = search.toLowerCase();
  return array.map(collection =>
    collection.filter(x => x.name.toLowerCase().includes(searchLower)),
  );
}

export function filterItemsBySearch(array: item[], search: string) {
  if (!search) return array;
  const searchLower = search.toLowerCase();
  return array.filter(x => x.name.toLowerCase().includes(searchLower));
}
