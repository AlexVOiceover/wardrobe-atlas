import { validWardrobeId, wardrobeNameError } from "../utils/wardrobes";
import { SEASONS } from "../utils/data";
import { defaultStyles } from "../utils/styles";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import "react-native-get-random-values";
import { nanoid } from "nanoid";
import {
  moveCollectionTag,
  normalizeCollectionTags,
} from "../utils/collectionOrder";
export type logsType = {
  eventId: string; //common ID for any combined items.
  eventDate: string;
  eventName: string;
  additionalNotes?: string;
  logTime: string; //iso??
};
export type Wardrobe = { id: string; name: string };
export type item = {
  wardrobeId?: string;
  id: string;
  name: string;
  type: string;
  brand?: string;
  fit: string;
  // Seasons the garment is worn in; new garments get all four.
  seasons?: string[];
  // Casual, sporty, elegant, formal; used to suggest outfits.
  styles?: string[];
  // Put away (e.g. next season's box); missing means in use.
  stored?: boolean;
  quantity: number;
  size: number;
  sizeUnit: string;
  category: number;
  collection?: string[];
  purchaseDate?: string;
  image: string;
  automaticColor?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  logIds?: string[];
};
export type itemsList = {
  wardrobes: Wardrobe[];
  items: item[];
  collectionTags: CollectionTag[];
  logs: logsType[];
  refreshItems: boolean;
};
export type CollectionTag = {
  label: string;
  value: string;
  color?: string;
  isOpen: boolean;
  arrangement: number;
};
/**
 * The id a new collection with this name gets. A renamed collection keeps its
 * old name as its id, so an id is never reused: "Trip (2)" and so on.
 */
