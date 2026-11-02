import { validWardrobeId, wardrobeNameError } from "../utils/wardrobes";
import { createSlice } from "@reduxjs/toolkit";
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
  fit: string;
  season?: string;
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
        season: action.payload.season,
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
      state.items[itemIndex].type = action.payload.type;
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
      state.items[itemIndex].season = action.payload.season;
    },
    addCollection: (state, action) => {
      state.collectionTags.push({
        value: action.payload.name,
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
  moveCollection,
  addLog,
  deleteLog,
  addEventLog,
  deleteEventLog,
  itemRefresher,
  deleteItem,
  importItems,
} = itemsSlice.actions;
export default itemsSlice.reducer;
