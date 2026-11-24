import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { stripScreenCode } from "./action-helpers";
import type { ActionAutonomy } from "../types";

export type ActionStatus = "open" | "in-progress" | "done";

/** An alert or task raised by the Orchestration agents. S8 shows these. */
export type EpiAction = {
  id: string;
  title: string;
  projectId: string;
  ownerRole: string;
  /** ISO date, YYYY-MM-DD */
  dueDate: string;
  status: ActionStatus;
  /** Where the action came from, e.g. "S4 Evidence gate: PNP126 stage 2" */
  source: string;
  autonomy: ActionAutonomy;
};

export type NewEpiAction = Omit<EpiAction, "id" | "status"> & {
  status?: ActionStatus;
};

type ActionsState = {
  actions: EpiAction[];
  nextNumber: number;
  /** True once the seeded exceptions were loaded, so they load only once */
  seeded: boolean;
  /**
   * Adds an action. When an unfinished action with the same source already
   * exists it is returned instead, so one blocked stage never creates two tasks.
   */
  addAction: (input: NewEpiAction) => EpiAction;
  /** Loads seeded actions once; actions whose source already exists are skipped. */
  seed: (seeds: EpiAction[]) => void;
  assignAction: (id: string, ownerRole: string) => void;
  setStatus: (id: string, status: ActionStatus) => void;
  reset: () => void;
};

const INITIAL_STATE = { actions: [] as EpiAction[], nextNumber: 1, seeded: false };

export const ACTIONS_STORAGE_KEY = "ptepi-actions";

/** localStorage that never throws: private mode, blocked storage and SSR fall back to memory. */
export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage is optional; the in-memory state keeps working.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Same as setItem.
    }
  }
};

export const useActionsStore = create<ActionsState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addAction: (input) => {
        const existing = get().actions.find(
          (action) => action.source === input.source && action.status !== "done"
        );
        if (existing) return existing;

        const { nextNumber } = get();
        const action: EpiAction = {
          ...input,
          id: `ACT-${String(nextNumber).padStart(3, "0")}`,
          status: input.status ?? "open"
        };
        set((state) => ({
          actions: [...state.actions, action],
          nextNumber: state.nextNumber + 1
        }));
        return action;
      },

      seed: (seeds) => {
        if (get().seeded) return;
        set((state) => {
          const known = new Set(state.actions.map((action) => action.source));
          return {
            actions: [...state.actions, ...seeds.filter((seed) => !known.has(seed.source))],
            seeded: true
          };
        });
      },

      assignAction: (id, ownerRole) =>
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id ? { ...action, ownerRole } : action
          )
        })),

      setStatus: (id, status) =>
        set((state) => ({
          actions: state.actions.map((action) =>
            action.id === id ? { ...action, status } : action
          )
        })),

      reset: () => set(INITIAL_STATE)
    }),
    {
      name: ACTIONS_STORAGE_KEY,
      // v2: sources name the screen instead of an internal code ("S4 Evidence gate" -> "Evidence gate").
      version: 2,
      migrate: (persisted) => {
        const state = persisted as { actions?: EpiAction[] } | null;
        return {
          ...state,
          actions: (state?.actions ?? []).map((action) => ({
            ...action,
            source: stripScreenCode(action.source)
          }))
        } as never;
      },
      storage: createJSONStorage(() => safeStorage),
      // Rehydrated once on the client by PtepiShell, so server and first client render match.
      skipHydration: true,
      partialize: (state) => ({
        actions: state.actions,
        nextNumber: state.nextNumber,
        seeded: state.seeded
      })
    }
  )
);

/** True when an unfinished action with this source exists. */
export const selectHasOpenAction = (source: string) => (state: ActionsState) =>
  state.actions.some((action) => action.source === source && action.status !== "done");
