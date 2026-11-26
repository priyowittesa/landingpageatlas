import type { EpiAction } from "./actions-store";

/** Owner roles from the org chart (PROBIS, STO_KONTRAKTOR) plus Finance (Keuangan). */
export const OWNER_ROLES = [
  "SM Operasi dan Teknik",
  "ASM Teknik",
  "Manager Perencanaan",
  "Manager Pengendalian Teknik",
  "Jr Manager Pengendalian Investasi dan Pemeliharaan",
  "Project Manager",
  "Site Manager",
  "Admin Proyek",
  "Finance"
] as const;

export type DemoRoleId = "pm" | "engineering-manager" | "finance" | "director";
export type ActionPermission = "create" | "assign" | "status" | "close";

export type DemoRole = {
  id: DemoRoleId;
  label: string;
  description: string;
  /** Owner roles whose actions this demo role handles */
  ownerRoles: string[];
  /** own: may change or close only the actions it owns; all: any action */
  scope: "own" | "all";
  can: Record<ActionPermission, boolean>;
};

export const DEFAULT_DEMO_ROLE: DemoRoleId = "director";

/** Demo only: switches what the screen enables. There is no real authentication. */
export const DEMO_ROLES: DemoRole[] = [
  {
    id: "pm",
    label: "Project Manager",
    description: "Raises and works own project actions; cannot reassign or close.",
    ownerRoles: ["Project Manager", "Site Manager", "Admin Proyek"],
    scope: "own",
    can: { create: true, assign: false, status: true, close: false }
  },
  {
    id: "engineering-manager",
    label: "Engineering Manager",
    description: "ASM Teknik and the managers below: confirms alerts, assigns and closes own actions.",
    ownerRoles: [
      "ASM Teknik",
      "Manager Perencanaan",
      "Manager Pengendalian Teknik",
      "Jr Manager Pengendalian Investasi dan Pemeliharaan"
    ],
    scope: "own",
    can: { create: true, assign: true, status: true, close: true }
  },
  {
    id: "finance",
    label: "Finance",
    description: "Works and closes billing and Retensi actions; read-only elsewhere.",
    ownerRoles: ["Finance"],
    scope: "own",
    can: { create: false, assign: false, status: true, close: true }
  },
  {
    id: "director",
    label: "Director (SM Operasi dan Teknik)",
    description: "Releases letters and payment requests; full control of every action.",
    ownerRoles: ["SM Operasi dan Teknik"],
    scope: "all",
    can: { create: true, assign: true, status: true, close: true }
  }
];

export function getDemoRole(id: DemoRoleId): DemoRole {
  return DEMO_ROLES.find((role) => role.id === id) ?? DEMO_ROLES[0]!;
}

/** True when the action belongs to the demo role (highlighted on screen). */
export function isRelevantTo(role: DemoRole, action: Pick<EpiAction, "ownerRole">): boolean {
  return role.ownerRoles.includes(action.ownerRole);
}

/** Status and close depend on the action; create and assign are global. */
export function canPerform(
  role: DemoRole,
  permission: ActionPermission,
  action?: Pick<EpiAction, "ownerRole">
): boolean {
  if (!role.can[permission]) return false;
  if (permission === "create" || permission === "assign") return true;
  if (role.scope === "all") return true;
  return action !== undefined && isRelevantTo(role, action);
}
