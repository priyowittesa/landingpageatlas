import { create } from "zustand";

type BreadcrumbItem = {
  title: string;
  href?: string;
};

type BreadcrumbState = {
  items: BreadcrumbItem[];
  setItems: (items: BreadcrumbItem[]) => void;
  clear: () => void;
};

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
  clear: () => set({ items: [] }),
}));
