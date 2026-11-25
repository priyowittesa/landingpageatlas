"use client";

import { useT } from "./Tr";
import { useLanguageStore } from "../store/language-store";
import { useLayoutEffect, type ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronsRight } from "lucide-react";
import type { NavNode } from "@/components/layout/dasbhoard/navigation";
import { PtepiNavItem } from "./PtepiNavItem";
import { ModuleAlertsProvider, type SignalRef } from "./module-alerts";
import type { EpiAction } from "../store/actions-store";
import {
  ResponsiveSidebarProvider,
  useSidebar
} from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { PTEPI_NAV, getActiveNavHref, withProject } from "../navigation";
import { useProjectStore } from "../store/project-store";
import { useActionsStore } from "../store/actions-store";
import { useSyncProjectFromPath } from "./ProjectFilter";
import { PtepiTopbar } from "./PtepiTopbar";
import { NexaFab } from "./NexaFab";
import { NexaChatDrawer } from "./NexaChatDrawer";
import type { Answer, QuestionId } from "../ask-atlas/types";

/**
 * Public shell of the prototype. It reuses the ATLAS sidebar items and the
 * responsive sidebar state, but not `Sidebar`, `AppLayout` or `UserMenu`,
 * which call the auth API and would redirect a logged-out visitor.
 */
type PtepiShellProps = {
  children: ReactNode;
  signalRefs: SignalRef[];
  seeds: EpiAction[];
  answers: Record<QuestionId, Answer>;
};

export function PtepiShell({ children, signalRefs, seeds, answers }: PtepiShellProps) {
  return (
    <ResponsiveSidebarProvider>
      <ModuleAlertsProvider refs={signalRefs} seeds={seeds}>
        <ShellFrame answers={answers}>{children}</ShellFrame>
      </ModuleAlertsProvider>
    </ResponsiveSidebarProvider>
  );
}

function ShellFrame({ children, answers }: { children: ReactNode; answers: Record<QuestionId, Answer> }) {
  useSyncProjectFromPath();
  const { collapsed } = useSidebar();

  // Restore saved actions once, before any screen effect (such as seeding) runs.
  useLayoutEffect(() => {
    void useActionsStore.persist.rehydrate();
    void useLanguageStore.persist.rehydrate();
  }, []);

  return (
    <div className="ptepi-app min-h-screen text-gray-900">
      <PtepiSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <PtepiTopbar />
        <main className="w-full flex-1 px-6 py-6 lg:px-15">{children}</main>
        <NexaFab />
        <NexaChatDrawer answers={answers} />
      </div>
    </div>
  );
}

/** Sidebar node in the interface language, with project-aware links, children included. */
function localizeNode(
  node: NavNode,
  t: (text: string) => string,
  projectId: string | null
): NavNode & { tierHref?: string } {
  return {
    ...node,
    tierHref: node.href,
    title: t(node.title),
    href: node.href ? withProject(node.href, projectId) : node.href,
    children: node.children?.map((child) => localizeNode(child, t, projectId))
  };
}

function PtepiSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, sidebarOpen, setSidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const t = useT();
  const projectId = useProjectStore((state) => state.projectId);
  const rawActive = getActiveNavHref(pathname);
  const activeHref = rawActive ? withProject(rawActive, projectId) : null;

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-primary-800 bg-gradient-to-b from-primary-900 via-primary-900 to-primary-800 shadow-xl transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "relative flex items-center gap-2.5 py-3",
            collapsed ? "justify-center" : "justify-start px-4"
          )}
        >
          <Image src="/atlas-logo.svg" alt="Atlas Logo" width={32} height={32} />
          {!collapsed && (
            <span className="text-nowrap text-xl font-semibold text-white">ATLAS</span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "absolute right-0 flex translate-x-1/2 cursor-pointer items-center justify-center rounded-full bg-primary-700",
              collapsed ? "h-5.5 w-5.5" : "h-7 w-7",
              isMobile && !sidebarOpen && "hidden"
            )}
          >
            <ChevronsRight
              size={16}
              color="white"
              className={collapsed ? "rotate-0 transition-all duration-150" : "-rotate-180"}
            />
          </button>
        </div>

        <nav className="sidebar-scroll flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto px-2 py-4">
          {PTEPI_NAV.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-1">
              {collapsed ? (
                sectionIndex > 0 && <div className="border-t border-primary-800 py-2" />
              ) : (
                <h3 className="px-3 pb-1 text-xs font-medium tracking-wider text-gray-400">
                  {t(section.title)}
                </h3>
              )}
              {section.items.map((item) => (
                <PtepiNavItem key={item.title} node={localizeNode(item, t, projectId)} activeHref={activeHref} />
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-4 pb-5">
            <div className="space-y-1 rounded-xl border border-primary-700 bg-white/5 p-3 backdrop-blur-sm text-center text-white">
              <span className="text-sm font-semibold">ATLAS x EPI</span>
              <p className="text-xs">
                {t("Contractor PMO prototype for PT Energi Pelabuhan Indonesia. Synthetic data.")}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
