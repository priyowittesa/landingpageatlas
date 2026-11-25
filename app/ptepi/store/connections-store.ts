import { create } from "zustand";
import { CONNECTIONS } from "../workflows/data";
import { initialActiveMap, type ActiveMap } from "../workflows/logic";

type ConnectionsState = {
  active: ActiveMap;
  setActive: (connectionId: string, value: boolean) => void;
};

/**
 * Active switches of Master Connections. Kept for the browser session only, so a
 * reload restores the demo set; Workflow Studio reads it to simulate a run.
 */
export const useConnectionsStore = create<ConnectionsState>()((set) => ({
  active: initialActiveMap(CONNECTIONS),
  setActive: (connectionId, value) =>
    set((state) => ({ active: { ...state.active, [connectionId]: value } }))
}));
