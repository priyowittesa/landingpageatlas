"use client";

import { useLayoutEffect, type ReactNode } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronsRight } from "lucide-react";
import NavItem from "@/components/layout/dasbhoard/NavItem";
import {
  ResponsiveSidebarProvider,
  useSidebar
} from "@/components/layout/dasbhoard/ResponsiveSidebarProvider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";
import { PTEPI_NAV, getActiveNavHref, withProject } from "../navigation";
import { DEFAULT_PROJECT_ID, useProjectStore } from "../store/project-store";
import { useActionsStore } from "../store/actions-store";
import { useSyncProjectFromPath } from "./ProjectFilter";
import { PtepiTopbar } from "./PtepiTopbar";

/**
 * Public shell of the prototype. It reuses the ATLAS sidebar items and the
 * responsive sidebar state, but not `Sidebar`, `AppLayout` or `UserMenu`,
 * which call the auth API and would redirect a logged-out visitor.
 */
/** Full-bleed chat workspace, like Synergy Intelligence: no page padding, no page scroll. */
const WORKSPACE_PATH = "/ptepi/ask-atlas";

export function PtepiShell({ children }: { children: ReactNode }) {
  return (
    <ResponsiveSidebarProvider>
      <ShellFrame>{children}</ShellFrame>
    </ResponsiveSidebarProvider>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  useSyncProjectFromPath();
  const { collapsed } = useSidebar();
  const workspace = usePathname() === WORKSPACE_PATH;

  // Restore saved actions once, before any screen effect (such as seeding) runs.
  useLayoutEffect(() => {
    void useActionsStore.persist.rehydrate();
  }, []);

  return (
    <div className={cn("ptepi-app text-gray-900", workspace ? "h-screen overflow-hidden" : "min-h-screen")}>
      <PtepiSidebar />
      <div
        className={cn(
          workspace ? "h-screen" : "min-h-screen",
          "flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <PtepiTopbar />
        <main
          className={
            workspace
              ? "flex min-h-0 flex-1 flex-col overflow-hidden"
              : "mx-auto w-full max-w-7xl flex-1 p-6"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}

function PtepiSidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed, sidebarOpen, setSidebarOpen } = useSidebar();
  const isMobile = useIsMobile();
  const projectId = useProjectStore((state) => state.projectId) ?? DEFAULT_PROJECT_ID;
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

        <nav className="sidebar-scroll flex h-full flex-col space-y-4 overflow-y-auto px-2 py-4">
          {PTEPI_NAV.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-1">
              {collapsed ? (
                sectionIndex > 0 && <div className="border-t border-primary-800 py-2" />
              ) : (
                <h3 className="px-3 pb-1 text-xs font-medium tracking-wider text-gray-400">
                  {section.title}
                </h3>
              )}
              {section.items.map((item) => (
                <NavItem
                  key={item.title}
                  node={{ ...item, href: item.href ? withProject(item.href, projectId) : item.href }}
                  activeHref={activeHref}
                />
              ))}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="px-4 pb-5">
            <div className="space-y-1 rounded-xl border border-primary-700 bg-white/5 p-3 backdrop-blur-sm text-center text-white">
              <span className="text-sm font-semibold">ATLAS x EPI</span>
              <p className="text-xs">
                Contractor PMO prototype for PT Energi Pelabuhan Indonesia. Synthetic data.
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
