import { create } from "zustand";

export type GenerateStatus = "idle" | "generating" | "success" | "error";

export interface TemplateGenerateState {
  status: GenerateStatus;
  category: "asset" | "quality" | null;
  message: string;
  error: string;
  startedAt: number | null;
  setStatus: (status: GenerateStatus) => void;
  start: (category: "asset" | "quality") => void;
  succeed: (message?: string) => void;
  fail: (error?: string) => void;
  reset: () => void;
}

export const useTemplateGenerateStore = create<TemplateGenerateState>(
  (set) => ({
    status: "idle",
    category: null,
    message: "",
    error: "",
    startedAt: null,
    setStatus: (status) => set({ status }),
    start: (category) =>
      set({
        status: "generating",
        category,
        message: "",
        error: "",
        startedAt: Date.now(),
      }),
    succeed: (message = "Template generated successfully") =>
      set({ status: "success", message, error: "" }),
    fail: (error = "Failed to generate template") =>
      set({ status: "error", error, message: "" }),
    reset: () =>
      set({
        status: "idle",
        category: null,
        message: "",
        error: "",
        startedAt: null,
      }),
  })
);
