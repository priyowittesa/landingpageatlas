import {
  BrainCircuit,
  CircleDollarSign,
  ClipboardCheckIcon,
  Gauge,
  LayoutGrid,
  ListChecks,
  ShieldCheckIcon,
  Wrench
} from "lucide-react";
import {
  extractNavHrefs,
  findActiveNavHref,
  type NavSection
} from "@/components/layout/dasbhoard/navigation";

/** The project the project-level screens open on from the sidebar. */
export const HERO_PROJECT_PATH = "/ptepi/project/PNP126";

/** Sidebar of the public prototype. Same NavNode shape as the ATLAS app sidebar. */
export const PTEPI_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [{ title: "Portfolio Health", href: "/ptepi", icon: LayoutGrid }]
  },
  {
    title: "Delivery",
    items: [
      { title: "Project Cockpit", href: HERO_PROJECT_PATH, icon: Gauge },
      { title: "Evidence Gate", href: `${HERO_PROJECT_PATH}/evidence`, icon: ShieldCheckIcon }
    ]
  },
  {
    title: "Commercial",
    items: [
      { title: "Commercial and Billing", href: "/ptepi/commercial", icon: CircleDollarSign },
      { title: "Procurement and Cost", href: "/ptepi/cost", icon: Wrench }
    ]
  },
  {
    title: "Operations",
    items: [
      { title: "Service Contracts", href: "/ptepi/service-contracts", icon: ClipboardCheckIcon }
    ]
  },
  {
    title: "ATLAS",
    items: [
      { title: "Nexa Intelligence", href: "/ptepi/ask-atlas", icon: BrainCircuit },
      { title: "Action Tracker", href: "/ptepi/actions", icon: ListChecks }
    ]
  }
];

/**
 * The project screens exist for every project, but the sidebar links point at
 * the hero project, so any /ptepi/project/<id> page highlights its sidebar item.
 */
export function getActiveNavHref(pathname: string): string | null {
  const path = pathname.replace(/\/+$/, "");
  if (/^\/ptepi\/project\/[^/]+\/evidence$/.test(path)) return `${HERO_PROJECT_PATH}/evidence`;
  if (/^\/ptepi\/project\/[^/]+$/.test(path)) return HERO_PROJECT_PATH;
  return findActiveNavHref(extractNavHrefs(PTEPI_NAV), path);
}

/** Title of the current screen, shown in the top bar. */
export function getScreenTitle(pathname: string): string {
  const active = getActiveNavHref(pathname);
  const item = PTEPI_NAV.flatMap((section) => section.items).find((node) => node.href === active);
  return item?.title ?? "ATLAS x EPI";
}

const PROJECT_ROUTE = /^\/ptepi\/project\/([^/]+)(\/evidence)?$/;

/** Project id in a project route, or null on any other screen. */
export function getProjectIdFromPath(pathname: string): string | null {
  const match = PROJECT_ROUTE.exec(pathname.replace(/\/+$/, ""));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Screens that show one project at a time, so the top bar offers a project switcher. */
export function isProjectScreen(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "");
  return getProjectIdFromPath(path) !== null || path === "/ptepi/commercial" || path === "/ptepi/cost";
}

/** Same screen for another project. Screens without a project in the URL stay where they are. */
export function switchProjectPath(pathname: string, projectId: string): string {
  const path = pathname.replace(/\/+$/, "");
  const match = PROJECT_ROUTE.exec(path);
  return match ? `/ptepi/project/${projectId}${match[2] ?? ""}` : path;
}

/** Point the sidebar links of the project screens at the selected project. */
export function withProject(href: string, projectId: string): string {
  return href.startsWith(HERO_PROJECT_PATH) ? href.replace(HERO_PROJECT_PATH, `/ptepi/project/${projectId}`) : href;
}
