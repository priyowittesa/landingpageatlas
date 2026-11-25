import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeStorage } from "./actions-store";

export type Language = "en" | "id";

type LanguageState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

/** Interface language of the demo, Bahasa Indonesia by default. Saved per browser; rehydrated once by PtepiShell. */
export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: "id",
      setLanguage: (language) => set({ language })
    }),
    {
      name: "ptepi-language",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true
    }
  )
);
