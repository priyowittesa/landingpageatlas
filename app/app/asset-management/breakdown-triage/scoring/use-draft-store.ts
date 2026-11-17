import { create } from "zustand";

interface DraftState {
  /** Whether the LLM-suggested weights card was dismissed; survives navigation between triage pages. */
  aiDismissed: boolean;
  dismissAi: () => void;
}

export const useScoringDraftStore = create<DraftState>((set) => ({
  aiDismissed: false,
  dismissAi: () => set({ aiDismissed: true }),
}));
