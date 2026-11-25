import { create } from "zustand";
import type { ChatMessage, QuestionId } from "../ask-atlas/types";

type NexaChatState = {
  open: boolean;
  messages: ChatMessage[];
  setOpen: (open: boolean) => void;
  /** Adds the question and Nexa's reply; an unknown question gets the fallback reply. */
  ask: (text: string, questionId: QuestionId | null, fallbackText: string) => void;
  reset: () => void;
};

/**
 * The side-drawer chat. It lives in memory, so the conversation follows the reader from screen
 * to screen while they ask about each one; a reload starts a new chat.
 */
export const useNexaChatStore = create<NexaChatState>()((set) => ({
  open: false,
  messages: [],
  setOpen: (open) => set({ open }),
  ask: (text, questionId, fallbackText) =>
    set((state) => {
      const n = state.messages.length;
      return {
        messages: [
          ...state.messages,
          { id: `drawer-u${n}`, role: "user", text },
          { id: `drawer-a${n}`, role: "atlas", questionId, text: questionId === null ? fallbackText : "" }
        ]
      };
    }),
  reset: () => set({ messages: [] })
}));
