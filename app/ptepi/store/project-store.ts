import { create } from "zustand";

/** The project the sidebar links open on when no project is chosen. */
export const DEFAULT_PROJECT_ID = "PNP126";

type ProjectState = {
  /** null means all projects, the default view of Commercial and Cost */
  projectId: string | null;
  setProject: (projectId: string | null) => void;
};

/** In memory only. Project routes keep it in sync with the URL. */
export const useProjectStore = create<ProjectState>()((set) => ({
  projectId: null,
  setProject: (projectId) => set({ projectId })
}));
