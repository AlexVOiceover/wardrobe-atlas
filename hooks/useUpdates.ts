import { useSyncExternalStore } from "react";
import { getUpdateState, subscribeToUpdates } from "../utils/updateService";
export const useUpdates = () =>
  useSyncExternalStore(subscribeToUpdates, getUpdateState, getUpdateState);
