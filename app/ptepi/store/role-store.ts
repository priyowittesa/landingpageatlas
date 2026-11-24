import { create } from "zustand";
import { DEFAULT_DEMO_ROLE, type DemoRoleId } from "./roles";

type RoleState = {
  roleId: DemoRoleId;
  setRole: (roleId: DemoRoleId) => void;
};

/** Demo role switcher state. In memory only: no real authentication. */
export const useRoleStore = create<RoleState>()((set) => ({
  roleId: DEFAULT_DEMO_ROLE,
  setRole: (roleId) => set({ roleId })
}));