export function newCollectionValue(tags: CollectionTag[], name: string) {
  let value = name;
  for (let n = 2; tags.some(t => t.value === value); n++)
    value = `${name} (${n})`;
  return value;
}
const initialState: itemsList = {
  wardrobes: [],
  items: [],
  collectionTags: [],
  logs: [],
  refreshItems: false,
};
const itemsSlice = createSlice({
  name: "itemsList",
  initialState: initialState,
  reducers: {
    addWardrobe: (state, action) => {
      if (!wardrobeNameError(state.wardrobes, action.payload.name))
        state.wardrobes.push({
          id: nanoid(),
          name: action.payload.name.trim(),
        });
    },
    renameWardrobe: (state, action) => {
      const wardrobe = state.wardrobes.find(w => w.id === action.payload.id);
      if (
        wardrobe &&
        !wardrobeNameError(state.wardrobes, action.payload.name, wardrobe.id)
      )
        wardrobe.name = action.payload.name.trim();
    },
    deleteWardrobe: (state, action) => {
      state.wardrobes = state.wardrobes.filter(w => w.id !== action.payload.id);
      state.items.forEach(item => {
        if (item.wardrobeId === action.payload.id) delete item.wardrobeId;
      });
    },
    addItem: (state, action) => {
      state.items.push({
        wardrobeId: validWardrobeId(state.wardrobes, action.payload.wardrobeId),
        id: nanoid(),
        name: action.payload.name,
        image: action.payload.image,
        type: action.payload.type,
        brand: action.payload.brand || "",
        fit: action.payload.fit,
        sizeUnit: action.payload.sizeUnit,
        size: action.payload.size,
        quantity: action.payload.quantity,
        collection:
          action.payload.collection.length === 0
            ? []
            : action.payload.collection,
        category: action.payload.category,
        automaticColor: action.payload.automaticColor || false,
        purchaseDate: action.payload.purchaseDate,
        primaryColor: action.payload.primaryColor,
        secondaryColor: action.payload.secondaryColor,
        tertiaryColor: action.payload.tertiaryColor,
        logIds: [],
        seasons: action.payload.seasons ?? [...SEASONS],
        stored: action.payload.stored === true,
        styles: action.payload.styles ?? defaultStyles(action.payload.type),
      } as item);
    },
    updateItem: (state, action) => {
      const itemIndex = action.payload.id
        ? state.items.findIndex(item => item.id === action.payload.id)
        : action.payload.itemIndex;
      if (!state.items[itemIndex]) return;
      if ("wardrobeId" in action.payload)
        state.items[itemIndex].wardrobeId = validWardrobeId(
          state.wardrobes,
          action.payload.wardrobeId,
        );
      state.items[itemIndex].name = action.payload.name;
      state.items[itemIndex].image = action.payload.image;
      if (typeof action.payload.category === "number")
        state.items[itemIndex].category = action.payload.category;
      state.items[itemIndex].type = action.payload.type;
      if ("brand" in action.payload)
        state.items[itemIndex].brand = action.payload.brand;
      state.items[itemIndex].fit = action.payload.fit;
      state.items[itemIndex].size = action.payload.size;
      state.items[itemIndex].sizeUnit = action.payload.sizeUnit;
      state.items[itemIndex].quantity = action.payload.quantity;
      state.items[itemIndex].collection =
        action.payload.collection.length === 0 ? [] : action.payload.collection;
      state.items[itemIndex].automaticColor = action.payload.automaticColor;
      state.items[itemIndex].purchaseDate = action.payload.purchaseDate;
      state.items[itemIndex].primaryColor = action.payload.primaryColor;
      state.items[itemIndex].secondaryColor = action.payload.secondaryColor;
      state.items[itemIndex].tertiaryColor = action.payload.tertiaryColor;
      if (Array.isArray(action.payload.styles))
        state.items[itemIndex].styles = action.payload.styles;
      if ("stored" in action.payload)
        state.items[itemIndex].stored = action.payload.stored === true;
      if (Array.isArray(action.payload.seasons))
        state.items[itemIndex].seasons = action.payload.seasons;
    },
    addCollection: (state, action) => {
      state.collectionTags.push({
        value: newCollectionValue(state.collectionTags, action.payload.name),
        label: action.payload.name,
        color: action.payload.color,
        isOpen: true,
        arrangement: state.collectionTags.length,
      });
    },
    updateCollection: (state, action) => {
      const collectionIndex = state.collectionTags.findIndex(
        x => x.label === action.payload.name || x.value === action.payload.name,
      );
      if (collectionIndex < 0) {
        return;
      }
      state.collectionTags[collectionIndex].label = action.payload.newName;
      if (action.payload.color) {
        state.collectionTags[collectionIndex].color = action.payload.color;
      }
    },
    toggleCollection: (state, action) => {
      const collectionIndex = state.collectionTags.findIndex(
        x => x.label === action.payload.name || x.value === action.payload.name,
      );
      if (collectionIndex < 0) {
        return;
      }
      state.collectionTags[collectionIndex].isOpen =
        !state.collectionTags[collectionIndex].isOpen;
    },
    deleteCollection: (state, action) => {
      const collectionIndex = state.collectionTags.findIndex(
        x => x.label === action.payload.name || x.value === action.payload.name,
      );
      if (collectionIndex < 0) {
        return;
      }
      const deletedCollectionValue =
        state.collectionTags[collectionIndex].value;
      state.collectionTags.splice(collectionIndex, 1);
      state.collectionTags = normalizeCollectionTags(state.collectionTags);
      try {
        for (let i = 0; i < state.items.length; i++) {
          let itemCollectionIndex = state.items[i].collection?.findIndex(
            x => x === deletedCollectionValue,
          );
          if (itemCollectionIndex !== undefined && itemCollectionIndex !== -1) {
            state.items[i].collection?.splice(itemCollectionIndex, 1);
          }
        }
      } catch (err) {
        console.log("Error occurred at deleteCollection: " + err);
      }
    },
    // Garments in ids belong to the collection afterwards; the rest don't.
    setCollectionGarments: (state, action) => {
      const { value, ids } = action.payload;
      state.items.forEach(garment => {
        const current = garment.collection ?? [];
        const member = ids.includes(garment.id);
        if (member && !current.includes(value))
          garment.collection = [...current, value];
        if (!member && current.includes(value))
          garment.collection = current.filter(other => other !== value);
      });
    },
    moveCollection: (state, action) => {
      state.collectionTags = moveCollectionTag(
        state.collectionTags,
        action.payload.value,
        action.payload.direction,
      );
    },
    addEventLog: (state, action) => {
      state.logs.push({
        eventDate: action.payload.eventDate,
        eventName: action.payload.eventName,
        eventId: action.payload.eventId,
        logTime: action.payload.logTime,
        additionalNotes: action.payload.additionalNotes,
      } as logsType);
    },
    deleteEventLog: (state, action) => {
      const eventIndex = state.logs.findIndex(
        x => x.eventId === action.payload.selectedLogId,
      );
      if (eventIndex < 0) return;
      state.logs.splice(eventIndex, 1);
    },
    // Undo of a delete: the outfit goes back where it was in the list, and
    // so does its id in each garment's logIds.
    restoreEventLog: (
      state,
      action: PayloadAction<{
        log: logsType;
        index: number;
        garments: { id: string; index: number }[];
      }>,
    ) => {
      const { log, index, garments } = action.payload;
      if (state.logs.some(x => x.eventId === log.eventId)) return;
      state.logs.splice(index, 0, log);
      garments.forEach(garment => {
        const restored = state.items.find(x => x.id === garment.id);
        if (!restored || restored.logIds?.includes(log.eventId)) return;
        const logIds = restored.logIds ?? [];
        logIds.splice(garment.index, 0, log.eventId);
        restored.logIds = logIds;
      });
    },
    // Edits a logged outfit. Given garmentIds, exactly those garments link to
    // it afterwards; garments it keeps stay where they were in their logIds.
    updateEventLog: (
      state,
      action: PayloadAction<{
        eventId: string;
        eventName?: string;
        eventDate?: string;
        additionalNotes?: string;
        garmentIds?: string[];
      }>,
    ) => {
      const { eventId, eventName, eventDate, additionalNotes, garmentIds } =
        action.payload;
      const log = state.logs.find(x => x.eventId === eventId);
      if (!log) return;
      if (eventName !== undefined) log.eventName = eventName;
      if (eventDate !== undefined) log.eventDate = eventDate;
      if (additionalNotes !== undefined) log.additionalNotes = additionalNotes;
      if (!garmentIds) return;
      state.items.forEach(garment => {
        const linked = garment.logIds?.includes(eventId) === true;
        const member = garmentIds.includes(garment.id);
        if (member && !linked)
          garment.logIds = [...(garment.logIds ?? []), eventId];
        if (!member && linked)
          garment.logIds = garment.logIds?.filter(id => id !== eventId);
      });
    },
    addLog: (state, action) => {
      //this added to add the eventId to the item/s
      const itemIndex = state.items.findIndex(
        x => x.id === action.payload.selectedId,
      );
      if (itemIndex < 0) return;
      const logIdsSet = new Set(state.items[itemIndex].logIds || []);
      if (!logIdsSet.has(action.payload.logId)) {
        // if this new log doesn't exist add it to the list
        logIdsSet.add(action.payload.logId);
        state.items[itemIndex].logIds = Array.from(logIdsSet);
      }
    },
    deleteLog: (state, action) => {
      const itemIndices = state.items.reduce(
        (indices: number[], item, index) => {
          if (
            item.logIds &&
            item.logIds.includes(action.payload.selectedLogId)
          ) {
            indices.push(index);
          }
          return indices;
        },
        [],
      );
      for (let i of itemIndices) {
        const logIndex = state.items[i].logIds?.findIndex(
          x => x === action.payload.selectedLogId,
        );
        state.items[i].logIds?.splice(logIndex as number, 1);
      }
    },
    setGarmentsStored: (state, action) => {
      const ids: string[] = action.payload.ids ?? [];
      state.items.forEach(garment => {
        if (ids.includes(garment.id))
          garment.stored = action.payload.stored === true;
      });
    },
    setGarmentsWardrobe: (state, action) => {
      const ids: string[] = action.payload.ids ?? [];
      const wardrobeId = validWardrobeId(
        state.wardrobes,
        action.payload.wardrobeId,
      );
      // An unknown wardrobe means Unassigned, as when a wardrobe is deleted.
      state.items.forEach(garment => {
        if (!ids.includes(garment.id)) return;
        if (wardrobeId) garment.wardrobeId = wardrobeId;
        else delete garment.wardrobeId;
      });
    },
    // Deleting a category or type keeps its garments; they show under Other.
    clearGarmentCategory: (state, action) => {
      state.items.forEach(garment => {
        if (garment.category === action.payload.category) {
          garment.category = -1;
          garment.type = "";
        }
      });
    },
    clearGarmentType: (state, action) => {
      state.items.forEach(garment => {
        if (
          garment.category === action.payload.category &&
          garment.type === action.payload.value
        )
          garment.type = "";
      });
    },
    itemRefresher: state => {
      state.refreshItems = !state.refreshItems;
    },
    deleteItem: (state, action) => {
      const itemIndex = state.items.findIndex(
        x => x.id === action.payload.selectedId,
      );
      if (itemIndex < 0) return;
      state.items.splice(itemIndex, 1);
    },
    importItems: (state, action) => {
      state.wardrobes = action.payload.wardrobes ?? [];
      state.items = action.payload.items;
      state.collectionTags = normalizeCollectionTags(
        action.payload.collectionTags,
      );
      state.logs = action.payload.logs;
      state.refreshItems = action.payload.refreshItems;
    },
  },
});
export const {
  addWardrobe,
  renameWardrobe,
  deleteWardrobe,
  addItem,
  updateItem,
  addCollection,
  toggleCollection,
  deleteCollection,
  updateCollection,
  setCollectionGarments,
  moveCollection,
  addLog,
  deleteLog,
  addEventLog,
  deleteEventLog,
  restoreEventLog,
  updateEventLog,
  setGarmentsStored,
  setGarmentsWardrobe,
  clearGarmentCategory,
  clearGarmentType,
  itemRefresher,
  deleteItem,
  importItems,
} = itemsSlice.actions;
export default itemsSlice.reducer;
