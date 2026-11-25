import {
  Boxes,
  BrainCircuit,
  Cable,
  CircleDollarSign,
  Folder,
  ClipboardCheckIcon,
  Gauge,
  History,
  LayoutGrid,
  Sparkles,
  ShieldCheckIcon,
  Workflow,
  Wrench
} from "lucide-react";
import {
  extractNavHrefs,
  findActiveNavHref,
  type NavNode,
  type NavSection
} from "@/components/layout/dasbhoard/navigation";

/** The project the project-level screens open on from the sidebar. */
export const HERO_PROJECT_PATH = "/ptepi/project/PNP126";

/** Sidebar of the public prototype. Same NavNode shape as the ATLAS app sidebar. */
export const PTEPI_NAV: NavSection[] = [
  {
    title: "Workspace",
    items: [
      { title: "Operations Intelligence", href: "/ptepi/actions", icon: Sparkles },
      { title: "Portfolio Health", href: "/ptepi/portfolio", icon: LayoutGrid }
    ]
  },
  {
    title: "Modules",
    items: [
      {
        title: "Delivery",
        icon: Gauge,
        defaultOpen: true,
        children: [
          { title: "Project Cockpit", href: HERO_PROJECT_PATH, icon: Gauge },
          { title: "Evidence Gate", href: `${HERO_PROJECT_PATH}/evidence`, icon: ShieldCheckIcon }
        ]
      },
      {
        title: "Commercial",
        icon: CircleDollarSign,
        defaultOpen: true,
        children: [
          { title: "Commercial and Billing", href: "/ptepi/commercial", icon: CircleDollarSign },
          { title: "Procurement and Cost", href: "/ptepi/cost", icon: Wrench }
        ]
      },
      { title: "Service Contracts", href: "/ptepi/service-contracts", icon: ClipboardCheckIcon },
      { title: "Nexa Intelligence", href: "/ptepi/ask-atlas", icon: BrainCircuit },
      {
        title: "Workflow & Connections",
        icon: Cable,
        defaultOpen: true,
        children: [
          { title: "Knowledge Base", href: "/ptepi/knowledge-base", icon: Folder },
          { title: "Knowledge Source", href: "/ptepi/knowledge-source", icon: Folder },
          { title: "Master Connection", href: "/ptepi/connections", icon: Boxes },
          { title: "Workflow Studio", href: "/ptepi/workflows", icon: Workflow }
        ]
      },
      { title: "Audit Log", href: "/ptepi/audit-log", icon: History }
    ]
  }
];

/** Screens the sidebar keeps in the spotlight, with an AI badge, even when they are not open. */
export const HIGHLIGHTED_HREFS = ["/ptepi/actions"];

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

/** Every nav node, groups and their children, in sidebar order. */
export function flattenNav(nodes: NavNode[]): NavNode[] {
  return nodes.flatMap((node) => [node, ...flattenNav(node.children ?? [])]);
}

/** Title of the current screen, shown in the top bar. */
export function getScreenTitle(pathname: string): string {
  const active = getActiveNavHref(pathname);
  const item = flattenNav(PTEPI_NAV.flatMap((section) => section.items)).find((node) => node.href === active);
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

/** Screens with an "All projects" default that a ?project=<id> link can pre-filter. */
export const PROJECT_FILTER_PATHS = ["/ptepi/commercial", "/ptepi/cost"];

const HERO_PROJECT_ID = HERO_PROJECT_PATH.split("/").pop() ?? "PNP126";

/**
 * Sidebar links follow the selected project: the project screens open on it (the hero
 * project when none is chosen), Commercial and Cost open filtered with ?project=<id>.
 */
export function withProject(href: string, projectId: string | null): string {
  if (href.startsWith(HERO_PROJECT_PATH)) {
    return href.replace(HERO_PROJECT_PATH, `/ptepi/project/${projectId ?? HERO_PROJECT_ID}`);
  }
  return projectId && PROJECT_FILTER_PATHS.includes(href) ? `${href}?project=${projectId}` : href;
}
