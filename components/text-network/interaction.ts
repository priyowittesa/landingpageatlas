import type { TextGraph } from "@/lib/text-network/types";

/**
 * Mutable interaction state shared by the 2D and 3D renderers. It lives outside React so hover
 * changes never re-render; renderers read it directly from their reducers / animation loops.
 */
export type InteractionState = {
  hovered: string | null;
  selected: string | null;
  focusCommunity: number | null;
};

type Listener = (state: InteractionState, changed: (keyof InteractionState)[]) => void;

export type InteractionStore = ReturnType<typeof createInteractionStore>;

export function createInteractionStore() {
  const state: InteractionState = { hovered: null, selected: null, focusCommunity: null };
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(patch: Partial<InteractionState>) {
      const changed = (Object.keys(patch) as (keyof InteractionState)[]).filter((key) => state[key] !== patch[key]);
      if (!changed.length) return;
      Object.assign(state, patch);
      listeners.forEach((listener) => listener(state, changed));
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

export const activeNode = (state: InteractionState) => state.hovered ?? state.selected;

/** Whether a node is lit given the current hover/selection/topic focus. */
export function isNodeLit(graph: TextGraph, state: InteractionState, node: string) {
  const active = activeNode(state);
  if (active && graph.hasNode(active)) return node === active || graph.areNeighbors(node, active);
  if (state.focusCommunity !== null) return graph.getNodeAttribute(node, "community") === state.focusCommunity;
  return true;
}

export function isEdgeLit(graph: TextGraph, state: InteractionState, source: string, target: string) {
  const active = activeNode(state);
  if (active && graph.hasNode(active)) return source === active || target === active;
  if (state.focusCommunity !== null) {
    return graph.getNodeAttribute(source, "community") === state.focusCommunity && graph.getNodeAttribute(target, "community") === state.focusCommunity;
  }
  return true;
}
