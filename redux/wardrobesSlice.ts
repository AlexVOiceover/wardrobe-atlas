import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import "react-native-get-random-values";
import { nanoid } from "nanoid";

// A wardrobe can be a country, house, room or physical wardrobe.
// parentId === null means that it is a top-level location.
export type WardrobeLocation = {
  id: string;
  name: string;
  parentId: string | null;
};

export type WardrobesState = {
  locations: WardrobeLocation[];
};

const initialState: WardrobesState = { locations: [] };

const wardrobesSlice = createSlice({
  name: "wardrobes",
  initialState,
  reducers: {
    addWardrobe: (
      state,
      action: PayloadAction<{ name: string; parentId?: string | null }>,
    ) => {
      const name = action.payload.name.trim();
      const parentId = action.payload.parentId ?? null;
      if (!name || (parentId !== null && !state.locations.some((l) => l.id === parentId))) {
        return;
      }
      state.locations.push({ id: nanoid(), name, parentId });
    },
    renameWardrobe: (
      state,
      action: PayloadAction<{ id: string; name: string }>,
    ) => {
      const location = state.locations.find((l) => l.id === action.payload.id);
      const name = action.payload.name.trim();
      if (location && name) {
        location.name = name;
      }
    },
    moveWardrobe: (
      state,
      action: PayloadAction<{ id: string; parentId: string | null }>,
    ) => {
      const location = state.locations.find((l) => l.id === action.payload.id);
      if (!location) return;
      const parentId = action.payload.parentId;
      // Prevent cycles: a location cannot become its own ancestor.
      const visited = new Set<string>([location.id]);
      let cursor = parentId;
      while (cursor !== null) {
        if (visited.has(cursor)) return;
        visited.add(cursor);
        const parent = state.locations.find((l) => l.id === cursor);
        if (!parent) return;
        cursor = parent.parentId;
      }
      location.parentId = parentId;
    },
    importWardrobes: (
      state,
      action: PayloadAction<WardrobeLocation[]>,
    ) => {
      state.locations = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const {
  addWardrobe,
  renameWardrobe,
  moveWardrobe,
  importWardrobes,
} = wardrobesSlice.actions;
export default wardrobesSlice.reducer;
